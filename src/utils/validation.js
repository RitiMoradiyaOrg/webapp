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
  
  // Validate product creation data
  function validateProductCreate(data) {
    const errors = [];
  
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('name is required and must be a non-empty string');
    }
  
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push('description is required and must be a non-empty string');
    }
  
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
      errors.push('sku is required and must be a non-empty string');
    }
  
    if (!data.manufacturer || typeof data.manufacturer !== 'string' || data.manufacturer.trim() === '') {
      errors.push('manufacturer is required and must be a non-empty string');
    }
  
    if (data.quantity === undefined || data.quantity === null) {
      errors.push('quantity is required');
    } else if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      errors.push('quantity must be an integer >= 0');
    }
  
    // Check for extra fields (readOnly fields)
    const allowedFields = ['name', 'description', 'sku', 'manufacturer', 'quantity'];
    const providedFields = Object.keys(data);
    const extraFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (extraFields.length > 0) {
      errors.push(`Cannot set fields: ${extraFields.join(', ')}`);
    }
  
    return errors;
  }
  
  // Validate product update data (PUT - all fields required)
  function validateProductUpdate(data) {
    const errors = [];
  
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('name is required and must be a non-empty string');
    }
  
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push('description is required and must be a non-empty string');
    }
  
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
      errors.push('sku is required and must be a non-empty string');
    }
  
    if (!data.manufacturer || typeof data.manufacturer !== 'string' || data.manufacturer.trim() === '') {
      errors.push('manufacturer is required and must be a non-empty string');
    }
  
    if (data.quantity === undefined || data.quantity === null) {
      errors.push('quantity is required');
    } else if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      errors.push('quantity must be an integer >= 0');
    }
  
    // Check for disallowed fields
    const allowedFields = ['name', 'description', 'sku', 'manufacturer', 'quantity'];
    const providedFields = Object.keys(data);
    const extraFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (extraFields.length > 0) {
      errors.push(`Cannot set fields: ${extraFields.join(', ')}`);
    }
  
    return errors;
  }
  
  // Validate product partial update (PATCH - optional fields)
  function validateProductPatch(data) {
    const errors = [];
    const allowedFields = ['name', 'description', 'sku', 'manufacturer', 'quantity'];
    const providedFields = Object.keys(data);
  
    // Check for disallowed fields
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return ['Cannot update fields: ' + invalidFields.join(', ')];
    }
  
    // Validate provided fields
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('name must be a non-empty string');
      }
    }
  
    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || data.description.trim() === '') {
        errors.push('description must be a non-empty string');
      }
    }
  
    if (data.sku !== undefined) {
      if (typeof data.sku !== 'string' || data.sku.trim() === '') {
        errors.push('sku must be a non-empty string');
      }
    }
  
    if (data.manufacturer !== undefined) {
      if (typeof data.manufacturer !== 'string' || data.manufacturer.trim() === '') {
        errors.push('manufacturer must be a non-empty string');
      }
    }
  
    if (data.quantity !== undefined) {
      if (!Number.isInteger(data.quantity) || data.quantity < 0) {
        errors.push('quantity must be an integer >= 0');
      }
    }
  
    return errors;
  }
  
  module.exports = {
    isValidEmail,
    validateUserCreate,
    validateUserUpdate,
    validateProductCreate,
    validateProductUpdate,
    validateProductPatch
  };