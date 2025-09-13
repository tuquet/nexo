import { ref } from 'vue';

// Type for the translation function
type TFunction = (key: string, ...args: any[]) => string;

export const defaultFormState = {
  apiProvider: 'gemini' as 'chatGPT' | 'gemini',
  idea: '',
  topic: [] as string[],
  scriptType: ['shortFilm'] as string[],
  language: ['vietnamese'] as string[],
  genres: [] as string[],
  expectedDuration: 5,
  mainCharacter: [] as string[],
  context: '',
  targetAudience: [] as string[],
  callToAction: '',
  textLayout: true,
  generateImage: false,
  advancedSwitch: false,
  temperature: 0.7,
};

export const defaultTopicOptionKeys = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const getDefaultTopicOptions = ($t: TFunction) =>
  ref(
    defaultTopicOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.topic.options.${key}`),
      value: key,
    })),
  );

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

export const getDefaultGenresOptions = ($t: TFunction) =>
  ref(
    defaultGenresOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.genres.options.${key}`),
      value: key,
    })),
  );

export const defaultScriptTypeOptionKeys = [
  'shortFilm',
  'vlogOutline',
  'podcastScript',
  'post',
];

export const getDefaultScriptTypeOptions = ($t: TFunction) =>
  ref(
    defaultScriptTypeOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.scriptType.options.${key}`),
      value: key,
    })),
  );

export const defaultLanguageOptionKeys = ['vietnamese', 'english'];

export const getDefaultLanguageOptions = ($t: TFunction) =>
  ref(
    defaultLanguageOptionKeys.map((key) => ({
      label: $t(`page.aiScriptWriter.language.options.${key}`),
      value: key,
    })),
  );
