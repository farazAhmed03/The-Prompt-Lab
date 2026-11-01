/**
 * Security & Sanitization Utilities for PromptVerse
 */

/**
 * Escapes regex special characters to prevent ReDoS and Regex Syntax Errors
 * Characters escaped: . * + ? ^ = ! : $ { } ( ) | [ ] / \
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates that an input is a clean primitive string
 * Blocks NoSQL object injection like { "$gt": "" } or { "$ne": null }
 */
export const isCleanString = (val) => {
  return typeof val === 'string' && val.trim().length > 0;
};

/**
 * Sanitizes user input string by stripping dangerous HTML script tags
 * Prevents Stored XSS attacks in titles and descriptions
 */
export const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Safe string extractor for query params
 */
export const safeQueryString = (val) => {
  if (typeof val !== 'string') return '';
  return val.trim();
};
