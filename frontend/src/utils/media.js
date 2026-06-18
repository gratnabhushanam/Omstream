const YOUTUBE_HOST_PATTERN = /(youtu\.be|youtube\.com)/i;

export const resolveMediaUrl = (input) => {
  if (!input) return '';
  if (typeof input === 'string') return input;
  return input.videoUrl || input.youtubeUrl || input.url || '';
};

export const getYoutubeVideoId = (input) => {
  const url = resolveMediaUrl(input);
  if (!url) return null;

  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const isYoutubeUrl = (input) => YOUTUBE_HOST_PATTERN.test(resolveMediaUrl(input));

export const getYoutubeEmbedUrl = (input) => {
  const videoId = getYoutubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};