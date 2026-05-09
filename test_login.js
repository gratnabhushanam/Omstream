const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://gitawisdom.onrender.com/api/auth/login', {
      email: 'gitawisdom143@gmail.com',
      password: 'Ratnapavan@7896'
    });
    console.log('SUCCESS:', res.data.message || 'Logged in successfully! Token received.');
  } catch (err) {
    if (err.response) {
      console.log('ERROR STATUS:', err.response.status);
      console.log('ERROR DATA:', err.response.data);
    } else {
      console.log('NETWORK ERROR:', err.message);
    }
  }
}
test();
