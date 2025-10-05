import axios from 'axios';

import { useSettingsStore } from '#/store/settings';

interface AiResponse<T = any> {
  content: string;
  error?: string;
  rawResponse?: T;
}

export async function getApiKey(
  provider: 'chatGPT' | 'gemini',
): Promise<string> {
  const settingsStore = useSettingsStore();
  // Ensure keys are fetched if not already present.
  if (!settingsStore.apiKeys.openAI && !settingsStore.apiKeys.gemini) {
    await settingsStore.fetchApiKeys();
  }
  return provider === 'chatGPT'
    ? settingsStore.apiKeys.openAI
    : settingsStore.apiKeys.gemini;
}

async function callChatGPT(
  prompt: string,
  temperature: number,
): Promise<AiResponse> {
  const apiKey = await getApiKey('chatGPT');
  if (!apiKey) {
    return {
      content: '',
      error:
        'OpenAI API key is not set. Please go to Settings to add your key.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60_000, // 60 seconds timeout
      },
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in API response from OpenAI.');
    }
    return { content, rawResponse: response.data };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      'An unknown error occurred.';
    // Also return the raw error response if available
    return {
      content: '',
      error: errorMessage,
      rawResponse: error.response?.data,
    };
  }
}

async function callGeminiAPI(
  prompt: string,
  temperature: number,
): Promise<AiResponse> {
  const apiKey = await getApiKey('gemini');
  if (!apiKey) {
    return {
      content: '',
      error:
        'Gemini API key is not set. Please go to Settings to add your key.',
    };
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
      },
    );

    const candidate = response.data.candidates?.[0];
    if (!candidate) {
      const promptFeedback = response.data?.promptFeedback;
      if (promptFeedback?.blockReason) {
        const reason = promptFeedback.blockReason;
        return {
          content: '',
          error: `Your prompt was blocked for safety reasons: ${reason}. Please modify your prompt and try again.`,
        };
      }
      throw new Error('No content in API response from Gemini.');
    }

    const content = candidate.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No text content in API response from Gemini.');
    }
    return { content, rawResponse: response.data };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      'An unknown error occurred.';
    // Also return the raw error response if available
    return {
      content: '',
      error: errorMessage,
      rawResponse: error.response?.data,
    };
  }
}

export function generateScriptContent(payload: {
  prompt: string;
  provider: 'chatGPT' | 'gemini';
  temperature: number;
}): Promise<AiResponse> {
  if (payload.provider === 'chatGPT') {
    return callChatGPT(payload.prompt, payload.temperature);
  } else if (payload.provider === 'gemini') {
    return callGeminiAPI(payload.prompt, payload.temperature);
  } else {
    throw new Error('Invalid provider');
  }
}
