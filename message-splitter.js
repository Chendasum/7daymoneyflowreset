/**
 * Telegram Message Splitter Utility
 * Splits long messages into chunks that fit Telegram's 4096 character limit
 */

const MAX_MESSAGE_LENGTH = 4096;

/**
 * Split a long message into smaller chunks that fit Telegram's character limit
 * @param {string} message - The message to split
 * @param {number} maxLength - Maximum length per chunk (default: 4096)
 * @returns {string[]} Array of message chunks
 */
function splitMessage(message, maxLength = MAX_MESSAGE_LENGTH) {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  let currentChunk = '';
  
  // Split by lines first to preserve formatting
  const lines = message.split('\n');
  
  for (const line of lines) {
    // If a single line is too long, split it by words
    if (line.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const words = line.split(' ');
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > maxLength) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
          } else {
            // Single word is too long, force split
            chunks.push(word.substring(0, maxLength));
            currentChunk = word.substring(maxLength);
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
    } else {
      // Check if adding this line would exceed limit
      if ((currentChunk + '\n' + line).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = line;
        } else {
          chunks.push(line);
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Send a potentially long message as multiple chunks
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID to send to
 * @param {string} message - Message to send
 * @param {Object} options - Telegram send options
 * @param {number} delay - Delay between chunks in milliseconds (default: 500)
 */
async function sendLongMessage(bot, chatId, message, options = {}, delay = 500) {
  const chunks = splitMessage(message);
  
  for (let i = 0; i < chunks.length; i++) {
    try {
      await bot.sendMessage(chatId, chunks[i], options);
      
      // Add delay between chunks to avoid rate limiting
      if (i < chunks.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Error sending message chunk ${i + 1}/${chunks.length}:`, error);
      throw error;
    }
  }
}

/**
 * Get message chunks with part indicators
 * @param {string} message - The message to split
 * @param {string} partPrefix - Prefix for part indicators (default: "Part")
 * @returns {string[]} Array of message chunks with part indicators
 */
function splitMessageWithParts(message, partPrefix = "Part") {
  const chunks = splitMessage(message);
  
  if (chunks.length === 1) {
    return chunks;
  }
  
  return chunks.map((chunk, index) => {
    const partInfo = `📝 ${partPrefix} ${index + 1}/${chunks.length}\n\n`;
    return partInfo + chunk;
  });
}

module.exports = {
  splitMessage,
  sendLongMessage,
  splitMessageWithParts,
  MAX_MESSAGE_LENGTH
};