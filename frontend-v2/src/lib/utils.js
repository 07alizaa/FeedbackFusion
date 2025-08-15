import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getInitials(name) {
  // Return empty string if input is missing, null, undefined, or not a string
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // Trim extra spaces and split by space
  const trimmedName = name.trim();
  if (!trimmedName) {
    return '';
  }
  
  const nameParts = trimmedName.split(/\s+/);
  
  // Handle single-word names (e.g., "Alice" → "A")
  if (nameParts.length === 1) {
    return nameParts[0][0].toUpperCase();
  }
  
  // Handle multi-word names (take first letter of each word)
  return nameParts
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  // SECURITY: Enhanced password validation - minimum 12 characters with complexity requirements
  if (password.length < 12) {
    return false;
  }
  
  // Check for uppercase, lowercase, number, and special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

export function getStatusColor(status) {
  const colors = {
    active: 'text-success-600 bg-success-50',
    inactive: 'text-gray-600 bg-gray-50',
    pending: 'text-warning-600 bg-warning-50',
    approved: 'text-success-600 bg-success-50',
    rejected: 'text-danger-600 bg-danger-50',
    draft: 'text-gray-600 bg-gray-50',
    published: 'text-primary-600 bg-primary-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}

export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function generateFormUrl(formId) {
  return `${window.location.origin}/forms/${formId}`;
}

export function generateBusinessUrl(slug) {
  return `${window.location.origin}/b/${slug}`;
}
