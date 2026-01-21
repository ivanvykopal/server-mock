const http = require('http');

// Test SSE connection
const options = {
  hostname: 'localhost',
  port: 8100,
  path: '/v1/chat/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  res.on('data', (chunk) => {
    console.log(`Data: ${chunk}`);
  });

  res.on('end', () => {
    console.log('Stream ended');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({
  messages: [
    { role: 'user', content: 'What is AI?' }
  ]
}));

req.end();