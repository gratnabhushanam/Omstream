const { Sloka } = require('../models');

exports.getMentorSloka = async (req, res) => {
  try {
    const { problem } = req.query;
    if (!problem) return res.status(400).json({ message: 'Problem required' });

    const slokas = await Sloka.find({ tags: { $regex: problem, $options: 'i' } });
    if (slokas.length === 0) return res.json(await Sloka.findOne());

    res.json(slokas[Math.floor(Math.random() * slokas.length)]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
