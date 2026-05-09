import { apiClient } from './client';

export const getMentorHistory = async () => {
  const response = await apiClient.get('/api/slokas/mentor/history');
  return response.data;
};

export const saveMentorHistory = async (entry) => {
  const response = await apiClient.post('/api/slokas/mentor/history', entry);
  return response.data;
};

export const getMentorSolution = async (problemId) => {
  const response = await apiClient.get(`/api/slokas/mentor?problem=${problemId}`);
  return response.data;
};

export const getRelatedMentorContent = async (problemId) => {
  const response = await apiClient.get(`/api/slokas/mentor/content?problem=${problemId}`);
  return response.data;
};

export const generateTTS = async (text, voiceType, customAiKey) => {
  const response = await apiClient.post('/api/ai/tts', {
    text,
    voiceType,
    customAiKey
  }, {
    responseType: 'arraybuffer'
  });
  return response.data;
};

export const sendAiChat = async (message, customAiKey, language = 'en') => {
  const response = await apiClient.post('/api/chat', { message, customAiKey, language });
  return response.data;
};
