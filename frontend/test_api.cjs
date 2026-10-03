const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'student@example.com',
      password: 'password123'
    });
    console.log("Token:", res.data.access_token.substring(0, 10));
    
    const examsRes = await axios.get('http://localhost:8000/api/exams', {
      headers: { Authorization: `Bearer ${res.data.access_token}` }
    });
    console.log("Exams returned:", examsRes.data.length);
    console.log(examsRes.data);
  } catch (err) {
    console.error(err.message);
  }
}
test();
