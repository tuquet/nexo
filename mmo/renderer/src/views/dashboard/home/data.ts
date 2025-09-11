import { router } from '#/router';

interface Feature {
  action: () => void;
  icon: string;
  key: string;
}

export const features: Feature[] = [
  {
    key: 'videoCutter',
    icon: 'https://cdn-icons-gif.flaticon.com/12749/12749758.gif',
    action: () => {
      router.push('/video-cutter');
    },
  },
  {
    key: 'videoDownloader',
    icon: 'https://cdn-icons-gif.flaticon.com/18559/18559564.gif',
    action: () => {
      router.push('/Video-downloader');
    },
  },
  {
    key: 'aiScriptWriter',
    icon: 'https://cdn-icons-gif.flaticon.com/17905/17905021.gif',
    action: () => {
      router.push('/ai-script-writer');
    },
  },
];
