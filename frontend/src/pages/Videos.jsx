import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import MediaPlayerHLS from '../components/MediaPlayerHLS';
import VideoCard from '../components/VideoCard';
import { socket } from '../services/socket';

export default function Videos() {
  const { t } = useLanguage();
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('all');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await axios.get('/api/videos');
        setVideos(data);
        if (!data || data.length === 0) {
          setError('No videos found. Please check back later or upload new content.');
        }
      } catch (err) {
        setError('Failed to load videos. Please try again later.');
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();

    const handleContentUpdate = (data) => {
      if (data && (data.type === 'videos' || data.type === 'movies')) {
        console.log('[SOCKET] Videos updated, refreshing...');
        fetchVideos();
      }
    };
    socket.on('content_updated', handleContentUpdate);

    return () => {
      socket.off('content_updated', handleContentUpdate);
    };
  }, []);

  useEffect(() => {
    const openVideoId = location.state?.openVideoId;
    if (!openVideoId || videos.length === 0 || activeVideo) return;

    const matchedVideo = videos.find((video) => String(video._id || video.id) === String(openVideoId));
    if (matchedVideo) {
      setActiveVideo(matchedVideo);
    }
  }, [location.state, videos, activeVideo]);

  const closeVideo = () => setActiveVideo(null);

  const collections = ['all', ...Array.from(new Set(videos.map((item) => String(item.collectionTitle || 'Bhagavad Gita').trim()).filter(Boolean)))];
  const filteredVideos = selectedCollection === 'all'
    ? videos
    : videos.filter((item) => String(item.collectionTitle || 'Bhagavad Gita').trim() === selectedCollection);

  return (
    <div className="min-h-screen bg-[#06101E] pt-20 sm:pt-24 tv:pt-36 pb-16 sm:pb-12 px-4 sm:px-6 lg:px-8 tv:px-16">
      <div className="max-w-7xl tv:max-w-[1800px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl tv:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 cursor-default">
            Divine Discourses
          </h1>
          <p className="text-gray-400 text-base sm:text-lg tv:text-2xl max-w-2xl tv:max-w-4xl mx-auto">Watch insightful explanations and stories from the Bhagavad Gita by realized souls.</p>
        </div>

        {loading ? (
          <div className="flex justify-center flex-col items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-yellow-500 animate-pulse">Loading Devotional Videos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-400 text-lg font-bold mb-2">{error}</p>
          </div>
        ) : (
          <>
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            {collections.map((collection) => (
              <button
                key={collection}
                type="button"
                onClick={() => setSelectedCollection(collection)}
                className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCollection === collection ? 'bg-devotion-gold/20 border-devotion-gold/50 text-devotion-gold' : 'bg-white/5 border-white/15 text-gray-300 hover:border-devotion-gold/40 hover:text-white'}`}
              >
                {collection === 'all' ? 'All Collections' : collection}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 lg:grid-cols-3 tv:grid-cols-4 gap-5 sm:gap-8 tv:gap-10">
            {filteredVideos.map(video => (
              <button
                key={video._id}
                type="button"
                onClick={() => setActiveVideo(video)}
                className="text-left"
              >
                <VideoCard 
                  title={`${t(video, 'title')}${video.collectionTitle ? ` • ${video.collectionTitle}` : ''}`}
                  url={video.url}
                  description={t(video, 'description')}
                />
              </button>
            ))}
          </div>
          </>
        )}
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6">
          <div className="my-6 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#0B1F3A] p-6 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] max-h-[92vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-devotion-gold/70">video</p>
                <h2 className="mt-2 text-3xl font-serif font-bold text-white">{t(activeVideo, 'title')}</h2>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-devotion-gold/80">{activeVideo.collectionTitle || 'Bhagavad Gita'}</p>
              </div>
              <button
                type="button"
                onClick={closeVideo}
                className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/25"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <MediaPlayerHLS
                  url={activeVideo.videoUrl || activeVideo.url}
                  hlsUrl={activeVideo.hlsUrl}
                  title={t(activeVideo, 'title')}
                  className="w-full aspect-video"
                  youtubeParams="autoplay=1&rel=0&modestbranding=1"
                  controls
                  autoPlay
                />
              </div>
              <p className="text-sm leading-7 text-white/80">{t(activeVideo, 'description') || 'No description available.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
