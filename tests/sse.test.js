const {
  initSSE,
  sendEvent,
  sendSources,
  sendToken,
  sendDone,
  sendError
} = require('../utils/sse');

// Mock response object
const createMockRes = () => ({
  writeHead: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
  writableEnded: false
});

describe('SSE Utilities', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockRes();
  });

  test('initSSE should set correct headers', () => {
    initSSE(mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
  });

  test('sendEvent should format and send event data', () => {
    const type = 'test';
    const data = { message: 'hello' };

    sendEvent(mockRes, type, data);

    const expectedData = JSON.stringify({ type, ...data });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });

  test('sendSources should send sources event', () => {
    const sources = ['https://example.com', 'https://test.com'];

    sendSources(mockRes, sources);

    const expectedData = JSON.stringify({ type: 'sources', sources });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });

  test('sendToken should send token event', () => {
    const content = 'Hello';

    sendToken(mockRes, content);

    const expectedData = JSON.stringify({ type: 'token', content });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });

  test('sendDone should send done event', () => {
    sendDone(mockRes);

    const expectedData = JSON.stringify({ type: 'done' });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });

  test('sendDone should send done event with conversationId', () => {
    const conversationId = 'conv_123';

    sendDone(mockRes, conversationId);

    const expectedData = JSON.stringify({ type: 'done', conversationId });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });

  test('sendError should send error event', () => {
    const message = 'Something went wrong';
    const code = 'ERROR_CODE';

    sendError(mockRes, message, code);

    const expectedData = JSON.stringify({ type: 'error', message, code });
    expect(mockRes.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);
  });
});