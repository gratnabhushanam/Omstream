const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('https://gitawisdom.onrender.com/api/auth/register', {
      name: 'Test User',
      email: 'gitawisdom143@gmail.com',
      password: 'password123',
      phoneNumber: '1234567890'
    });
    console.log('SIGNUP SUCCESS:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('SIGNUP ERROR STATUS:', err.response.status);
      console.log('SIGNUP ERROR DATA:', err.response.data);
    } else {
      console.log('SIGNUP NETWORK ERROR:', err.message);
    }
  }
}
testSignup();
