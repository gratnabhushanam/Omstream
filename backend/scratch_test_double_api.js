const axios = require('axios');

async function testDoubleApi() {
  try {
    const res = await axios.post('https://gitawisdom.onrender.com/api/api/auth/login', {
      email: 'gitawisdom143@gmail.com',
      password: 'Ratnapavan@7896'
    }, {
      headers: {
        'x-device-id': 'dev_test',
        'x-device-name': 'Test'
      }
    });
    console.log("DOUBLE API LOGIN SUCCESS! Token:", res.data.token ? "YES" : "NO");
    console.log("User Name:", res.data.name);
  } catch (err) {
    console.error("DOUBLE API LOGIN FAILED:");
    console.error("Status:", err.response ? err.response.status : "No Response");
    console.error("Data:", err.response ? err.response.data : err.message);
  }
}

testDoubleApi();
