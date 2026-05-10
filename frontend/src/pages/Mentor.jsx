import React, { useState } from 'react';
import { Target, AlertTriangle, MessageSquarePlus, Wind, Zap, PlayCircle, BookOpen, X, Bookmark, Volume2, Pause, ChevronRight, FileText, Film } from 'lucide-react';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import { useMentor } from '../hooks/useMentor';
import { useLanguage } from '../context/LanguageContext';

export default function Mentor() {
  const {
    selectedProblem,
    loading,
    solution,
    relatedContent,
    mentorHistory,
    showVideo,
    setShowVideo,
    language,
    setLanguage,
    voiceCharacter,
    setVoiceCharacter,
    isPlaying,
    canPlayAudio,
    playbackType,
    saveStatus,
    activeTab,
    setActiveTab,
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    messagesEndRef,
    handleSendAiMessage,
    fetchSolution,
    toggleAudio,
    isCurrentVerseSaved,
    handleToggleSaveVerse,
    getMeaningByLanguage,
    handleNavigateToContent
  } = useMentor();
  const { language: globalLang, setLanguage: setGlobalLang, tLabel } = useLanguage();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [customElevenLabsKey, setCustomElevenLabsKey] = useState(() => localStorage.getItem('elevenlabsApiKey') || '');

  const problems = [
    { id: 'stress', name: tLabel('stress'), icon: <Wind className="w-8 h-8" />, color: 'from-blue-500 to-cyan-400' },
    { id: 'fear', name: tLabel('fear'), icon: <AlertTriangle className="w-8 h-8" />, color: 'from-orange-500 to-red-400' },
    { id: 'anger', name: tLabel('anger'), icon: <Target className="w-8 h-8" />, color: 'from-red-600 to-rose-400' },
    { id: 'confusion', name: tLabel('confusion'), icon: <MessageSquarePlus className="w-8 h-8" />, color: 'from-purple-500 to-indigo-400' },
    { id: 'motivation', name: tLabel('motivation'), icon: <Zap className="w-8 h-8" />, color: 'from-[#FFD700] to-[#FF9F1C]' },
    { id: 'anxiety', name: tLabel('anxiety'), icon: <Wind className="w-8 h-8" />, color: 'from-teal-500 to-emerald-400' },
    { id: 'sadness', name: tLabel('sadness'), icon: <Wind className="w-8 h-8" />, color: 'from-indigo-500 to-purple-400' },
    { id: 'loneliness', name: tLabel('loneliness'), icon: <Target className="w-8 h-8" />, color: 'from-sky-500 to-blue-400' },
    { id: 'self-doubt', name: tLabel('selfDoubt'), icon: <AlertTriangle className="w-8 h-8" />, color: 'from-rose-500 to-pink-400' },
    { id: 'discipline', name: tLabel('discipline'), icon: <Zap className="w-8 h-8" />, color: 'from-emerald-600 to-teal-400' },
    { id: 'depression', name: tLabel('depression'), icon: <Wind className="w-8 h-8" />, color: 'from-slate-600 to-gray-500' },
    { id: 'focus', name: tLabel('focus'), icon: <Target className="w-8 h-8" />, color: 'from-amber-500 to-yellow-400' },
    { id: 'overthinking', name: tLabel('overthinking'), icon: <MessageSquarePlus className="w-8 h-8" />, color: 'from-violet-500 to-purple-400' },
    { id: 'failure', name: tLabel('failure'), icon: <AlertTriangle className="w-8 h-8" />, color: 'from-gray-600 to-slate-400' },
    { id: 'success', name: tLabel('success'), icon: <Zap className="w-8 h-8" />, color: 'from-yellow-500 to-[#FFD700]' },
    { id: 'relationships', name: tLabel('relationships'), icon: <MessageSquarePlus className="w-8 h-8" />, color: 'from-pink-500 to-rose-400' },
    { id: 'purpose', name: tLabel('purpose'), icon: <Target className="w-8 h-8" />, color: 'from-emerald-500 to-green-400' },
    { id: 'peace', name: tLabel('peace'), icon: <Wind className="w-8 h-8" />, color: 'from-cyan-500 to-blue-300' },
    { id: 'confidence', name: tLabel('confidence'), icon: <Zap className="w-8 h-8" />, color: 'from-orange-500 to-yellow-400' },
  ];

  return (
    <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 sm:px-6 lg:px-8 tv:px-16 relative bg-[#06101E] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.2),transparent_30%)]"></div>
      <div className="max-w-5xl tv:max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-14 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-devotion-gold/30 bg-devotion-gold/10 text-devotion-gold text-[10px] tv:text-sm font-black tracking-[0.4em] uppercase mb-6">
            {tLabel('divineGuidance')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl tv:text-[10rem] font-serif font-black text-devotion-gold drop-shadow-2xl mb-4 tracking-tight uppercase leading-none">
            {tLabel('gitaMentor')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl tv:text-3xl text-gray-300 font-light font-serif italic max-w-2xl tv:max-w-4xl mx-auto mb-6">
            {tLabel('seekingGuidance')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-1 rounded-full border border-devotion-gold/20 flex w-full max-w-md shadow-2xl">
            <button
              onClick={() => setActiveTab('curated')}
              tabIndex={0}
              className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex-1 py-3 px-6 rounded-full text-xs tv:text-sm font-black uppercase tracking-widest transition-all ${
                activeTab === 'curated' 
                  ? 'bg-gradient-to-r from-[#B66A2A] to-[#E6C38A] text-[#06101E] shadow-[0_0_20px_rgba(230,195,138,0.4)]' 
                  : 'text-gray-400 hover:text-devotion-gold'
              }`}
            >
              {tLabel('curatedVerses')}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              tabIndex={0}
              className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex-1 py-3 px-6 rounded-full text-xs tv:text-sm font-black uppercase tracking-widest transition-all ${
                activeTab === 'ai' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                  : 'text-gray-400 hover:text-devotion-gold'
              }`}
            >
              {tLabel('aiMentor')}
            </button>
          </div>
        </div>

        {activeTab === 'ai' ? (
          <div className="bg-glass-gradient backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 md:p-10 border border-cyan-500/30 shadow-[0_0_80px_rgba(34,211,238,0.15)] animate-fade-in-up flex flex-col h-[60vh] md:h-[600px] tv:h-[800px]">
            <div className="flex-1 overflow-y-auto w-full pr-4 space-y-6 no-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                  <div className="text-[6rem] mb-4 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] filter">🦚</div>
                  <h3 className="text-2xl font-serif text-cyan-300 mb-2">Speak your heart...</h3>
                  <p className="text-sm font-light text-gray-300 max-w-sm">I am here to guide you through the ancient wisdom of the Bhagavad Gita. What troubles your mind today?</p>
                </div>
              )}
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-cyan-900/40 flex items-center justify-center mr-3 mt-1 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      🦚
                    </div>
                  )}
                  <div className={`max-w-[85%] p-6 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-devotion-darkBlue border border-blue-500/30 text-white rounded-br-sm shadow-[0_10px_30px_rgba(59,130,246,0.1)]' 
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

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="relative flex items-center bg-devotion-darkBlue/80 backdrop-blur-md rounded-full border border-cyan-500/40 focus-within:border-cyan-400/80 shadow-[0_0_20px_rgba(0,100,200,0.2)] transition-colors">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                  placeholder="Ask Krishna for guidance..."
                  disabled={isAiLoading}
                  className="w-full bg-transparent border-none focus:outline-none text-white placeholder:text-gray-500 px-8 py-5"
                />
                <button
                  onClick={handleSendAiMessage}
                  disabled={isAiLoading || !chatInput.trim()}
                  className="absolute right-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-3 rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                  Seek
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Problem Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 tv:gap-10 mb-16">
          {problems.map(problem => (
            <button
              key={problem.id}
              tabIndex={0}
              onClick={() => fetchSolution(problem.id)}
              className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold flex flex-col items-center justify-center p-6 md:p-8 tv:p-12 rounded-[2rem] tv:rounded-[3rem] transition-all duration-300 ease-out transform active:scale-95 border preserve-3d ${selectedProblem === problem.id ? 'bg-gradient-to-br ' + problem.color + ' text-white scale-[1.03] shadow-[0_0_40px_rgba(255,215,0,0.18)] border-white/30' : 'bg-glass-gradient backdrop-blur-3xl text-gray-300 hover:text-devotion-gold border-white/5 hover:border-devotion-gold/40 shadow-xl'}`}
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -12;
                const rotateY = ((x - centerX) / centerX) * 12;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
              }}
            >
              <div className={`mb-4 transition-all duration-500 ${selectedProblem === problem.id ? 'text-white scale-125' : 'text-devotion-gold'}`}>
                {React.cloneElement(problem.icon, { className: 'w-8 h-8 tv:w-14 tv:h-14' })}
              </div>
              <span className="font-black text-[10px] tv:text-base uppercase tracking-[0.2em]">{problem.name}</span>
            </button>
          ))}
        </div>

        {/* Solution Area */}
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-devotion-gold shadow-[0_0_20px_rgba(255,215,0,0.4)]"></div>
          </div>
        ) : solution ? (
          <div className="bg-glass-gradient backdrop-blur-3xl rounded-[3rem] p-8 md:p-16 border border-devotion-gold/30 shadow-[0_0_100px_rgba(0,0,0,0.4)] animate-fade-in-up relative overflow-hidden group">
            <div className="absolute top-0 right-0 opacity-5 text-[15rem] -rotate-12 translate-x-20 translate-y-20 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🕉️</div>
            
            <div className="relative z-10">
              {/* 1. Main Sloka Card */}
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-4 mb-8">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-devotion-gold/40"></div>
                  <h3 className="text-devotion-gold font-black tracking-[0.4em] uppercase text-[10px]">Sacred Verse</h3>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-devotion-gold/40"></div>
                </div>
                
                <p className="text-3xl md:text-5xl font-serif text-white leading-relaxed mb-6 italic drop-shadow-lg">
                  {solution.sanskrit && solution.sanskrit.split('\n').map((line, i) => <span key={i} className="block mb-2">{line}</span>)}
                </p>
                {solution.transliteration && (
                  <p className="text-lg md:text-xl font-light text-gray-400 italic font-serif max-w-3xl mx-auto">
                    {solution.transliteration}
                  </p>
                )}
              </div>

              {/* 2. Meaning Card & Guidance */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-blue-500/40 transition-colors group/box shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover/box:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 border border-white/10 px-3 py-1 rounded-full bg-white/5">
                      Language: {globalLang.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Divine Meaning</h4>
                  <p className={`text-white text-lg font-medium leading-relaxed ${globalLang === 'te' ? 'font-telugu text-xl' : globalLang === 'hi' ? 'font-hindi' : ''}`}>
                    {getMeaningByLanguage(solution, globalLang)}
                  </p>
                </div>

                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-devotion-gold/40 transition-colors group/box shadow-2xl">
                  <div className="w-10 h-10 bg-devotion-gold/10 rounded-xl flex items-center justify-center mb-6 border border-devotion-gold/20 group-hover/box:scale-110 transition-transform">
                    <MessageSquarePlus className="w-5 h-5 text-devotion-gold" />
                  </div>
                  <h4 className="text-devotion-gold text-[10px] font-black uppercase tracking-[0.2em] mb-4">Krishna's Guidance</h4>
                  <p className="text-white text-lg font-bold leading-relaxed mb-2">
                    {solution.translations?.[globalLang]?.guidance || solution.mentorTitle}
                  </p>
                  <p className="text-gray-300 text-base leading-relaxed italic">
                    "{solution.translations?.[globalLang]?.tip || solution.mentorTip}"
                  </p>
                </div>
              </div>

              {/* 3. Practical Daily Solution & Modern Insight */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-green-500/40 transition-colors group/box shadow-2xl">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20 group-hover/box:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <h4 className="text-green-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Daily Application</h4>
                  <p className="text-white text-lg font-medium leading-relaxed mb-4">
                    {solution.translations?.[globalLang]?.example || solution.realLifeExample}
                  </p>
                  <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-green-500/70 mb-2">Practical Practice</p>
                    <p className="text-sm text-gray-300">
                      {solution.translations?.[globalLang]?.practice || solution.mentorPractice}
                    </p>
                  </div>
                </div>

                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-cyan-500/40 transition-colors group/box shadow-2xl">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover/box:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{tLabel('aiGuidance')}</h4>
                  <p className="text-white text-lg font-light leading-relaxed">
                    {solution.translations?.[globalLang]?.insight || solution.simpleExplanation}
                  </p>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-white/10 flex flex-col lg:flex-row gap-6 justify-between items-center">
                <div className="flex flex-wrap gap-3">
                  {solution.tags && solution.tags.map(tag => (
                    <span key={tag} className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1 rounded-full uppercase text-[9px] font-black tracking-widest text-gray-400">#{tag}</span>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAudio}
                      disabled={!canPlayAudio}
                      className={`tv-focusable ${canPlayAudio ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'} flex items-center gap-3 px-8 py-4 tv:px-10 tv:py-5 rounded-2xl transition-all font-black text-xs tv:text-sm uppercase tracking-widest shadow-xl`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 tv:w-7 tv:h-7" /> : <Volume2 className="w-5 h-5 tv:w-7 tv:h-7 text-devotion-gold" />}
                      {isPlaying ? tLabel('stop') : tLabel('listenWithAi')}
                    </button>
                    
                    {/* Voice Character Selector */}
                    <select
                      value={voiceCharacter}
                      onChange={(e) => setVoiceCharacter(e.target.value)}
                      className="tv-focusable px-4 py-4 tv:px-6 tv:py-5 rounded-2xl bg-devotion-darkBlue/60 border border-devotion-gold/30 text-white font-black text-xs tv:text-sm uppercase tracking-widest hover:border-devotion-gold/60 transition-all focus:outline-none focus:border-devotion-gold"
                    >
                      <option value="krishna">🔵 {tLabel('krishnaVoice')}</option>
                      <option value="ram">🌟 {tLabel('ramVoice')}</option>
                      <option value="hanuman">🐵 {tLabel('hanumanVoice')}</option>
                      <option value="arjuna">⚔️ {tLabel('arjunaVoice')}</option>
                    </select>
                  </div>
                  <button
                    onClick={handleToggleSaveVerse}
                    className={`tv-focusable flex items-center gap-3 border px-8 py-4 tv:px-10 tv:py-5 rounded-2xl transition-all font-black text-xs tv:text-sm uppercase tracking-widest ${isCurrentVerseSaved ? 'bg-devotion-gold/20 border-devotion-gold/50 text-devotion-gold' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
                  >
                    <Bookmark className="w-5 h-5 tv:w-7 tv:h-7 text-devotion-gold" /> {isCurrentVerseSaved ? tLabel('saved') : tLabel('save')}
                  </button>
                  <button 
                    onClick={() => setShowVideo(true)}
                    disabled={!solution.recommendedVideo}
                    className={`tv-focusable flex items-center gap-3 px-8 py-4 tv:px-10 tv:py-5 rounded-2xl transition-all font-black text-xs tv:text-sm uppercase tracking-widest shadow-2xl ${solution.recommendedVideo ? 'bg-gradient-to-r from-devotion-gold to-[#FF9F1C] text-devotion-darkBlue hover:scale-105 shadow-[0_10px_30px_rgba(255,215,0,0.2)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
                  >
                    <PlayCircle className="w-6 h-6 tv:w-8 tv:h-8" fill="currentColor" /> {tLabel('recommendedVideo')}
                  </button>
                </div>
              </div>

              {saveStatus && (
                <p className="mt-4 text-center text-xs font-black uppercase tracking-widest text-devotion-gold">
                  {saveStatus}
                </p>
              )}

              {isPlaying && playbackType && (
                <p className={`mt-2 text-center text-[10px] font-black uppercase tracking-widest ${playbackType === 'file' ? 'text-devotion-gold' : 'text-sky-300'}`}>
                  Audio Source: {playbackType === 'file' ? 'File Audio' : 'Divine Narration'}
                </p>
              )}
            </div>

            {/* Video Modal */}
            {showVideo && solution.recommendedVideo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
                  <button 
                    onClick={() => setShowVideo(false)}
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <MediaPlayerHLS
                    url={solution.recommendedVideo.videoUrl || solution.recommendedVideo.youtubeUrl || solution.recommendedVideo.url}
                    hlsUrl={solution.recommendedVideo.hlsUrl}
                    title={solution.recommendedVideo.title}
                    className="w-full h-full object-cover bg-black"
                    youtubeParams="autoplay=1&rel=0&modestbranding=1"
                    autoPlay
                    controls
                  />
                </div>
              </div>
            )}

            {/* Related Verses */}
            {relatedContent.slokas && relatedContent.slokas.length > 0 && (
              <div className="mt-16 pt-12 border-t border-white/10">
                <h3 className="text-3xl font-serif font-black text-devotion-gold mb-6 tracking-tight uppercase">{tLabel('relatedVerses')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedContent.slokas.map((sloka) => (
                    <div
                      key={sloka.id}
                      onClick={() => handleNavigateToContent(sloka, 'sloka')}
                      className="tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold bg-devotion-darkBlue/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 transition-all cursor-pointer group shadow-xl preserve-3d"
                      onMouseMove={(e) => {
                        const card = e.currentTarget;
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -8;
                        const rotateY = ((x - centerX) / centerX) * 8;
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold mb-3 opacity-70 group-hover:opacity-100">
                        {sloka.chapter && sloka.verse ? `Ch ${sloka.chapter}: V ${sloka.verse}` : 'Sacred Verse'}
                      </p>
                      <p className="text-sm font-serif text-white mb-4 line-clamp-3 italic">{sloka.sanskrit}</p>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{getMeaningByLanguage(sloka, globalLang)}</p>
                      <div className="flex items-center text-devotion-gold text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {relatedContent.stories && relatedContent.stories.length > 0 && (
              <div className="mt-12">
                <h3 className="text-3xl font-serif font-black text-devotion-gold mb-6 tracking-tight uppercase flex items-center gap-3">
                  <FileText className="w-8 h-8" />{tLabel('relatedStories')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedContent.stories.map((story) => (
                    <div 
                      key={story.id} 
                      onClick={() => handleNavigateToContent(story, 'story')}
                      className="bg-devotion-darkBlue/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 transition-all cursor-pointer group shadow-xl preserve-3d"
                      onMouseMove={(e) => {
                        const card = e.currentTarget;
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -8;
                        const rotateY = ((x - centerX) / centerX) * 8;
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-3">Story</p>
                      <h4 className="text-lg font-serif font-black text-white mb-3 line-clamp-2">{story.title}</h4>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{story.summary || story.description}</p>
                      <div className="flex items-center text-devotion-gold text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        Read <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Videos */}
            {relatedContent.videos && relatedContent.videos.length > 0 && (
              <div className="mt-12">
                <h3 className="text-3xl font-serif font-black text-devotion-gold mb-6 tracking-tight uppercase flex items-center gap-3">
                  <Film className="w-8 h-8" />Related Videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedContent.videos.map((video) => (
                    <div 
                      key={video.id} 
                      onClick={() => handleNavigateToContent(video, 'video')}
                      className="bg-devotion-darkBlue/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 transition-all cursor-pointer group shadow-xl preserve-3d"
                      onMouseMove={(e) => {
                        const card = e.currentTarget;
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -8;
                        const rotateY = ((x - centerX) / centerX) * 8;
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 mb-3">Video</p>
                      <h4 className="text-lg font-serif font-black text-white mb-3 line-clamp-2">{video.title}</h4>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{video.description}</p>
                      <div className="flex items-center text-devotion-gold text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        Watch <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mentorHistory.length > 1 && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <h3 className="text-2xl font-serif font-black text-devotion-gold mb-6 tracking-tight uppercase">Previous Mentor Guidance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {mentorHistory.slice(1, 9).map((item, index) => (
                    <div key={`${item.problem}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-devotion-gold mb-2">{item.problem}</p>
                      <p className="text-sm text-white line-clamp-2 italic mb-2">{item.sanskrit}</p>
                      <p className="text-xs text-gray-300 line-clamp-2">{item.englishMeaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl backdrop-blur-sm bg-white/5">
            <p className="text-gray-400 font-serif italic text-lg">Select a problem above to seek divine guidance.</p>
          </div>
        )}
        </>
        )}
        
      </div>
    </div>
  );
}
