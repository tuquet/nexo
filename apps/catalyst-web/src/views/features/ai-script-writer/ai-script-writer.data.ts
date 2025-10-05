import { ref } from 'vue';

import { $t } from '#/locales';

export const defaultFormState = {
  apiProvider: 'gemini' as 'chatGPT' | 'gemini',
  idea: '',
  topic: [] as string[],
  scriptType: ['shortFilm'] as string[],
  language: ['vietnamese'] as string[],
  genres: [] as string[],
  expectedDuration: 200,
  mainCharacter: [] as string[],
  context: '',
  targetAudience: [] as string[],
  advancedSwitch: false,
  temperature: 0.3,
};

export type ScriptJob = typeof defaultFormState & {
  createdAt: string;
  error?: string;
  id: string;
  rawPrompt?: string;
  rawResponse?: any;
  scriptContent?: string;
  status: 'failed' | 'generating' | 'pending' | 'success';
  structuredContent?: AiScriptResponse;
};

export type AiScriptWriteForm = typeof defaultFormState;

/**
 * Định nghĩa cấu trúc dữ liệu cho một phân cảnh trong kịch bản.
 * Đây là một phần của schema mẫu cho kết quả trả về từ AI.
 */
export interface ScriptScene {
  /**
   * Mô tả hành động và diễn biến trong phân cảnh.
   */
  action: string;
  /**
   * Danh sách các đoạn hội thoại.
   */
  dialogue?: {
    character: string;
    line: string;
  }[];
  /**
   * Mô tả bối cảnh (nội/ngoại thất, địa điểm, thời gian).
   * @example "NỘI. PHÒNG THÍ NGHIỆM BỤI BẶM - ĐÊM"
   */
  setting: string;
  /**
   * Tiêu đề hoặc số thứ tự của phân cảnh.
   * @example "PHÂN CẢNH 1: SỰ KHÁM PHÁ"
   */
  title: string;
}

/**
 * Định nghĩa cấu trúc dữ liệu cho một gợi ý hình ảnh.
 */
export interface ImageSuggestion {
  /**
   * Mô tả chi tiết về hình ảnh cần tạo.
   * @example "Một cảnh quay cận cảnh của một cổ vật phát sáng trên bàn, tạo ra những bóng dài."
   */
  description: string;
  /**
   * Tham chiếu đến phân cảnh tương ứng trong kịch bản (nếu có).
   */
  scene_reference?: string;
}

/**
 * Schema mẫu cho kết quả JSON có thể trả về từ API của AI sau khi tạo kịch bản.
 * Trong tương lai, prompt có thể được cập nhật để yêu cầu AI trả về định dạng này.
 */
export interface AiScriptResponse {
  /**
   * Văn bản đầy đủ của kịch bản, đặc biệt cho các loại như bài viết, dàn ý.
   * Được định dạng bằng markdown.
   */
  full_script_text?: string;
  /**
   * Danh sách các gợi ý hình ảnh đi kèm.
   */
  image_suggestions?: ImageSuggestion[];
  /**
   * Tóm tắt ngắn gọn (logline) của kịch bản.
   */
  logline: string;
  /**
   * Kịch bản được chia thành các phân cảnh (dùng khi yêu cầu cấu trúc cho phim).
   */
  scenes?: ScriptScene[];
  /**
   * Tiêu đề chính của kịch bản.
   */
  title: string;
}

export const schemaForPromptObject = {
  _instructions: '重要：剧本用 `scenes`，文章用 `full_script_text`，二选一。',
  title: 'string (标题)',
  logline: 'string (简短摘要/meta描述)',
  scenes: [
    {
      title: 'string (例: "场景1：发现")',
      setting: 'string (例: "内. 实验室 - 夜晚")',
      action: 'string (场景动作/事件)',
      dialogue: [
        {
          character: 'string (角色名)',
          line: 'string (对话)',
        },
      ],
    },
  ],
  full_script_text: 'string (仅正文，不含标题)',
  image_suggestions: [
    {
      scene_reference: 'string (e.g., "SCENE 1")',
      description: 'string (AI绘图的详细提示)',
    },
  ],
};

export const getApiProviderOptions = () =>
  ref([
    {
      label: $t('page.aiScriptWriter.apiProvider.options.gemini'),
      value: 'gemini',
    },
    {
      label: $t('page.aiScriptWriter.apiProvider.options.chatGPT'),
      value: 'chatGPT',
    },
  ]);

export const defaultTopicOptionKeys = [
  'workAndCoffee',
  'challengesAndSolutions',
  'toolsAndTips',
  'perspectivesAndLessons',
  'funAndEntertainment',
  'discovery',
  'selfLearning',
];

export const defaultGenresOptionKeys = [
  'action',
  'comedy',
  'drama',
  'horror',
  'romance',
  'sciFi',
  'thriller',
  'adventure',
  'psychological',
  'detective',
];

export const defaultScriptTypeOptionKeys = [
  'shortFilm',
  'vlogOutline',
  'podcastScript',
  'post',
];

export const defaultLanguageOptionKeys = ['vietnamese', 'english'];

export const getDefaultLanguageOptions = () =>
  ref(
    defaultLanguageOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.language.options.${key}`),
      value: key,
    })),
  );

export const getDefaultGenresOptions = () =>
  ref(
    defaultGenresOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.genres.options.${key}`),
      value: key,
    })),
  );

export const getDefaultScriptTypeOptions = () =>
  ref(
    defaultScriptTypeOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.scriptType.options.${key}`),
      value: key,
    })),
  );

export const getDefaultTopicOptions = () =>
  ref(
    defaultTopicOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.topic.options.${key}`),
      value: key,
    })),
  );
