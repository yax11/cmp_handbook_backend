// utils/response.js
const createResponse = (success, message, data = null, error = null) => {
    return {
      success,
      message,
      data,
      error,
    };
  };
  
  module.exports = createResponse;
  