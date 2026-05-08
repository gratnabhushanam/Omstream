import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Clock, BrainCircuit, Play, Search, Loader } from 'lucide-react';
import KrishnaSVG from '../assets/krishna-scene.svg';

export default function QuizList() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/quiz/sets`);
      setQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (filter === 'all') return true;
    return q.difficulty === filter;
  });

  return (
    <div className="min-h-screen bg-[#06101E] pt-20 sm:pt-24 tv:pt-36 pb-12 px-4 sm:px-6 tv:px-16 relative overflow-hidden">
      <img src={KrishnaSVG} alt="" className="w-full max-w-lg absolute top-0 right-0 pointer-events-none select-none opacity-20" style={{ zIndex: 1 }} />
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl tv:max-w-[1800px] mx-auto relative z-10">
        <div className="text-center mb-10 tv:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-7xl tv:text-9xl font-serif font-black text-white mb-4 sm:mb-6 uppercase tracking-tighter">
            Divine <span className="text-[#FFD700]">Challenges</span>
          </h1>
          <p className="text-gray-400 max-w-2xl tv:max-w-4xl mx-auto text-base sm:text-lg tv:text-2xl">Test your spiritual knowledge, earn points, and climb the leaderboards through our interactive quizzes based on the Bhagavad Gita and Vedic scriptures.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 tv:mb-16">
          {['all', 'easy', 'medium', 'hard'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 sm:px-6 tv:px-10 py-2 tv:py-4 rounded-full font-bold uppercase tracking-widest text-xs tv:text-base transition-all tv-focusable ${filter === f ? 'bg-[#FFD700] text-[#06101E] shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-12 h-12 text-[#FFD700] animate-spin" />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
            <BrainCircuit className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl text-white font-bold mb-2">No Quizzes Found</h3>
            <p className="text-gray-400">Check back later for more spiritual challenges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 lg:grid-cols-3 tv:grid-cols-4 gap-5 sm:gap-8 tv:gap-10">
            {filteredQuizzes.map(quiz => (
              <div 
                key={quiz._id} 
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-[#FFD700]/30 hover:bg-white/10 transition-all duration-300 group flex flex-col cursor-pointer preserve-3d" 
                onClick={() => navigate(`/quiz?setId=${quiz._id}`)}
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = ((y - centerY) / centerY) * -8;
                  const rotateY = ((x - centerX) / centerX) * 8;
                  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                }}
              >
                {quiz.thumbnail && (
                  <div className="w-full h-48 bg-black relative overflow-hidden">
                    <img src={quiz.thumbnail} alt={quiz.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06101E] to-transparent"></div>
                  </div>
                )}
                <div className={`p-8 flex flex-col flex-1 ${!quiz.thumbnail ? 'pt-10' : 'pt-4'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#FFD700]/30">{quiz.category}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : quiz.difficulty === 'medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{quiz.difficulty}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#FFD700] transition-colors">{quiz.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">{quiz.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#FFD700]"/> {quiz.questionCount || 0} Qs</span>
                       {quiz.timeLimit > 0 && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#FFD700]"/> {Math.floor(quiz.timeLimit / 60)}m</span>}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center text-[#06101E] transform group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                      <Play className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
