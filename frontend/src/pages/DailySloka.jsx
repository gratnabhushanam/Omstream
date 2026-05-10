import React, { useState } from 'react';
import { Bell, Volume2, Pause, BookOpen, Share2, Copy, CheckCircle, Bookmark, Trash2, ChevronLeft, CalendarDays, Settings, X } from 'lucide-react';
import { useDailySloka } from '../hooks/useDailySloka';
import { useLanguage } from '../context/LanguageContext';

export default function DailySloka() {
  const {
    dailySloka,
    loading,
    isPlaying,
    notificationEnabled,
    copied,
    history,
    savedVerses,
    saveStatus,
    playbackSource,
    selectedDateKey,
    showCalendar,
    setShowCalendar,
    MIN_DAILY_DATE_KEY,
    getTodayDateKey,
    openPreviousDay,
    handleDateSelection,
    enableNotifications,
    toggleAudio,
    copyToClipboard,
    shareSloka,
    handleToggleSaveVerse,
    handleLoadSavedVerse,
    handleRemoveSavedVerse,
    getMeaningByLanguage,
    getExplanationByLanguage,
    getExampleByLanguage,
    getVerseKey,
    stopPlayback
  } = useDailySloka();
  const { language: globalLang, setLanguage: setGlobalLang, languages, tLabel } = useLanguage();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [customElevenLabsKey, setCustomElevenLabsKey] = useState(() => localStorage.getItem('elevenlabsApiKey') || '');

  if (loading) {
    return (
      <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 flex items-center justify-center bg-[#06101E]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-devotion-gold"></div>
      </div>
    );
  }

  if (!dailySloka) {
    return (
      <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 flex items-center justify-center bg-[#06101E]">
        <p className="text-gray-400 text-lg">Unable to load today's sloka. Please verify API at /api/slokas/daily.</p>
      </div>
    );
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isCurrentVerseSaved = savedVerses.some((item) => item.verseKey === getVerseKey(dailySloka));

  return (
    <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-12 px-4 sm:px-6 lg:px-8 tv:px-16 relative bg-[#06101E] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.2),transparent_30%)]"></div>

      <div className="max-w-4xl tv:max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-devotion-gold/30 bg-devotion-gold/10 text-devotion-gold text-[10px] font-black tracking-[0.4em] uppercase mb-6">
            {tLabel('divineWisdom')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl tv:text-8xl font-serif font-black text-devotion-gold drop-shadow-2xl mb-4 tracking-tight uppercase">
            {tLabel('dailySloka')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl tv:text-2xl text-gray-300 font-light font-serif italic max-w-2xl mx-auto">
            {tLabel('gitaQuote')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={openPreviousDay}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> {tLabel('previousDay')}
            </button>
            <span className="px-4 py-2 rounded-xl border border-devotion-gold/30 bg-devotion-gold/10 text-devotion-gold text-[10px] font-black uppercase tracking-widest">
              {selectedDateKey}
            </span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Settings className="w-4 h-4" /> {tLabel('apiConfig')}
            </button>
          </div>
          
          {/* Collapsible Calendar */}
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/25 bg-white/5 hover:bg-white/10 text-gray-200 text-[10px] font-black uppercase tracking-widest transition-all hover:border-devotion-gold/50"
            >
              <CalendarDays className="w-4 h-4 text-devotion-gold" />
              <span>{showCalendar ? tLabel('hide') : tLabel('choose')} {tLabel('selectDate')}</span>
            </button>
            {showCalendar && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-devotion-gold/30 bg-devotion-darkBlue/60 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">{tLabel('selectDate')}:</span>
                <input
                  type="date"
                  value={selectedDateKey}
                  min={MIN_DAILY_DATE_KEY}
                  max={getTodayDateKey()}
                  onChange={handleDateSelection}
                  className="bg-transparent text-white text-xs font-bold outline-none px-2 py-1 rounded border border-devotion-gold/40 hover:border-devotion-gold/70 focus:border-devotion-gold transition-all"
                  aria-label="Choose daily sloka date"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Sloka Card */}
        <div 
          className="bg-glass-gradient backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 tv:p-20 border border-devotion-gold/30 shadow-[0_0_100px_rgba(0,0,0,0.4)] mb-12 animate-fade-in-up relative overflow-hidden group transition-all duration-300 ease-out preserve-3d"
          onMouseMove={(e) => {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
          }}
        >
          <div className="absolute top-0 right-0 opacity-5 text-[15rem] -rotate-12 translate-x-20 translate-y-20 select-none pointer-events-none">🕉️</div>

          <div className="relative z-10">
            {/* Sanskrit */}
            <div className="mb-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-devotion-gold mb-4">{tLabel('sacredVerse')}</p>
              <p className="text-3xl md:text-5xl font-serif text-white leading-relaxed italic mb-6 drop-shadow-lg" style={{ transform: 'translateZ(60px)' }}>
                {(dailySloka.sanskrit || '').split('\n').map((line, i) => (
                  <span key={i} className="block mb-2">
                    {line}
                  </span>
                ))}
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-devotion-gold/40 to-transparent mb-8"></div>
              <p className="text-sm md:text-base text-gray-400" style={{ transform: 'translateZ(30px)' }}>
                {dailySloka.chapter && dailySloka.verse && `${tLabel('chapter')} ${dailySloka.chapter}, ${tLabel('verse')} ${dailySloka.verse}`}
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex justify-center mb-10 flex-wrap gap-2 md:gap-3 px-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setGlobalLang(lang.code);
                    if (isPlaying) stopPlayback();
                  }}
                  className={`px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${globalLang === lang.code ? 'bg-devotion-gold text-devotion-darkBlue shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-105' : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  {lang.native || lang.label}
                </button>
              ))}
            </div>

            {/* Meaning */}
            <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 mb-10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-devotion-gold/50 group-hover:bg-devotion-gold transition-colors"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-4">{tLabel('meaning')}</p>
              <p className={`text-xl md:text-2xl text-gray-200 leading-relaxed font-light ${globalLang === 'te' ? 'font-telugu' : globalLang === 'hi' ? 'font-hindi' : ''}`}>
                {getMeaningByLanguage(dailySloka, globalLang)}
              </p>
            </div>

            {/* Explanation & Example */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {getExplanationByLanguage(dailySloka, globalLang) && (
                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-3">{tLabel('insight')}</p>
                    <p className="text-gray-200 leading-relaxed">{getExplanationByLanguage(dailySloka, globalLang)}</p>
                  </div>
              )}

              {getExampleByLanguage(dailySloka, globalLang) && (
                <div className="bg-devotion-darkBlue/40 backdrop-blur-md p-8 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-devotion-gold/10 rounded-xl flex items-center justify-center mb-4 border border-devotion-gold/20">
                      <CheckCircle className="w-5 h-5 text-devotion-gold" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold mb-3">{tLabel('wisdom')}</p>
                    <p className="text-gray-200 leading-relaxed">{getExampleByLanguage(dailySloka, globalLang)}</p>
                  </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={toggleAudio}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                {isPlaying ? tLabel('stop') : tLabel('listen')}
              </button>

              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${copied ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
              >
                <Copy className="w-5 h-5" />
                {copied ? tLabel('copied') : tLabel('copy')}
              </button>

              {canShare && (
                <button
                  onClick={shareSloka}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                >
                  <Share2 className="w-5 h-5" />
                  {tLabel('share')}
                </button>
              )}

              <button
                onClick={handleToggleSaveVerse}
                className={`flex items-center gap-3 border px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isCurrentVerseSaved ? 'bg-devotion-gold/20 border-devotion-gold/50 text-devotion-gold' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
              >
                <Bookmark className="w-5 h-5 text-devotion-gold" />
                {isCurrentVerseSaved ? tLabel('savedVerse') : tLabel('saveVerse')}
              </button>

              <button
                onClick={enableNotifications}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ml-auto ${notificationEnabled ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
              >
                <Bell className="w-5 h-5" />
                {notificationEnabled ? tLabel('notificationsOn') : tLabel('enableNotifications')}
              </button>
            </div>

            {saveStatus && (
              <p className="mt-4 text-center text-xs font-black uppercase tracking-widest text-devotion-gold">
                {saveStatus}
              </p>
            )}

            {isPlaying && playbackSource && (
              <p className={`mt-2 text-center text-[10px] font-black uppercase tracking-widest ${playbackSource === 'file' ? 'text-devotion-gold' : 'text-sky-300'}`}>
                Audio Source: {playbackSource === 'file' ? 'File Audio' : 'Divine Narration'}
              </p>
            )}

            {/* Tags */}
            {dailySloka.tags && dailySloka.tags.length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold mb-4">{tLabel('relatedTopics')}</p>
                <div className="flex flex-wrap gap-2">
                  {dailySloka.tags.map((tag) => (
                    <span key={tag} className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full uppercase text-[9px] font-black tracking-widest text-gray-400 hover:text-devotion-gold transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {history.length > 1 && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold mb-4">{tLabel('previous')}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {history.slice(1, 7).map((item) => (
                    <div 
                      key={`${item.dailyKey}-${item.id}`} 
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:bg-white/10 hover:border-devotion-gold/30 transition-all"
                      onClick={() => handleDateSelection({ target: { value: item.dailyKey } })}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-devotion-gold mb-2 flex items-center gap-2">
                        <CalendarDays className="w-3 h-3" /> {item.dailyKey}
                      </p>
                      <p className="text-sm text-white line-clamp-2 italic mb-2">{item.sanskrit}</p>
                      <p className="text-xs text-gray-300 line-clamp-2">{item.englishMeaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedVerses.length > 0 && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-devotion-gold mb-4">{tLabel('savedDailyVerses')}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {savedVerses.slice(0, 8).map((item) => (
                    <div key={item.verseKey} className="rounded-2xl border border-devotion-gold/25 bg-devotion-gold/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-devotion-gold mb-2">
                        {item.chapter && item.verse ? `${tLabel('chapter')} ${item.chapter}, ${tLabel('verse')} ${item.verse}` : item.dailyKey || tLabel('savedVerse')}
                      </p>
                      <p className="text-sm text-white line-clamp-2 italic mb-2">{item.sanskrit}</p>
                      <p className="text-xs text-gray-300 line-clamp-2 mb-3">{item.englishMeaning}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadSavedVerse(item)}
                          className="flex-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
                        >
                          {tLabel('open')}
                        </button>
                        <button
                          onClick={() => handleRemoveSavedVerse(item.verseKey)}
                          className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 hover:bg-red-400/20"
                          aria-label="Remove saved verse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A1A2F] border border-devotion-gold/30 rounded-3xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(255,215,0,0.1)]">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-serif text-devotion-gold mb-6 uppercase tracking-widest font-black">API Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-devotion-gold text-xs font-black uppercase tracking-widest mb-2">DeepSeek / OpenAI AI Key</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-devotion-gold focus:ring-1 focus:ring-devotion-gold outline-none transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-devotion-gold text-xs font-black uppercase tracking-widest mb-2">ElevenLabs API Key (TTS)</label>
                <input
                  type="password"
                  value={customElevenLabsKey}
                  onChange={(e) => setCustomElevenLabsKey(e.target.value)}
                  placeholder="sk_..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-devotion-gold focus:ring-1 focus:ring-devotion-gold outline-none transition-all font-mono text-sm"
                />
              </div>
              
              <button
                onClick={() => {
                  localStorage.setItem('geminiApiKey', customApiKey);
                  localStorage.setItem('elevenlabsApiKey', customElevenLabsKey);
                  setShowSettingsModal(false);
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-devotion-gold to-[#FF9F1C] text-[#06101E] font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg"
              >
                Save Keys
              </button>
            </div>
            
            <p className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
              These keys are stored locally in your browser and are used for custom AI features and narration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
