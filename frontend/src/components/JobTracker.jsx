import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, CheckCircle2, Clock, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/ai/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(data);
    } catch (error) {
      console.error('Error fetching AI jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && jobs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 italic">
        Loading AI task queue...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
         <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-devotion-gold" /> AI Task Monitor
         </h4>
         <span className="text-[10px] text-gray-500 uppercase tracking-widest">{jobs.filter(j => j.status === 'processing').length} Processing</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-xs italic text-center py-4">No recent AI jobs.</p>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 group hover:border-devotion-gold/20 transition-all">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        job.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400 animate-pulse'
                      }`}>
                        {job.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                         job.status === 'failed' ? <AlertCircle className="w-5 h-5" /> :
                         <RefreshCw className="w-5 h-5 animate-spin" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{job.contentType} {job.type}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">ID: {String(job.contentId).slice(-6)} • {new Date(job.createdAt).toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {job.status}
                      </span>
                   </div>
                </div>
                {job.status === 'processing' && (
                  <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${job.progress || 15}%` }}
                    />
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
