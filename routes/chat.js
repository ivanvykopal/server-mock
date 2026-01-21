const express = require("express");
const crypto = require("crypto");
const {
  initSSE,
  sendSources,
  sendToken,
  sendDone,
  sendError,
} = require("../utils/sse");
const { parseExpression } = require("python-ast");
require("../mocks/responses");

const router = express.Router();

/**
 * Generate a unique collection name
 * @returns {string} A unique collection name
 */
function generateUniqueCollectionName() {
  return 'collection_' + crypto.randomBytes(16).toString('hex');
}

function pythonLiteralToJson(str) {
  let out = "";
  let inString = false;
  let stringChar = null;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }

    if (inString) {
      if (ch === stringChar) {
        inString = false;
        out += `"`;
      } else {
        if (ch === `"`) {
          out += `\\"`;
        } else {
          out += ch;
        }
      }
      continue;
    }

    if (ch === "'" || ch === `"`) {
      inString = true;
      stringChar = ch;
      out += `"`;
      continue;
    }

    out += ch;
  }

  return out
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false");
}


function safeJSONParse(str) {
  if (!str || typeof str !== "string") {
    return null;
  }

  // Remove leading/trailing whitespace
  str = str.trim();

  // Try standard JSON parse first
  try {
    return JSON.parse(str);
  } catch (e) {
    // If that fails, try replacing single quotes with double quotes
    try {
      // More robust single-quote to double-quote conversion
      // This handles escaped quotes and nested structures
      const fixed = str
        .replace(/'/g, '"')
        .replace(/(\w+):/g, '"$1":') // Add quotes to unquoted keys
        .replace(/,\s*}/g, "}") // Remove trailing commas
        .replace(/,\s*]/g, "]"); // Remove trailing commas in arrays

      return JSON.parse(fixed);
    } catch (e2) {
      console.error(
        "Failed to parse JSON-like string:",
        str.substring(0, 100) + "..."
      );
      return null;
    }
  }
}



/**
 * POST /v1/chat/stream
 * Stream chat responses using Server-Sent Events
 */
router.post("/stream", async (req, res) => {
  // Validate request body
  let { messages, ids, collection_name } = req.body;

  // Handle collection name - use provided one or generate unique one
  if (!collection_name || collection_name.trim() === '') {
    collection_name = generateUniqueCollectionName();
    console.log('Generated unique collection name:', collection_name);
  } else {
    console.log('Using provided collection name:', collection_name);
  }

  // Check if messages array exists and has at least one message
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Messages array is required and cannot be empty",
      code: "INVALID_MESSAGE",
    });
  }

  // Get the last message (current user prompt)
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Last message content cannot be empty",
      code: "INVALID_MESSAGE",
    });
  }

  try {
    // Initialize SSE connection
    initSSE(res);

    // Select a random record from mock data
    const randomIndex = Math.floor(Math.random() * (global.ASSISTANT_MESSAGE.length / 2));
    const userIndex = randomIndex * 2;
    const assistantIndex = userIndex + 1;

    // Get user message and assistant response
    const userMessage = global.ASSISTANT_MESSAGE[userIndex];
    const assistantMessage = global.ASSISTANT_MESSAGE[assistantIndex];

    console.log('Selected random record:', {
      hasUserMessage: !!userMessage,
      hasAssistantMessage: !!assistantMessage
    });

    // Extract assistant response
    const assistantResponse = assistantMessage.system || assistantMessage.content || "";
    console.log('Extracted assistant response length:', assistantResponse.length);

    // Select a random subset of sources (5-10 sources)
    const sourcesCount = 5 + Math.floor(Math.random() * 6);
    const shuffledSources = [...global.SOURCES].sort(() => 0.5 - Math.random());
    const sources = shuffledSources.slice(0, sourcesCount);
    console.log('Selected sources count:', sources.length);
    

    // Send sources event
    sendSources(res, sources);

    // Convert assistant response to tokens (split by spaces for streaming effect)
    const tokens = assistantResponse
      .split(" ")
      .map((token, index) => {
        // Add space back to all tokens except the first one
        return index === 0 ? token : " " + token;
      })
      .filter((token) => token.length > 0); // Remove empty tokens

    // If splitting by spaces results in an empty array, use character-level tokens
    if (tokens.length === 0) {
      for (let i = 0; i < assistantResponse.length; i++) {
        tokens.push(assistantResponse[i]);
      }
    }

    // Stream tokens with delays to simulate real-time response
    let tokenIndex = 0;
    const streamToken = () => {
      if (tokenIndex < tokens.length && !res.writableEnded) {
        sendToken(res, tokens[tokenIndex]);
        tokenIndex++;

        // Schedule next token (with random delay to simulate variable response times)
        const delay = 50 + Math.random() * 100;
        setTimeout(streamToken, delay);
      } else if (tokenIndex >= tokens.length && !res.writableEnded) {
        // Send done event when all tokens are sent
        sendDone(res, collection_name);
        res.end();
      }
    };

    // Handle client disconnect
    req.on("close", () => {
      console.log("Client disconnected from SSE stream");
    });

    // Start streaming
    streamToken();
  } catch (error) {
    console.error("Error processing CSV data:", error);
    sendError(res, "Internal server error", "INTERNAL_ERROR");
    res.end();
  }
});

module.exports = router;
