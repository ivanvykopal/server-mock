const app = require('./app');

const PORT = process.env.PORT || 8100;

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Chatbot streaming server listening on port ${PORT}`);
  });
}

module.exports = app;