/**
 * Format a Unix timestamp as a localized short time (12-hour clock).
 *
 * @param {number} timestamp - Milliseconds since Unix epoch.
 * @returns {string} Localized time string (e.g. "02:30 PM").
 */
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Validate that user join payload contains required fields for Socket.IO registration.
 *
 * @param {unknown} userData - Payload from the client's `user_join` event.
 * @returns {boolean} True when `id` and `role` are present on a plain object.
 */
export const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'role'];
  return requiredFields.every(field => userData[field]);
};

/**
 * Attach server-side sender metadata and normalized timestamps to an outgoing chat message.
 *
 * @param {object} message - Raw message from the client (spread into the result).
 * @param {object} sender - User record resolved from the active socket connection.
 * @returns {object} Message with `sender`, `timestamp`, and `formattedTime` set by the server.
 */
export const formatMessage = (message, sender) => {
  return {
    ...message,
    sender,
    timestamp: Date.now(),
    formattedTime: formatTimestamp(Date.now())
  };
};
