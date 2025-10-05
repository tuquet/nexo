import type { Ref } from 'vue';

import type { AiScriptWriteForm } from './ai-script-writer.data';

import { computed } from 'vue';

import { $t } from '#/locales';

import { schemaForPromptObject } from './ai-script-writer.data';

export function useAiPrompt(formState: Ref<AiScriptWriteForm>) {
  const constructedPrompt = computed(() => {
    const state = formState.value;
    const {
      idea,
      scriptType,
      language,
      topic,
      genres,
      mainCharacter,
      context,
      targetAudience,
      expectedDuration,
    } = state;

    if (!idea) {
      return '';
    }

    const promptParts: string[] = [
      $t('page.aiScriptWriter.prompt.base', { idea }),
    ];

    promptParts.push(
      $t('page.aiScriptWriter.prompt.scriptInfo', {
        scriptType: scriptType.join(', '),
        language: language.join(', '),
      }),
    );

    if (topic?.length) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.topic', { topic: topic.join(', ') }),
      );
    }
    if (genres?.length) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.genres', { genres: genres.join(', ') }),
      );
    }
    if (mainCharacter?.length) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.mainCharacter', {
          mainCharacter: mainCharacter.join(', '),
        }),
      );
    }
    if (context) {
      promptParts.push($t('page.aiScriptWriter.prompt.context', { context }));
    }
    if (targetAudience?.length) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.targetAudience', {
          targetAudience: targetAudience.join(', '),
        }),
      );
    }
    if (expectedDuration) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.duration', {
          duration: expectedDuration,
        }),
      );
    }
    const jsonOutputContent = $t(
      'page.aiScriptWriter.prompt.jsonOutputInstruction',
      {
        schema: JSON.stringify(schemaForPromptObject),
      },
    );
    promptParts.push(jsonOutputContent);

    return promptParts.filter(Boolean).join(' ');
  });

  return {
    constructedPrompt,
  };
}
