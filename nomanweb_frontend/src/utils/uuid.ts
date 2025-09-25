/**
 * UUID validation and utility functions
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Validates and formats a UUID string for API requests
 * Throws an error if the UUID is invalid
 */
export function validateAndFormatUUID(uuid: string, fieldName: string = 'UUID'): string {
  if (!uuid) {
    throw new Error(`${fieldName} is required`);
  }
  
  if (!isValidUUID(uuid)) {
    throw new Error(`${fieldName} must be a valid UUID format`);
  }
  
  return uuid.toLowerCase();
}