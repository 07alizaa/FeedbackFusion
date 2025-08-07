// utils/formTypes.js - Form component type definitions and utilities

// All supported form component types
const FORM_COMPONENT_TYPES = {
  // Input Components
  TEXT_INPUT: 'text_input',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  DATE: 'date',
  TIME: 'time',
  
  // Selection Components
  RATING: 'rating',
  MULTIPLE_CHOICE: 'multiple_choice',
  CHECKBOXES: 'checkboxes',
  DROPDOWN: 'dropdown',
  YESNO: 'yesno',
  
  // File Components
  FILE_UPLOAD: 'file_upload',
  IMAGE_UPLOAD: 'image_upload',
  
  // Layout Components
  SECTION_TITLE: 'section_title',
  DESCRIPTION: 'description',
  DIVIDER: 'divider',
  SUBMIT_BUTTON: 'submit_button'
};

// Component types that require user input (for validation)
const INPUT_COMPONENT_TYPES = [
  FORM_COMPONENT_TYPES.TEXT_INPUT,
  FORM_COMPONENT_TYPES.TEXT,
  FORM_COMPONENT_TYPES.TEXTAREA,
  FORM_COMPONENT_TYPES.EMAIL,
  FORM_COMPONENT_TYPES.PHONE,
  FORM_COMPONENT_TYPES.NUMBER,
  FORM_COMPONENT_TYPES.DATE,
  FORM_COMPONENT_TYPES.TIME,
  FORM_COMPONENT_TYPES.RATING,
  FORM_COMPONENT_TYPES.MULTIPLE_CHOICE,
  FORM_COMPONENT_TYPES.CHECKBOXES,
  FORM_COMPONENT_TYPES.DROPDOWN,
  FORM_COMPONENT_TYPES.YESNO,
  FORM_COMPONENT_TYPES.FILE_UPLOAD,
  FORM_COMPONENT_TYPES.IMAGE_UPLOAD
];

// Component types that are layout/display only
const LAYOUT_COMPONENT_TYPES = [
  FORM_COMPONENT_TYPES.SECTION_TITLE,
  FORM_COMPONENT_TYPES.DESCRIPTION,
  FORM_COMPONENT_TYPES.DIVIDER,
  FORM_COMPONENT_TYPES.SUBMIT_BUTTON
];

/**
 * Generates a unique field ID for a form component
 * @param {string} type - The component type
 * @param {number} index - The component index in the form
 * @param {string} label - The component label (optional)
 * @returns {string} - Unique field ID
 */
function generateFieldId(type, index, label = '') {
  const prefix = type.replace('_', '');
  const safeLabelSuffix = label 
    ? '_' + label.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
    : '';
  return `${prefix}_${index}${safeLabelSuffix}`;
}

/**
 * Validates form configuration structure
 * @param {Object} config - Form configuration object
 * @returns {Object} - Validation result
 */
function validateFormConfig(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    return {
      success: false,
      errors: ['Form configuration must be a valid object']
    };
  }

  if (!config.fields || !Array.isArray(config.fields)) {
    return {
      success: false,
      errors: ['Form configuration must contain a fields array']
    };
  }

  if (config.fields.length === 0) {
    // Allow empty forms to be saved as drafts
    // Users can add fields later
    return {
      success: true,
      errors: []
    };
  }

  // Validate each field
  config.fields.forEach((field, index) => {
    if (!field.type) {
      errors.push(`Field ${index + 1}: type is required`);
    } else if (!Object.values(FORM_COMPONENT_TYPES).includes(field.type)) {
      errors.push(`Field ${index + 1}: invalid field type '${field.type}'`);
    }

    // Validate required properties for input components
    if (INPUT_COMPONENT_TYPES.includes(field.type)) {
      if (!field.label && !field.title) {
        errors.push(`Field ${index + 1}: label or title is required for input components`);
      }
    }

    // Validate required properties for layout components
    if (field.type === FORM_COMPONENT_TYPES.SECTION_TITLE && !field.title) {
      errors.push(`Field ${index + 1}: title is required for section titles`);
    }

    if (field.type === FORM_COMPONENT_TYPES.DESCRIPTION && !field.content && !field.description) {
      errors.push(`Field ${index + 1}: content or description is required for description components`);
    }

    // Validate options for choice components
    const choiceTypes = [
      FORM_COMPONENT_TYPES.MULTIPLE_CHOICE,
      FORM_COMPONENT_TYPES.CHECKBOXES,
      FORM_COMPONENT_TYPES.DROPDOWN
    ];
    
    if (choiceTypes.includes(field.type)) {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        errors.push(`Field ${index + 1}: options array is required for choice components`);
      }
    }
  });

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Normalizes form configuration by ensuring all fields have proper IDs
 * @param {Object} config - Form configuration object
 * @returns {Object} - Normalized configuration
 */
function normalizeFormConfig(config) {
  if (!config.fields) {
    return config;
  }

  const normalizedFields = config.fields.map((field, index) => {
    // Ensure field has an ID
    if (!field.id) {
      field.id = generateFieldId(field.type, index, field.label || field.title);
    }

    // Ensure required properties exist
    if (INPUT_COMPONENT_TYPES.includes(field.type)) {
      field.required = field.required || false;
    }

    return field;
  });

  return {
    ...config,
    fields: normalizedFields
  };
}

/**
 * Gets the expected data type for a form component
 * @param {string} componentType - The component type
 * @returns {string} - Expected data type
 */
function getExpectedDataType(componentType) {
  switch (componentType) {
    case FORM_COMPONENT_TYPES.NUMBER:
    case FORM_COMPONENT_TYPES.RATING:
      return 'number';
    
    case FORM_COMPONENT_TYPES.CHECKBOXES:
      return 'array';
    
    case FORM_COMPONENT_TYPES.FILE_UPLOAD:
    case FORM_COMPONENT_TYPES.IMAGE_UPLOAD:
      return 'file';
    
    case FORM_COMPONENT_TYPES.TEXT_INPUT:
    case FORM_COMPONENT_TYPES.TEXT:
    case FORM_COMPONENT_TYPES.TEXTAREA:
    case FORM_COMPONENT_TYPES.EMAIL:
    case FORM_COMPONENT_TYPES.PHONE:
    case FORM_COMPONENT_TYPES.DATE:
    case FORM_COMPONENT_TYPES.TIME:
    case FORM_COMPONENT_TYPES.MULTIPLE_CHOICE:
    case FORM_COMPONENT_TYPES.DROPDOWN:
    case FORM_COMPONENT_TYPES.YESNO:
    default:
      return 'string';
  }
}

module.exports = {
  FORM_COMPONENT_TYPES,
  INPUT_COMPONENT_TYPES,
  LAYOUT_COMPONENT_TYPES,
  generateFieldId,
  validateFormConfig,
  normalizeFormConfig,
  getExpectedDataType
};
