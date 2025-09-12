import type { Ref } from 'vue';

import { computed, onUnmounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';
import { nanoid } from 'nanoid';
import PQueue from 'p-queue';

interface YtDlpRawMetadata {
  thumbnail?: string;
  title: string;
  webpage_url: string;
}

interface DownloadProgressPayload {
  key: string;
  percent: number;
  title: null | string;
}

interface DownloadCompletePayload {
  filePath: null | string;
  key: string;
  outputPath: string;
  title: null | string;
}

export interface DownloadJob {
  cookieFilePath?: string;
  downloadPlaylist: boolean;
  error?: string;
  filePath?: null | string;
  id: string;
  isAudioOnly: boolean;
  outputPath: string;
  progress: number;
  status: 'downloading' | 'failed' | 'fetching' | 'pending' | 'success';
  thumbnail: string;
  title: string;
  url: string;
  useCookieFile: boolean;
}

/**
 * Callbacks for the DownloadManager to communicate with the UI layer.
 */
export interface DownloadManagerCallbacks {
  onJobAdded: (job: DownloadJob) => void;
  onJobRemoved: (jobId: string) => void;
  onJobUpdated: (job: DownloadJob) => void;
  onPlaylistExpanded: (placeholderId: string, newJobs: DownloadJob[]) => void;
}

/**
 * Settings for creating new download jobs, typically from a form.
 */
export interface DownloadSettings {
  cookieFilePath?: string;
  downloadPlaylist: boolean;
  isAudioOnly: boolean;
  outputPath: string;
  useCookieFile: boolean;
}

/**
 * Composable for managing video download jobs.
 * It handles queuing, fetching metadata, downloading, and progress updates.
 * @param formState A ref to the form state, used for settings like concurrency.
 * @param callbacks An object with functions to call for UI updates.
 */
export function useVideoDownloadManager(
  formState: Ref<{ concurrentDownloads: number }>,
  callbacks: DownloadManagerCallbacks,
) {
  const downloadQueue = ref<DownloadJob[]>([]);
  const isFetchingInfo = ref(false);
  let isComponentUnmounted = false;

  onUnmounted(() => {
    isComponentUnmounted = true;
    queue.clear();
  });

  const queue = new PQueue({
    concurrency: formState.value.concurrentDownloads,
  });

  watch(
    () => formState.value.concurrentDownloads,
    (newConcurrency) => {
      queue.concurrency = newConcurrency;
    },
  );

  const activeDownloads = computed(() => queue.size);

  const downloadStats = computed(() => {
    const total = downloadQueue.value.length;
    const downloaded = downloadQueue.value.filter(
      (job) => job.status === 'success',
    ).length;
    return { total, downloaded };
  });

  /**
   * Processes a single download job. This function is added to the p-queue.
   * @param job The download job to process.
   */
  async function processJob(job: DownloadJob) {
    if (isComponentUnmounted) return;
    job.status = 'downloading';
    if (!isComponentUnmounted) callbacks.onJobUpdated(job);
    job.progress = 0;

    try {
      const unlistenProgress = window.electron.ipcRenderer.on(
        'video:download-progress',
        (_event: any, { key, percent }: DownloadProgressPayload) => {
          if (job.url === key) {
            job.progress = percent;
            if (!isComponentUnmounted) callbacks.onJobUpdated(job);
          }
        },
      );

      const completePayload = (await window.electron.ipcRenderer.invoke(
        'video:download-video',
        {
          jobId: job.id,
          videoUrl: job.url,
          outputPath: job.outputPath,
          isAudioOnly: job.isAudioOnly,
          downloadPlaylist: job.downloadPlaylist,
          useCookieFile: job.useCookieFile,
          cookieFilePath: job.cookieFilePath,
        },
      )) as DownloadCompletePayload;

      unlistenProgress();

      job.status = 'success';
      job.progress = 100;
      job.filePath = completePayload.filePath;
      if (!isComponentUnmounted) callbacks.onJobUpdated(job);
    } catch (error: unknown) {
      job.status = 'failed';

      let errorMessage: string;
      if (error && typeof error === 'object') {
        const code = 'code' in error ? String(error.code) : undefined;
        const messageText =
          'message' in error ? String(error.message) : undefined;

        const i18nKey = `page.videoDownloader.errors.${code}`;
        const translatedError = code ? $t(i18nKey) : i18nKey;

        errorMessage =
          !code || translatedError === i18nKey
            ? messageText || $t('page.videoDownloader.errors.UNKNOWN_ERROR')
            : translatedError;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage =
          String(error) || $t('page.videoDownloader.errors.UNKNOWN_ERROR');
      }
      job.error = errorMessage;
      if (!isComponentUnmounted) callbacks.onJobUpdated(job);
    }
  }

  /**
   * Fetches metadata for all jobs currently in the 'fetching' state.
   * It replaces placeholder jobs with actual video jobs.
   */
  async function startFetchingJobs() {
    const jobsToFetch = downloadQueue.value.filter(
      (job) => job.status === 'fetching',
    );

    if (jobsToFetch.length === 0) {
      return;
    }

    isFetchingInfo.value = true;
    try {
      const fetchPromises = jobsToFetch.map(async (job) => {
        try {
          const videoInfos = (await window.electron.ipcRenderer.invoke(
            'video:get-formats',
            job.url,
            { downloadPlaylist: job.downloadPlaylist },
          )) as YtDlpRawMetadata[];

          const index = downloadQueue.value.findIndex((j) => j.id === job.id);
          if (index !== -1) {
            if (videoInfos.length === 0) {
              // Trường hợp không tìm thấy video
              job.status = 'failed';
              job.error = $t('page.videoDownloader.errors.UNKNOWN_ERROR');
              if (!isComponentUnmounted) callbacks.onJobUpdated(job);
            } else if (videoInfos.length === 1 && !job.downloadPlaylist) {
              // VIDEO ĐƠN LẺ: Cập nhật tác vụ giữ chỗ, giữ nguyên ID
              const info = videoInfos[0];
              const placeholderJob = downloadQueue.value[index];

              if (placeholderJob && info) {
                Object.assign(placeholderJob, {
                  url: info.webpage_url,
                  title: info.title || 'Unknown Title',
                  thumbnail: info.thumbnail || '',
                  status: 'pending',
                  progress: 0,
                  error: undefined,
                });

                if (!isComponentUnmounted)
                  callbacks.onJobUpdated(placeholderJob);
                queue.add(() => processJob(placeholderJob));
              }
            } else {
              // PLAYLIST: Thay thế tác vụ giữ chỗ bằng các tác vụ mới
              const newJobs: DownloadJob[] = videoInfos.map(
                (info: YtDlpRawMetadata) => ({
                  ...job,
                  id: nanoid(), // Các tác vụ mới cần ID mới
                  url: info.webpage_url,
                  title: info.title || 'Unknown Title',
                  thumbnail: info.thumbnail || '',
                  status: 'pending',
                  progress: 0,
                  error: undefined,
                }),
              );

              downloadQueue.value.splice(index, 1, ...newJobs);
              if (!isComponentUnmounted)
                callbacks.onPlaylistExpanded(job.id, newJobs);

              newJobs.forEach((newJob) => {
                queue.add(() => processJob(newJob));
              });
            }
          }
        } catch (error: unknown) {
          job.status = 'failed';

          let errorMessage: string;
          if (error && typeof error === 'object') {
            const code = 'code' in error ? String(error.code) : undefined;
            const messageText =
              'message' in error ? String(error.message) : undefined;

            const i18nKey = `page.videoDownloader.errors.${code}`;
            const translatedError = code ? $t(i18nKey) : i18nKey;

            errorMessage =
              !code || translatedError === i18nKey
                ? messageText || $t('page.videoDownloader.errors.UNKNOWN_ERROR')
                : translatedError;
          } else {
            errorMessage =
              String(error) || $t('page.videoDownloader.errors.UNKNOWN_ERROR');
          }
          job.error = errorMessage;
          if (!isComponentUnmounted) callbacks.onJobUpdated(job);
        }
      });

      await Promise.all(fetchPromises);
    } finally {
      isFetchingInfo.value = false;
    }
  }

  /**
   * Adds new jobs to the download queue based on a list of URLs and settings.
   * @param urls An array of video URLs to download.
   * @param values The settings from the form.
   */
  function addJobs(urls: string[], values: DownloadSettings) {
    if (urls.length === 0) {
      message.warning($t('page.videoDownloader.videoUrl.ruleRequired'));
      return;
    }

    const placeholderJobs: DownloadJob[] = [];
    urls.forEach((url) => {
      const job: DownloadJob = {
        id: nanoid(),
        url,
        title: url,
        thumbnail: '',
        status: 'fetching',
        progress: 0,
        ...values,
      };
      downloadQueue.value.push(job);
      placeholderJobs.push(job);
    });

    placeholderJobs.forEach((job) => callbacks.onJobAdded(job));
    startFetchingJobs();
  }

  /**
   * Removes a job from the queue.
   * @param jobId The ID of the job to remove.
   */
  function removeJob(jobId: string) {
    downloadQueue.value = downloadQueue.value.filter((job) => job.id !== jobId);
    if (!isComponentUnmounted) callbacks.onJobRemoved(jobId);
  }

  /**
   * Retries a failed job by setting its status to 'pending' and re-adding it to the queue.
   * @param job The job to retry.
   */
  function retryJob(job: DownloadJob) {
    job.status = 'pending';
    job.error = undefined;
    job.progress = 0;

    if (!isComponentUnmounted) callbacks.onJobUpdated(job);
    queue.add(() => processJob(job));
  }

  return {
    activeDownloads,
    isFetchingInfo,
    downloadStats,
    addJobs,
    removeJob,
    retryJob,
  };
}
