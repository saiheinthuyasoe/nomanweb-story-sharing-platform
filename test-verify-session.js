// Using built-in fetch API (Node.js 18+)

async function testVerifySession() {
  try {
    const response = await fetch('http://localhost:3000/api/stripe/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxZDBkYThjYS03ZjMyLTQ2NTgtOTY0NC0wNzA3Nzc2OGZhNzkiLCJlbWFpbCI6InphaWFlZ2FtaW5nQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzU2MjEwOTYxLCJleHAiOjE3NTY4MTU3NjF9.bgFTUOyqUTxjmeLG-Y3ZaalBJ6AmAOMOqM03sBCN5Qxiq6LimQMcxtMWh85uwAwBIYUe6L6lKdEQnAkvXLc56Q'
      },
      body: JSON.stringify({
        sessionId: 'cs_test_a15SymD9GvNx5XE3ImfS7eTKChs1Jy8Nh9peHIYIqZslia23ySZHps0N4A'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVerifySession();