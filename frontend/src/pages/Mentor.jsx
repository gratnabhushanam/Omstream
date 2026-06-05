import React from 'react';
import { Send } from 'lucide-react';
import { useMentor } from '../hooks/useMentor';
import { useLanguage } from '../context/LanguageContext';

export default function Mentor() {
  const {
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    messagesEndRef,
    handleSendAiMessage
  } = useMentor();
  const { tLabel } = useLanguage();

  return (
    <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 sm:px-6 lg:px-8 tv:px-16 relative bg-[#06101E] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.2),transparent_30%)]"></div>
      
      <div className="max-w-4xl tv:max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-devotion-gold/30 bg-devotion-gold/10 text-devotion-gold text-[10px] tv:text-sm font-black tracking-[0.4em] uppercase mb-6">
            {tLabel('divineGuidance')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl tv:text-[10rem] font-serif font-black text-devotion-gold drop-shadow-2xl mb-4 tracking-tight uppercase leading-none">
            {tLabel('gitaMentor')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl tv:text-3xl text-gray-300 font-light font-serif italic max-w-2xl tv:max-w-4xl mx-auto mb-2">
            {tLabel('seekingGuidance')}
          </p>
        </div>

        {/* AI Chat Area */}
        <div className="bg-glass-gradient backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 md:p-10 border border-cyan-500/30 shadow-[0_0_80px_rgba(34,211,238,0.15)] animate-fade-in-up flex flex-col h-[60vh] md:h-[650px] tv:h-[850px]">
          
          {/* Header of Chatbot Card */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Krishna AI Mentor</span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto w-full pr-2 space-y-6 no-scrollbar">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                <div className="text-[6rem] mb-4 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] filter animate-pulse">🦚</div>
                <h3 className="text-2xl font-serif text-cyan-300 mb-2">Speak your heart...</h3>
                <p className="text-sm font-light text-gray-300 max-w-sm">
                  I am here to guide you through the ancient wisdom of the Bhagavad Gita. What troubles your mind today?
                </p>
              </div>
            )}
            
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-cyan-900/40 flex items-center justify-center mr-3 mt-1 shadow-[0_0_15px_rgba(34,211,238,0.3)] flex-shrink-0">
                    🦚
                  </div>
                )}
                <div className={`max-w-[85%] p-6 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-[#0B1E36] border border-blue-500/30 text-white rounded-br-sm shadow-[0_10px_30px_rgba(59,130,246,0.1)]' 
                    : 'bg-gradient-to-br from-[#0B1F3A] to-[#050B14] border border-cyan-500/40 text-cyan-50 font-serif leading-relaxed text-[15px] sm:text-[17px] rounded-bl-sm shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden'
                }`}>
                  {msg.role === 'ai' && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_70%)] animate-pulse"></div>
                  )}
                  {/* Render markdown roughly by splitting double asterisks/newlines */}
                  <div className="relative z-10">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-3 last:mb-0 leading-relaxed">
                        {line.split('**').map((part, j) => (
                          j % 2 === 1 
                            ? <strong key={j} className="text-cyan-300 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{part}</strong> 
                            : part.split('_').map((subPart, k) => (
                                k % 2 === 1 ? <em key={k} className="text-devotion-gold italic font-medium">{subPart}</em> : subPart
                              ))
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="flex w-full justify-start mt-4">
                <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-cyan-900/40 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse">🦚</div>
                <div className="bg-black/40 border border-cyan-500/20 px-6 py-4 rounded-3xl rounded-bl-sm flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                   <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100"></span>
                   <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="relative flex items-center bg-[#071324] backdrop-blur-md rounded-full border border-cyan-500/40 focus-within:border-cyan-400/80 shadow-[0_0_20px_rgba(0,100,200,0.2)] transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                placeholder="Ask Krishna for guidance..."
                disabled={isAiLoading}
                className="w-full bg-transparent border-none focus:outline-none text-white placeholder:text-gray-500 px-6 sm:px-8 py-4 sm:py-5 text-sm"
              />
              <button
                onClick={handleSendAiMessage}
                disabled={isAiLoading || !chatInput.trim()}
                className="absolute right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-3 rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
