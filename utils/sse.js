/**
 * SSE utility functions for sending Server-Sent Events
 */

/**
 * Initialize SSE headers for a response
 * @param {Object} res - Express response object
 */
function initSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
}

/**
 * Send an SSE event
 * @param {Object} res - Express response object
 * @param {string} type - Event type
 * @param {Object} data - Event data
 */
function sendEvent(res, type, data) {
  const eventData = JSON.stringify({ type, ...data });
  res.write(`data: ${eventData}\n\n`);
}

/**
 * Send a sources event
 * @param {Object} res - Express response object
 * @param {Array} sources - Array of source URLs
 */
function sendSources(res, sources) {
  sendEvent(res, 'sources', { sources });
}

/**
 * Send a token event
 * @param {Object} res - Express response object
 * @param {string} content - Token content
 */
function sendToken(res, content) {
  sendEvent(res, 'token', { content });
}

/**
 * Send a done event
 * @param {Object} res - Express response object
 * @param {string} conversationId - Conversation ID (optional)
 */
function sendDone(res, conversationId = null) {
  const data = conversationId ? { conversationId } : {};
  sendEvent(res, 'done', data);
}

/**
 * Send an error event
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 */
function sendError(res, message, code) {
  sendEvent(res, 'error', { message, code });
}

module.exports = {
  initSSE,
  sendEvent,
  sendSources,
  sendToken,
  sendDone,
  sendError
};