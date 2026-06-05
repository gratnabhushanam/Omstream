const toPlain = (record) => (record && typeof record.toJSON === 'function' ? record.toJSON() : record);

const withMongoStyleId = (item) => {
  const plain = toPlain(item);
  if (!plain) return plain;
  const resolvedId = plain.id || (plain._id ? String(plain._id) : undefined);
  return {
    ...plain,
    id: resolvedId,
    _id: plain._id || resolvedId,
  };
};

const mapMovie = (movie) => {
  const plain = withMongoStyleId(movie);
  if (!plain) return plain;

  const fixUrl = (url) => {
    if (!url) return url;
    return url.replace(/http:\/\/localhost:8888/g, 'https://gitawisdom.onrender.com');
  };

  return {
    ...plain,
    videoUrl: fixUrl(plain.videoUrl || plain.youtubeUrl),
    youtubeUrl: fixUrl(plain.youtubeUrl || plain.videoUrl),
    url: fixUrl(plain.videoUrl || plain.youtubeUrl),
    hlsUrl: fixUrl(plain.hlsUrl),
  };
};

const mapStory = (story) => {
  const plain = withMongoStyleId(story);
  if (!plain) return plain;

  if (plain.chapters && Array.isArray(plain.chapters)) {
    const currentId = String(plain._id || plain.id);
    plain.chapters = plain.chapters.filter(ch => {
      if (!ch.folderId) return true;
      return String(ch.folderId) === currentId;
    });
  }

  return {
    ...plain,
    description: plain.description || plain.summary || '',
  };
};

const mapVideo = (video) => {
  const plain = withMongoStyleId(video);
  if (!plain) return plain;

  const likesCount = Number(plain.likesCount || 0);
  const commentsCount = Number(plain.commentsCount || 0);
  const sharesCount = Number(plain.sharesCount || 0);

  const fixUrl = (url) => {
    if (!url) return url;
    // Fix the "Localhost Leak": Replace local dev server with production backend URL
    return url.replace(/http:\/\/localhost:8888/g, 'https://gitawisdom.onrender.com');
  };

  return {
    ...plain,
    videoUrl: fixUrl(plain.videoUrl || plain.youtubeUrl || plain.url),
    youtubeUrl: fixUrl(plain.youtubeUrl || plain.videoUrl || plain.url),
    url: fixUrl(plain.videoUrl || plain.youtubeUrl || plain.url),
    likesCount,
    commentsCount,
    sharesCount,
    likes: likesCount,
    commentsTotal: commentsCount,
    shares: sharesCount,
    uploaderName: plain.uploadedBy?.name || plain.uploader?.name || plain.uploaderName || null,
    uploaderEmail: plain.uploadedBy?.email || plain.uploader?.email || null,
    uploaderRole: plain.uploadedBy?.role || plain.uploader?.role || null,
  };
};

const mapSloka = (sloka) => withMongoStyleId(sloka);

module.exports = {
  mapMovie,
  mapStory,
  mapVideo,
  mapSloka,
};