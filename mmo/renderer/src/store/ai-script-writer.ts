import { ref } from 'vue';

import { defineStore } from 'pinia';

export const useAiScriptWriterFeatureStore = defineStore(
  'ai-script-writer-feature',
  () => {
    const isGettingIdea = ref(false);

    async function getRandomIdea(): Promise<string> {
      isGettingIdea.value = true;
      try {
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
      isGettingIdea,
      getRandomIdea,
      $reset,
    };
  },
);
