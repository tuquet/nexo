import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

import { ipc } from '#/api/ipc';
import {
  defaultFormState,
  defaultGenresOptionKeys,
  defaultLanguageOptionKeys,
  defaultScriptTypeOptionKeys,
  defaultTopicOptionKeys,
} from '#/views/features/ai-script-writer/ai-script-writer.data';

export const useAiScriptWriterFeatureStore = defineStore(
  'ai-script-writer-feature',
  () => {
    const isLoading = ref(false);
    const generatedScript = ref('');
    const isGettingIdea = ref(false);
    const error = ref<null | string>(null);
    const formState = useStorage(
      'ai-script-writer-form-state',
      defaultFormState,
      undefined,
      { mergeDefaults: true },
    );

    const constructedPrompt = computed(() => {
      const {
        idea,
        topic,
        scriptType,
        language,
        genres,
        expectedDuration,
        mainCharacter,
        context,
        targetAudience,
        callToAction,
        textLayout,
        generateImage,
      } = formState.value;

      // This is an example of how the prompt could be constructed.
      // You can adjust this to better suit the needs of the AI model.
      const getLabelsFromKeys = (
        keys: null | string | string[] | undefined,
        i18nPrefix: string,
        defaultKeys: readonly string[],
      ) => {
        if (!keys) {
          return '';
        }
        const keysArray = Array.isArray(keys) ? keys : [keys];
        return keysArray
          .filter(Boolean) // Lọc ra các giá trị rỗng (ví dụ: [''])
          .map((key) => {
            // Only translate if the key is a known default key.
            // Otherwise, it's a custom tag, so use it as is.
            if (defaultKeys.includes(key)) {
              return $t(`${i18nPrefix}.${key}`);
            }
            return key;
          })
          .join(', ');
      };

      const scriptTypeLabels = getLabelsFromKeys(
        scriptType,
        'page.aiScriptWriter.scriptType.options',
        defaultScriptTypeOptionKeys,
      );
      const languageLabels = getLabelsFromKeys(
        language,
        'page.aiScriptWriter.language.options',
        defaultLanguageOptionKeys,
      );

      const promptLines = [
        $t('page.aiScriptWriter.prompt.base', { idea }),
        $t('page.aiScriptWriter.prompt.scriptInfo', {
          scriptType: scriptTypeLabels,
          language: languageLabels,
        }),
      ];

      const topicLabels = getLabelsFromKeys(
        topic,
        'page.aiScriptWriter.topic.options',
        defaultTopicOptionKeys,
      );
      if (topicLabels) {
        promptLines.push(
          $t('page.aiScriptWriter.prompt.topic', { topic: topicLabels }),
        );
      }

      const genresLabels = getLabelsFromKeys(
        genres,
        'page.aiScriptWriter.genres.options',
        defaultGenresOptionKeys,
      );
      if (genresLabels) {
        promptLines.push(
          $t('page.aiScriptWriter.prompt.genres', { genres: genresLabels }),
        );
      }
      promptLines.push(
        $t('page.aiScriptWriter.prompt.duration', {
          duration: expectedDuration,
        }),
      );
      if (mainCharacter?.length > 0) {
        const mainCharacterText = Array.isArray(mainCharacter)
          ? mainCharacter.join(', ')
          : mainCharacter;
        promptLines.push(
          $t('page.aiScriptWriter.prompt.mainCharacter', {
            mainCharacter: mainCharacterText,
          }),
        );
      }
      if (context) {
        promptLines.push($t('page.aiScriptWriter.prompt.context', { context }));
      }
      if (targetAudience?.length > 0) {
        const targetAudienceText = Array.isArray(targetAudience)
          ? targetAudience.join(', ')
          : targetAudience;
        promptLines.push(
          $t('page.aiScriptWriter.prompt.targetAudience', {
            targetAudience: targetAudienceText,
          }),
        );
      }
      if (callToAction) {
        promptLines.push(
          $t('page.aiScriptWriter.prompt.callToAction', { callToAction }),
        );
      }
      promptLines.push(
        textLayout
          ? $t('page.aiScriptWriter.textLayout.prompt.structuredLayout')
          : $t('page.aiScriptWriter.textLayout.prompt.naturalText'),
      );
      if (generateImage) {
        promptLines.push($t('page.aiScriptWriter.prompt.generateImage'));
      }
      return promptLines.join('\n');
    });

    async function generateScript() {
      isLoading.value = true;
      error.value = null;
      generatedScript.value = '';

      try {
        const result = await ipc.invoke('ai:generate-content', {
          prompt: constructedPrompt.value,
          provider: formState.value.apiProvider,
          temperature: formState.value.temperature,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        generatedScript.value = result.content;
      } catch (error_: any) {
        error.value = error_.message || 'An unknown error occurred.';
        generatedScript.value = ''; // Clear on error
      } finally {
        isLoading.value = false;
      }
    }

    async function getRandomIdea(): Promise<string> {
      isGettingIdea.value = true;
      try {
        // In a real scenario, this could be an API call.
        // For now, we simulate it with a timeout.
        return await new Promise((resolve) => {
          setTimeout(() => {
            const ideas = [
              'Một lập trình viên phát hiện ra một đoạn mã có thể thay đổi quá khứ, nhưng mỗi lần thay đổi lại tạo ra một hệ lụy không lường trước được.',
              'Một người bán hoa ở góc phố có khả năng nhìn thấy ký ức cuối cùng của người đã khuất thông qua những bông hoa họ từng chạm vào.',
              'Trong một thế giới nơi giấc mơ có thể được ghi lại và chia sẻ, một cô gái phát hiện ra một giấc mơ lạ đang lan truyền như virus và thay đổi thực tại.',
              'Một đầu bếp già cố gắng tái tạo lại một món ăn thất truyền từ thời thơ ấu của mình, và cuộc hành trình đưa ông trở về với những bí mật của gia đình.',
            ];
            const randomIdea =
              ideas[Math.floor(Math.random() * ideas.length)] || '';
            resolve(randomIdea);
          }, 1000);
        });
      } finally {
        isGettingIdea.value = false;
      }
    }

    function $reset() {}

    return {
      isLoading,
      generatedScript,
      isGettingIdea,
      error,
      constructedPrompt,
      generateScript,
      getRandomIdea,
      $reset,
    };
  },
);
