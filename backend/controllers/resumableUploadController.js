const path = require('path');
const fs = require('fs');
const { transcodeToHLS } = require('../utils/hlsTranscoder');
const { uploadToVercelBlob } = require('../utils/vercelBlob');
const { getVideoDurationSeconds } = require('../utils/videoMetadata');
const { Video } = require('../models');
const { mapVideo } = require('../utils/responseMappers');

async function handleResumableUpload(req, res) {
  try {
    if (!req.resumableUpload) return res.status(400).json({ message: 'No file' });
    const { filePath, fileName } = req.resumableUpload;
    const user = req.user;
    
    let title = req.headers['video-title'] || fileName;
    try { title = decodeURIComponent(title); } catch (e) { }
    let description = req.headers['video-description'] || '';
    try { description = decodeURIComponent(description); } catch (e) { }
    let rawTags = req.headers['video-tags'] || '';
    try { rawTags = decodeURIComponent(rawTags); } catch (e) { }
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    
    const duration = await getVideoDurationSeconds(filePath).catch(() => 0);

    // HLS transcoding
    const hlsOutputDir = path.join(__dirname, '..', 'uploads', 'hls', path.parse(fileName).name);
    await new Promise((resolve) => {
      transcodeToHLS(filePath, hlsOutputDir, 'playlist', () => resolve());
    });

    const backendUrl = `${req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.get('host')}`;
    let masterPlaylistUrl = `${backendUrl}/uploads/hls/${path.parse(fileName).name}/${path.parse(fileName).name}_master.m3u8`;
    let videoUrl = `${backendUrl}/uploads/reels/${fileName}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const hlsFiles = fs.readdirSync(hlsOutputDir);
        
        // Upload in batches of 10 to prevent hitting Vercel Blob rate limits while remaining extremely fast
        const batchSize = 10;
        for (let i = 0; i < hlsFiles.length; i += batchSize) {
          const batch = hlsFiles.slice(i, i + batchSize);
          await Promise.all(batch.map(async (f) => {
            const cdnUrl = await uploadToVercelBlob(path.join(hlsOutputDir, f), `videos/${path.parse(fileName).name}/${f}`);
            if (f.endsWith('_master.m3u8')) masterPlaylistUrl = cdnUrl;
          }));
        }
        
        videoUrl = await uploadToVercelBlob(filePath, `videos/${fileName}`);
      } catch (e) { console.warn('Blob fallback', e); }
    }

    if (req.headers['video-only-upload'] === 'true') {
      return res.status(200).json({
        message: 'File uploaded and processed',
        videoUrl,
        hlsUrl: masterPlaylistUrl,
        fileName
      });
    }

    const newVideo = await Video.create({
      title,
      videoUrl,
      hlsUrl: masterPlaylistUrl,
      description,
      tags,
      category: req.headers['video-category'] || 'reels',
      isKids: req.headers['video-kids'] === 'true',
      isUserReel: req.headers['video-source'] === 'user',
      uploadedBy: user ? String(user.id) : undefined,
      moderationStatus: user && user.role === 'admin' ? 'approved' : 'pending',
      contentType: req.headers['video-content-type'] || 'short',
      duration,
    });

    res.status(201).json(mapVideo(newVideo));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

async function handleUrlUpload(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    const newVideo = await Video.create({
      title: req.headers['video-title'] || 'External Video',
      videoUrl: url,
      category: req.headers['video-category'] || 'reels',
      isUserReel: req.headers['video-source'] === 'user',
      uploadedBy: req.user ? String(req.user.id) : undefined,
      moderationStatus: req.user && req.user.role === 'admin' ? 'approved' : 'pending',
    });

    res.status(201).json(mapVideo(newVideo));
  } catch (err) { res.status(500).json({ message: err.message }); }
}

module.exports = { handleResumableUpload, handleUrlUpload };
