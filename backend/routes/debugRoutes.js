const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/db-status', (req, res) => {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  res.json({ status: isConnected ? 'mongodb' : 'disconnected' });
});

module.exports = router;
