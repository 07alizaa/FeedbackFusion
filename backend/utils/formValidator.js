// utils/formValidator.js - Dynamic form validation logic

/**
 * Validates form answers against the form configuration
 * @param {Object} answers - The submitted answers
 * @param {Object} formConfig - The form configuration
 * @returns {Object} - Validation result with success, errors, and processedAnswers
 */
function validateFormAnswers(answers, formConfig) {
  const errors = [];
  const processedAnswers = {};
  
  if (!formConfig.fields || !Array.isArray(formConfig.fields)) {
    return {
      success: false,
      errors: ['Invalid form configuration'],
      processedAnswers: {}
    };
  }

  // Validate each field in the form configuration
  formConfig.fields.forEach((field, index) => {
    const fieldId = field.id || `field-${index}`;
    const fieldValue = answers[fieldId];
    
    // Skip non-input field types
    const skipTypes = ['section_title', 'description', 'divider', 'submit_button'];
    if (skipTypes.includes(field.type)) {
      return;
    }

    // Check required fields
    if (field.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      errors.push(`${field.label || field.title || 'Field'} is required`);
      return;
    }

    // If field is not required and empty, skip further validation
    if (!field.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      return;
    }

    // Type-specific validation
    switch (field.type) {
      case 'text_input':
      case 'text':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a text string`);
        } else {
          processedAnswers[fieldId] = fieldValue.trim();
          
          // Length validation
          if (field.validation?.minLength && fieldValue.length < field.validation.minLength) {
            errors.push(`${field.label} must be at least ${field.validation.minLength} characters long`);
          }
          if (field.validation?.maxLength && fieldValue.length > field.validation.maxLength) {
            errors.push(`${field.label} must be no more than ${field.validation.maxLength} characters long`);
          }
        }
        break;

      case 'textarea':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a text string`);
        } else {
          processedAnswers[fieldId] = fieldValue.trim();
          
          // Length validation
          if (field.validation?.minLength && fieldValue.length < field.validation.minLength) {
            errors.push(`${field.label} must be at least ${field.validation.minLength} characters long`);
          }
          if (field.validation?.maxLength && fieldValue.length > field.validation.maxLength) {
            errors.push(`${field.label} must be no more than ${field.validation.maxLength} characters long`);
          }
        }
        break;

      case 'email':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid email address`);
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(fieldValue)) {
            errors.push(`${field.label} must be a valid email address`);
          } else {
            processedAnswers[fieldId] = fieldValue.toLowerCase().trim();
          }
        }
        break;

      case 'phone':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid phone number`);
        } else {
          // Basic phone validation - can be enhanced
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          const cleanPhone = fieldValue.replace(/[\s\-\(\)]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            errors.push(`${field.label} must be a valid phone number`);
          } else {
            processedAnswers[fieldId] = fieldValue;
          }
        }
        break;

      case 'number':
        const numValue = Number(fieldValue);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
        } else {
          processedAnswers[fieldId] = numValue;
          
          // Range validation
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            errors.push(`${field.label} must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            errors.push(`${field.label} must be no more than ${field.validation.max}`);
          }
        }
        break;

      case 'date':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid date`);
        } else {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(fieldValue)) {
            errors.push(`${field.label} must be in YYYY-MM-DD format`);
          } else {
            const date = new Date(fieldValue);
            if (isNaN(date.getTime())) {
              errors.push(`${field.label} must be a valid date`);
            } else {
              processedAnswers[fieldId] = fieldValue;
            }
          }
        }
        break;

      case 'time':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid time`);
        } else {
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(fieldValue)) {
            errors.push(`${field.label} must be in HH:MM format`);
          } else {
            processedAnswers[fieldId] = fieldValue;
          }
        }
        break;

      case 'rating':
        const ratingValue = Number(fieldValue);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
          errors.push(`${field.label} must be a rating between 1 and 5`);
        } else {
          processedAnswers[fieldId] = ratingValue;
        }
        break;

      case 'multiple_choice':
      case 'yesno':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid option`);
        } else {
          // For yesno, validate it's yes or no
          if (field.type === 'yesno') {
            if (!['yes', 'no'].includes(fieldValue.toLowerCase())) {
              errors.push(`${field.label} must be either 'yes' or 'no'`);
            } else {
              processedAnswers[fieldId] = fieldValue.toLowerCase();
            }
          } else {
            // For multiple choice, validate against options
            if (field.options && !field.options.includes(fieldValue)) {
              errors.push(`${field.label} must be one of the provided options`);
            } else {
              processedAnswers[fieldId] = fieldValue;
            }
          }
        }
        break;

      case 'checkboxes':
        if (!Array.isArray(fieldValue)) {
          errors.push(`${field.label} must be an array of selections`);
        } else {
          // Validate each selection against options
          if (field.options) {
            const invalidOptions = fieldValue.filter(val => !field.options.includes(val));
            if (invalidOptions.length > 0) {
              errors.push(`${field.label} contains invalid options: ${invalidOptions.join(', ')}`);
            } else {
              processedAnswers[fieldId] = fieldValue;
            }
          } else {
            processedAnswers[fieldId] = fieldValue;
          }
        }
        break;

      case 'dropdown':
        if (typeof fieldValue !== 'string') {
          errors.push(`${field.label} must be a valid selection`);
        } else {
          if (field.options && !field.options.includes(fieldValue)) {
            errors.push(`${field.label} must be one of the provided options`);
          } else {
            processedAnswers[fieldId] = fieldValue;
          }
        }
        break;

      case 'file_upload':
      case 'image_upload':
        // File uploads would typically be handled differently
        // For now, we'll accept file metadata or file paths
        if (fieldValue) {
          if (typeof fieldValue === 'object') {
            // File object with metadata
            processedAnswers[fieldId] = {
              name: fieldValue.name || 'uploaded_file',
              size: fieldValue.size || 0,
              type: fieldValue.type || 'unknown',
              path: fieldValue.path || null
            };
          } else if (typeof fieldValue === 'string') {
            // File path or URL
            processedAnswers[fieldId] = fieldValue;
          } else {
            errors.push(`${field.label} must be a valid file`);
          }
        }
        break;

      default:
        // For unknown field types, store as-is but log a warning
        console.warn(`Unknown field type: ${field.type} for field ${fieldId}`);
        processedAnswers[fieldId] = fieldValue;
        break;
    }
  });

  return {
    success: errors.length === 0,
    errors,
    processedAnswers
  };
}

/**
 * Sanitizes and prepares answers for database storage
 * @param {Object} processedAnswers - The validated answers
 * @returns {Object} - Sanitized answers ready for JSONB storage
 */
function sanitizeAnswersForStorage(processedAnswers) {
  const sanitized = {};
  
  Object.keys(processedAnswers).forEach(key => {
    const value = processedAnswers[key];
    
    // Handle different data types for JSONB storage
    if (typeof value === 'string') {
      // Trim whitespace and limit length for security
      sanitized[key] = value.trim().substring(0, 10000);
    } else if (typeof value === 'number') {
      // Ensure number is within reasonable bounds
      sanitized[key] = Math.max(-1000000, Math.min(1000000, value));
    } else if (Array.isArray(value)) {
      // Limit array size and sanitize elements
      sanitized[key] = value.slice(0, 100).map(item => 
        typeof item === 'string' ? item.trim().substring(0, 1000) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // For file objects, ensure safe structure
      sanitized[key] = {
        name: typeof value.name === 'string' ? value.name.substring(0, 255) : 'unknown',
        size: typeof value.size === 'number' ? Math.max(0, value.size) : 0,
        type: typeof value.type === 'string' ? value.type.substring(0, 100) : 'unknown'
      };
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

module.exports = {
  validateFormAnswers,
  sanitizeAnswersForStorage
};