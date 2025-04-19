// Format timestamp to human-readable string
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Validate user data structure
export const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'role'];
  return requiredFields.every(field => userData[field]);
};

// Format message object with consistent structure
export const formatMessage = (message, sender) => {
  return {
    ...message,
    sender,
    timestamp: Date.now(),
    formattedTime: formatTimestamp(Date.now())
  };
}; 