import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KrishnaSVG from '../assets/krishna-scene.svg';
import axios from 'axios';
import { Trophy, CheckCircle, XCircle, ArrowRight, RefreshCcw, Loader, Clock, BrainCircuit } from 'lucide-react';
import { ENV } from '../config/env';

export default function Quiz() {
  const API_BASE_URL = ENV.API_BASE_URL || '';
  const [quizSet, setQuizSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answersMap, setAnswersMap] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const videoId = queryParams.get('videoId');
  const setId = queryParams.get('setId');

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, setId]);

  useEffect(() => {
    if (timeLeft === null || showScore || loading) return;
    if (timeLeft <= 0) {
      submitQuizResults();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showScore, loading]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      if (setId) {
        // Fetch new QuizSet structure
        const response = await axios.get(`${API_BASE_URL}/api/quiz/sets/${setId}`, {
           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setQuizSet(response.data.quiz);
        setQuestions(response.data.questions || []);
        if (response.data.quiz?.timeLimit > 0) {
           setTimeLeft(response.data.quiz.timeLimit);
        }
      } else if (videoId) {
        // Legacy Support
        const response = await axios.get(`${API_BASE_URL}/api/quiz/${videoId}`);
        setQuestions(Array.isArray(response.data) ? response.data : []);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to load quiz', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerOptionClick = (optionText, index) => {
    setSelectedAnswer(index);
    const qId = questions[currentQuestion]._id || questions[currentQuestion].id;
    
    // Store user answer
    setAnswersMap(prev => ({ ...prev, [qId]: optionText }));

    setTimeout(() => {
      const next = currentQuestion + 1;
      if (next < questions.length) {
        setCurrentQuestion(next);
        setSelectedAnswer(null);
      } else {
        submitQuizResults();
      }
    }, 1000);
  };

  const submitQuizResults = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Auto-submit remaining unanswered questions as null
      const finalAnswers = { ...answersMap };
      if (selectedAnswer !== null) {
         const qId = questions[currentQuestion]._id || questions[currentQuestion].id;
         finalAnswers[qId] = questions[currentQuestion].options[selectedAnswer] || questions[currentQuestion].options[selectedAnswer]?.answerText;
      }

      let response;
      if (setId) {
        response = await axios.post(
          `${API_BASE_URL}/api/quiz/sets/${setId}/submit`,
          { answers: finalAnswers, timeSpent: quizSet?.timeLimit ? quizSet.timeLimit - timeLeft : 0 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/quiz/submit`,
          { videoId, answers: finalAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setSubmissionResult(response.data);
      setScore(response.data.score);
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setShowScore(true);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
     if (seconds < 0) return '0:00';
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading && !showScore) {
    return (
      <div className="min-h-screen bg-[#06101E] pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
        <img src={KrishnaSVG} alt="Krishna Scene" className="w-full max-w-xs absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-70" style={{ zIndex: 1 }} />
        <div className="text-center z-10">
          <Loader className="w-12 h-12 text-[#FFD700] mx-auto mb-4 animate-spin" />
          <p className="text-[#FFD700] font-black text-lg uppercase tracking-widest">Loading Divine Knowledge...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#06101E] pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
        <div className="text-center z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl">
          <BrainCircuit className="w-16 h-16 text-[#FFD700] mx-auto mb-6 opacity-80" />
          <p className="text-[#FFD700] font-bold text-2xl mb-4">No quiz available right now.</p>
          <button onClick={() => navigate('/quizzes')} className="tv-focusable mt-4 bg-[#FFD700] text-[#06101E] px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            Explore Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06101E] pt-24 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      <img src={KrishnaSVG} alt="Krishna Scene" className="w-full max-w-xs absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-20" style={{ zIndex: 1 }} />
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF9F1C]/10 rounded-full blur-[100px]"></div>
      
      {timeLeft !== null && !showScore && (
         <div className="fixed top-20 left-0 right-0 z-50 flex justify-center">
            <div className={`px-6 py-2 rounded-full border backdrop-blur-xl shadow-lg flex items-center gap-3 font-bold text-lg transition-all ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-[#06101E]/80 border-[#FFD700]/30 text-[#FFD700]'}`}>
               <Clock className="w-5 h-5" />
               {formatTime(timeLeft)}
            </div>
         </div>
      )}

      <div 
        className="max-w-3xl w-full bg-white/5 backdrop-blur-2xl border border-[#FFD700]/20 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative z-10 preserve-3d transition-all duration-500 ease-out"
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -3;
          const rotateY = ((x - centerX) / centerX) * 3;
          card.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(2000px) rotateX(0) rotateY(0)';
        }}
      >
        {showScore ? (
          <div className="text-center animate-in zoom-in duration-500">
            <Trophy className="w-32 h-32 text-[#FFD700] mx-auto mb-8 drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]" />
            <h2 className="text-5xl font-serif font-black text-white mb-6 uppercase tracking-tighter">Quiz <span className="text-[#FFD700]">Completed!</span></h2>
            
            <div className="text-2xl mb-8 flex flex-col justify-center items-center gap-2">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Final Score</span>
              <div className="flex items-baseline gap-2">
                 <span className="text-[#FFD700] font-black text-6xl">{score}</span>
                 <span className="text-gray-500 font-bold text-3xl">/ {questions.length}</span>
              </div>
            </div>

            {submissionResult && submissionResult.pointsEarned > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-8 inline-block">
                 <p className="text-green-400 font-black uppercase tracking-widest text-lg">+{submissionResult.pointsEarned} Karma Points Earned!</p>
              </div>
            )}

            <button
              onClick={() => navigate('/quizzes')}
              className="tv-focusable bg-gradient-to-r from-[#FFD700] to-[#FF9F1C] text-[#06101E] px-10 py-4 rounded-full font-black text-lg tracking-widest uppercase hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              <RefreshCcw className="w-5 h-5" />
              More Quizzes
            </button>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
              <div>
                 {quizSet && <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest mb-1">{quizSet.category}</p>}
                 <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                   {quizSet?.title || 'Gita Challenge'}
                 </h1>
              </div>
              <div className="text-lg font-black px-5 py-2 bg-[#06101E]/50 rounded-xl border border-white/10 text-white">
                <span className="text-[#FFD700]">{currentQuestion + 1}</span>
                <span className="text-gray-500 opacity-50">/{questions.length}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full mb-10 overflow-hidden">
               <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF9F1C] transition-all duration-500" style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}></div>
            </div>

            <div className="mb-10 min-h-32 flex items-center">
              <h2 className="text-2xl md:text-3xl text-white font-medium leading-relaxed">
                {questions[currentQuestion].questionText || questions[currentQuestion].question}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentQuestion].options.map((option, index) => {
                const optionText = typeof option === 'string' ? option : option.answerText;
                
                let buttonStyle = 'bg-white/5 text-gray-200 hover:bg-[#FFD700]/10 hover:border-[#FFD700]/50 border-white/10';
                if (selectedAnswer !== null) {
                  if (selectedAnswer === index) {
                    buttonStyle = 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]';
                  } else {
                    buttonStyle = 'bg-black/20 text-gray-600 border-white/5 opacity-40';
                  }
                }
                
                return (
                  <button
                    key={index}
                    tabIndex={0}
                    onClick={() => selectedAnswer === null && handleAnswerOptionClick(optionText, index)}
                    disabled={selectedAnswer !== null}
                    className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-[#FFD700] border p-6 rounded-2xl text-left text-lg font-medium transition-all duration-300 flex justify-between items-center group relative overflow-hidden preserve-3d ${buttonStyle}`}
                    onMouseMove={(e) => {
                      if (selectedAnswer !== null) return;
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = ((y - centerY) / centerY) * -10;
                      const rotateY = ((x - centerX) / centerX) * 10;
                      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                    }}
                  >
                    {selectedAnswer === index && <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-transparent"></div>}
                    <span className="relative z-10">{optionText}</span>
                    {selectedAnswer === index && <CheckCircle className="w-6 h-6 text-[#FFD700] relative z-10" />}
                    {selectedAnswer === null && <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#FFD700] relative z-10" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
