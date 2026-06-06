const axios = require('axios');

async function testSongs() {
  try {
    const res = await axios.get('http://localhost:8888/api/songs?language=telugu');
    console.log("Songs fetched:", res.data.length);
    if (res.data.length > 0) {
      console.log("First song URL:", res.data[0].url);
      console.log("Second song URL:", res.data[1] ? res.data[1].url : 'None');
    }
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

testSongs();
