import type { Ref } from 'vue';

import type { AiScriptWriteForm } from './ai-script-writer.data';

import { computed } from 'vue';

import { $t } from '#/locales';

import { jsonResponseSchemaForPrompt } from './ai-script-writer.data';

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
      callToAction,
      expectedDuration,
      generateImage,
      jsonOutput,
      textLayout,
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
    if (callToAction) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.callToAction', { callToAction }),
      );
    }
    if (expectedDuration) {
      promptParts.push(
        $t('page.aiScriptWriter.prompt.duration', {
          duration: expectedDuration,
        }),
      );
    }
    if (generateImage) {
      promptParts.push($t('page.aiScriptWriter.prompt.generateImage'));
    }
    if (textLayout) {
      promptParts.push(
        $t('page.aiScriptWriter.textLayout.prompt.structuredLayout'),
      );
    } else {
      promptParts.push($t('page.aiScriptWriter.textLayout.prompt.naturalText'));
    }

    if (jsonOutput) {
      // Add the JSON instruction at the end
      promptParts.push(
        $t('page.aiScriptWriter.prompt.jsonOutputInstruction', {
          schema: jsonResponseSchemaForPrompt,
        }),
      );
    }

    return promptParts.filter(Boolean).join(' ');
  });

  return {
    constructedPrompt,
  };
}
