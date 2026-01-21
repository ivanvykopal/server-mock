const request = require('supertest');
const app = require('../app');

describe('Chat Stream Endpoint', () => {
  test('POST /v1/chat/stream should return 400 for missing messages', async () => {
    const response = await request(app)
      .post('/v1/chat/stream')
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      error: 'Bad Request',
      message: 'Messages array is required and cannot be empty',
      code: 'INVALID_MESSAGE'
    });
  });

  test('POST /v1/chat/stream should return 400 for empty messages array', async () => {
    const response = await request(app)
      .post('/v1/chat/stream')
      .send({ messages: [] })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Bad Request',
      message: 'Messages array is required and cannot be empty',
      code: 'INVALID_MESSAGE'
    });
  });

  test('POST /v1/chat/stream should return 400 for missing last message content', async () => {
    const response = await request(app)
      .post('/v1/chat/stream')
      .send({ messages: [{}] })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Bad Request',
      message: 'Last message content cannot be empty',
      code: 'INVALID_MESSAGE'
    });
  });

  test('POST /v1/chat/stream should accept valid request and return SSE stream', async () => {
    const validRequest = {
      messages: [
        { role: 'user', content: 'What is AI?' }
      ]
    };

    const response = await request(app)
      .post('/v1/chat/stream')
      .send(validRequest)
      .expect(200);

    // Check that the response is SSE format
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toBe('no-cache');
  }, 10000); // Increase timeout for streaming response

  test('POST /v1/chat/stream should handle multiple messages in history', async () => {
    const validRequest = {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'system', content: 'Hi there!' },
        { role: 'user', content: 'What is AI?' }
      ]
    };

    const response = await request(app)
      .post('/v1/chat/stream')
      .send(validRequest)
      .expect(200);

    // Check that the response is SSE format
    expect(response.headers['content-type']).toContain('text/event-stream');
  }, 10000); // Increase timeout for streaming response
});