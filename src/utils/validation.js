// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Validate user creation data
  function validateUserCreate(data) {
    const errors = [];
  
    if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
      errors.push('first_name is required and must be a non-empty string');
    }
  
    if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
      errors.push('last_name is required and must be a non-empty string');
    }
  
    if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
      errors.push('password is required and must be at least 6 characters');
    }
  
    if (!data.username || !isValidEmail(data.username)) {
      errors.push('username must be a valid email address');
    }
  
    // Check for extra fields that users shouldn't set
    const allowedFields = ['first_name', 'last_name', 'password', 'username'];
    const providedFields = Object.keys(data);
    const extraFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (extraFields.length > 0) {
      errors.push(`Cannot set fields: ${extraFields.join(', ')}`);
    }
  
    return errors;
  }
  
  // Validate user update data
  function validateUserUpdate(data) {
    const errors = [];
    const allowedFields = ['first_name', 'last_name', 'password'];
    const providedFields = Object.keys(data);
  
    // Check for disallowed fields
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return ['Only first_name, last_name, and password can be updated'];
    }
  
    // Validate provided fields
    if (data.first_name !== undefined) {
      if (typeof data.first_name !== 'string' || data.first_name.trim() === '') {
        errors.push('first_name must be a non-empty string');
      }
    }
  
    if (data.last_name !== undefined) {
      if (typeof data.last_name !== 'string' || data.last_name.trim() === '') {
        errors.push('last_name must be a non-empty string');
      }
    }
  
    if (data.password !== undefined) {
      if (typeof data.password !== 'string' || data.password.length < 6) {
        errors.push('password must be at least 6 characters');
      }
    }
  
    return errors;
  }
  
  module.exports = {
    isValidEmail,
    validateUserCreate,
    validateUserUpdate
  };