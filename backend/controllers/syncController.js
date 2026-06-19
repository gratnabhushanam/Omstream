const { Sloka, Story, Video, Movie, Song } = require('../models');

exports.getContentUpdates = async (req, res) => {
    try {
        const lastSyncQuery = req.query.lastSync;
        const lastSync = (!lastSyncQuery || Number(lastSyncQuery) === 0) ? new Date(0) : new Date(Number(lastSyncQuery));

        const [slokas, stories, videos, movies, songs] = await Promise.all([
            Sloka.find({ updatedAt: { $gt: lastSync } }).lean(),
            Story.find({ updatedAt: { $gt: lastSync } }).lean(),
            Video.find({ updatedAt: { $gt: lastSync } }).lean(),
            Movie.find({ updatedAt: { $gt: lastSync } }).lean(),
            Song.find({ updatedAt: { $gt: lastSync } }).lean(),
        ]);

        return res.status(200).json({
            status: 'success',
            serverTime: Date.now(),
            deltas: { slokas, stories, videos, movies, songs }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
