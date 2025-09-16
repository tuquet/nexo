import type { AiScriptWriteForm } from '#/views/features/ai-script-writer/ai-script-writer.data';

import { ref } from 'vue';

import { message } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { generateScriptContent } from '#/services/ai.api';
import {
  defaultGenresOptionKeys,
  defaultLanguageOptionKeys,
  defaultScriptTypeOptionKeys,
} from '#/views/features/ai-script-writer/ai-script-writer.data';

export const useAiScriptWriterFeatureStore = defineStore(
  'ai-script-writer-feature',
  () => {
    const isGettingIdea = ref(false);

    async function getRandomIdea(
      provider: 'chatGPT' | 'gemini' = 'gemini',
    ): Promise<null | Partial<AiScriptWriteForm>> {
      isGettingIdea.value = true;
      if (!provider) {
        message.error('Vui lòng cấu hình API key trong trang Cài đặt.');
        isGettingIdea.value = false;
        return null;
      }

      const prompt = `
        Tạo một ý tưởng kịch bản độc đáo.
        QUAN TRỌNG: Chỉ trả về một đối tượng JSON, không có văn bản nào khác.

        Sử dụng cấu trúc và các giá trị cho phép sau:
        - idea: string (tóm tắt ý tưởng bằng tiếng Việt)
        - scriptType: array<string> (chọn 1 từ: ${JSON.stringify(defaultScriptTypeOptionKeys)})
        - genres: array<string> (chọn 1-2 từ: ${JSON.stringify(defaultGenresOptionKeys)})
        - language: array<string> (chọn 1 từ: ${JSON.stringify(defaultLanguageOptionKeys)})
        - context: string (bối cảnh ngắn gọn)
        - mainCharacter: array<string> (tên nhân vật)
        - topic: array<string> (chủ đề)
      `;

      try {
        const result = await generateScriptContent({
          prompt,
          provider,
          temperature: 0.3,
        });

        if (result.error) {
          message.error(`Lỗi khi lấy ý tưởng: ${result.error}`);
          return null;
        }

        const jsonRegex = /```json\n([\s\S]*?)\n```|(\{[\s\S]*\})/;
        const match = result.content.match(jsonRegex);

        if (match) {
          const jsonString = match[1] ?? match[2];
          return JSON.parse(jsonString || '{}') as Partial<AiScriptWriteForm>;
        }
        message.warning('Phản hồi từ AI không chứa đối tượng JSON hợp lệ.');
        return null;
      } catch (error: any) {
        message.error(
          `Lỗi hệ thống khi lấy ý tưởng: ${error.message || 'Unknown error'}`,
        );
        return null;
      } finally {
        isGettingIdea.value = false;
      }
    }

    function $reset() {}

    return {
      isGettingIdea,
      getRandomIdea,
      $reset,
    };
  },
);
