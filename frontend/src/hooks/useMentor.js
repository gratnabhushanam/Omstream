import { useState, useEffect, useRef } from 'react';
import { sendAiChat } from '../api/mentorApi';
import { useLanguage } from '../context/LanguageContext';

export const useMentor = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { language: globalLang } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiLoading]);

  const handleSendAiMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    
    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    const inputCopy = chatInput.trim();
    setChatInput('');
    setIsAiLoading(true);
    
    try {
      const customAiKey = localStorage.getItem('geminiApiKey') || '';
      const data = await sendAiChat(inputCopy, customAiKey, globalLang);
      const aiReply = { role: 'ai', content: data.reply || 'Divine connectivity interrupted.' };
      setChatMessages(prev => [...prev, aiReply]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const aiError = { role: 'ai', content: 'Forgive me, the spiritual connection is currently disrupted. Please try again or verify your API key in settings.' };
      setChatMessages(prev => [...prev, aiError]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    messagesEndRef,
    handleSendAiMessage
  };
};
