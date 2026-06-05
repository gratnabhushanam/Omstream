import { apiClient } from './client';

export const sendAiChat = async (message, customAiKey, language = 'en') => {
  const response = await apiClient.post('/api/chat', { message, customAiKey, language });
  return response.data;
};
