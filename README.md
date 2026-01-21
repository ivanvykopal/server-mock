# Chatbot Streaming Server

A JavaScript server implementing a chatbot streaming API with Server-Sent Events (SSE) based on the provided OpenAPI specification.

## Features

- Express.js server with SSE streaming endpoint
- Implementation of the `/v1/chat/stream` endpoint
- Server-Sent Events for real-time response streaming
- Mock responses from static data (replaced CSV reading)
- Comprehensive test suite with Jest
- Proper error handling and validation

## API Endpoints

### POST /v1/chat/stream

Streams chat responses using Server-Sent Events.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is AI?"
    }
  ],
  "conversationId": "factcheck_123",
  "ids": [1, 2, 3]
}
```

**Response:**
Streams Server-Sent Events with the following event types:
- `sources`: Contains relevant source URLs
- `token`: Contains a chunk of the AI response
- `done`: Indicates the stream has completed successfully
- `error`: Indicates an error occurred during streaming

## Project Structure

```
project/
├── package.json
├── server.js              # Main server implementation
├── app.js                 # Express app configuration
├── routes/
│   └── chat.js           # Chat streaming endpoint
├── utils/
│   └── sse.js            # SSE helper functions
├── mocks/
│   └── responses.js      # Static mock responses
├── tests/
│   ├── chat.test.js      # Chat endpoint tests
│   └── sse.test.js       # SSE functionality tests
└── public/               # Static files
```

## Installation

```bash
npm install
```

## Usage

Start the server:
```bash
npm start
```

Run tests:
```bash
npm test
```

## Implementation Details

This server implements a streaming chat API that returns mock responses instead of reading from CSV files. The mock data is stored in `mocks/responses.js` and contains:

1. Predefined conversation pairs (user questions and assistant responses)
2. A list of source URLs that can be returned with responses

When a request is made to the `/v1/chat/stream` endpoint:
1. A random conversation pair is selected from the mock data
2. The assistant response is streamed token by token to simulate real-time AI response
3. A random subset of sources is included in the response

## Example Client Usage

```javascript
const eventSource = new EventSource('http://localhost:8100/v1/chat/stream');

eventSource.addEventListener('sources', (event) => {
  const data = JSON.parse(event.data);
  console.log('Sources:', data.sources);
});

eventSource.addEventListener('token', (event) => {
  const data = JSON.parse(event.data);
  console.log('Token:', data.content);
});

eventSource.addEventListener('done', (event) => {
  console.log('Stream completed');
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
});
```