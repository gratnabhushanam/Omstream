const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://gitawisdom.onrender.com/api/auth/login', {
      email: 'gitawisdom143@gmail.com',
      password: 'Ratnapavan@7896'
    }, {
      headers: {
        'x-device-id': 'dev_test',
        'x-device-name': 'Test'
      }
    });
    console.log("LOGIN SUCCESS! Token:", res.data.token ? "YES" : "NO");
    console.log("User Name:", res.data.name);
  } catch (err) {
    console.error("LOGIN FAILED:", err.response ? err.response.data : err.message);
  }
}

testLogin();
