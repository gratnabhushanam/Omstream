const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'Stories.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const target1 = fs.readFileSync(path.join(__dirname, 'target1.txt'), 'utf8');

const newContent1 = `                <div className="lg:col-span-8 space-y-8 pb-32">
                   {/* Cinematic Hero Header */}
                   <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] holographic-glow group" style={{ height: '60vh', minHeight: '400px' }}>
                      {activeStory.thumbnail && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110"
                          style={{ 
                            backgroundImage: \`url(\${activeStory.thumbnail})\`,
                            transform: \`translateY(\${scrollProgress * 0.5}px) scale(1.1)\` // Parallax
                          }} 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] via-[#06101E]/40 to-transparent" />
                      <div className="absolute bottom-10 left-10 right-10">
                         <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
                            <span className="px-4 py-1.5 bg-devotion-gold text-[#06101E] rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                               {activeStory.category || 'Spiritual'}
                            </span>
                            {activeStory.isKids && <span className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">KIDS MODE</span>}
                         </div>
                          <h1 className={\`text-5xl sm:text-7xl font-serif font-black text-white leading-tight mb-8 drop-shadow-2xl transition-all duration-500 \${isTranslating ? 'animate-pulse opacity-50' : 'animate-fade-in-up'}\`} style={{ animationDelay: '0.2s' }}>
                             {isTranslating ? 'Translating Divine Wisdom...' : (getLocalizedContent(activeStory.chapters?.[activeChapterIndex], 'chapter')?.title || getLocalizedContent(activeStory)?.title)}
                          </h1>
                          <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <button
                              onClick={() => handleToggleAudio(getLocalizedContent(activeStory.chapters?.[activeChapterIndex], 'chapter')?.content || getLocalizedContent(activeStory)?.content)}
                              className="inline-flex items-center gap-3 px-8 py-4 bg-devotion-gold text-[#06101E] rounded-full font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-105"
                            >
                              {isSpeaking ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                              {isSpeaking ? 'Pause Audio' : 'Play Audio'}
                            </button>
                            <button
                               onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
                               className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all hover:scale-105"
                            >
                               <BookOpenText className="w-5 h-5" /> Start Reading
                            </button>
                          </div>
                      </div>
                   </div>

                   {/* Story Options Toolbar */}
                   <div className="bg-[#0B1F3A]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-6 sticky top-24 z-40 shadow-2xl">
                       <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
                          {languages.map(lang => (
                             <button
                               key={lang.code}
                               onClick={() => handleLanguageChange(lang.code)}
                               className={\`shrink-0 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all \${selectedLanguage === lang.code ? 'bg-devotion-gold text-[#06101E] border-devotion-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}\`}
                             >
                               {lang.native}
                             </button>
                          ))}
                       </div>
                       
                       <div className="flex items-center gap-4">
                           <button
                             onClick={toggleWatchlist}
                             className={\`p-3 rounded-xl border transition-all \${isInWatchlist ? 'bg-devotion-gold/20 text-devotion-gold border-devotion-gold' : 'border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}\`}
                             title="Save Story"
                           >
                             <Bookmark className={\`w-5 h-5 \${isInWatchlist ? 'fill-current' : ''}\`} />
                           </button>
                           
                           <div className="hidden sm:flex items-center gap-1 bg-[#051121] rounded-xl p-1 border border-white/5">
                             {[
                               { id: 'saikumar', label: 'Tollywood' },
                               { id: 'krishna', label: 'Soothing' },
                               { id: 'ram', label: 'Gentle' },
                               { id: 'hanuman', label: 'Strong' }
                             ].map(v => (
                               <button
                                 key={v.id}
                                 onClick={() => {
                                   setSelectedVoice(v.id);
                                   if (isSpeaking && audioRef.current) { audioRef.current.pause(); audioRef.current = null; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setIsSpeaking(false); }
                                 }}
                                 className={\`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all \${selectedVoice === v.id ? 'bg-[#FF7A00] text-[#06101E] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}
                               >
                                 {v.label}
                               </button>
                             ))}
                           </div>
                       </div>
                   </div>

                   {/* Cinematic Reading Content */}
                   <div className="px-4 sm:px-10 py-10 relative">
                      {/* Left timeline tracking line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-devotion-gold/20 to-transparent hidden sm:block" />
                      <div 
                        className="absolute left-0 top-0 w-1 bg-devotion-gold shadow-[0_0_15px_rgba(255,215,0,0.8)] hidden sm:block transition-all duration-300"
                        style={{ height: \`\${scrollProgress}%\` }}
                      />

                      {isTranslating ? (
                        <div className="space-y-12 animate-pulse">
                          {[1,2,3].map(i => (
                            <div key={i} className="bg-white/5 rounded-3xl p-8 border border-white/10">
                               <div className="h-4 bg-white/10 rounded-full w-full mb-4" />
                               <div className="h-4 bg-white/10 rounded-full w-5/6 mb-4" />
                               <div className="h-4 bg-white/10 rounded-full w-4/6" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-12">
                           {cinematicParagraphs.length === 0 && (
                             <p className="text-xl sm:text-2xl leading-relaxed text-white/90 font-serif whitespace-pre-wrap">
                               Seeking wisdom...
                             </p>
                           )}
                           {cinematicParagraphs.map((paragraph, index) => (
                              <React.Fragment key={index}>
                                <div className="group relative bg-transparent hover:bg-white/[0.02] p-6 sm:p-10 rounded-[3rem] transition-all duration-700 border border-transparent hover:border-white/5 tilt-on-hover">
                                   <p className={\`text-xl sm:text-2xl leading-[1.8] text-gray-200 font-serif transition-colors duration-500 group-hover:text-white \${index === 0 ? 'drop-cap' : ''}\`}>
                                      {renderCinematicText(paragraph)}
                                   </p>
                                </div>
                                
                                {/* Content Breaks */}
                                {index > 0 && index % 3 === 0 && index !== cinematicParagraphs.length - 1 && (
                                   <div className="py-12 flex justify-center">
                                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-devotion-gold to-transparent shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                                   </div>
                                )}
                                {index > 0 && index % 5 === 0 && index !== cinematicParagraphs.length - 1 && (
                                   <div className="my-16 relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-[3rem] p-10 overflow-hidden text-center holographic-glow">
                                      <Sparkles className="w-8 h-8 text-devotion-gold mx-auto mb-6 opacity-80" />
                                      <p className="text-2xl font-serif text-white italic leading-relaxed max-w-2xl mx-auto">
                                        "\${paragraph.substring(0, 100)}..."
                                      </p>
                                      <p className="text-devotion-gold text-[10px] font-black uppercase tracking-[0.3em] mt-6">Divine Highlight</p>
                                   </div>
                                )}
                              </React.Fragment>
                           ))}
                        </div>
                      )}
                   </div>

                   {/* Takeaways */}
                   {getLocalizedContent(activeStory.chapters?.[activeChapterIndex])?.takeaways?.length > 0 && (
                     <div className="mt-20 pt-16 border-t border-white/10 px-4 sm:px-10">
                        <h4 className="flex items-center gap-4 text-devotion-gold font-black text-sm uppercase tracking-[0.3em] mb-12">
                           <Sparkles className="w-6 h-6 animate-pulse" /> Spiritual Takeaways
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                           {getLocalizedContent(activeStory.chapters[activeChapterIndex]).takeaways.map((item, i) => (
                             <div key={i} className="bg-glass-cinematic p-8 rounded-[2rem] flex items-start gap-6 group hover:border-devotion-gold/30 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-devotion-gold/10 flex items-center justify-center text-devotion-gold shrink-0 group-hover:bg-devotion-gold group-hover:text-[#06101E] transition-colors shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                                   {i === 0 ? <Heart className="w-5 h-5" /> : i === 1 ? <Star className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                                </div>
                                <p className="text-base text-gray-300 leading-relaxed font-serif pt-1">{item}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
`;

if (content.includes(target1.trim())) {
  content = content.replace(target1.trim(), newContent1.trim());
  fs.writeFileSync(targetFile, content);
  console.log("Success");
} else {
  console.log("Could not find target string.");
}
