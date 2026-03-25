/**
 * Wraps an async API call with standardized error handling.
 * @param {Function} fn        - Async function that performs the API call
 * @param {string} errorMsg    - Message for console.error and fallback response
 * @param {*} [fallbackData]   - Optional fallback data ([] for lists, null for single items, omit for no data)
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}  - API response or { success: false, message, data? }
 */
export async function apiCall(fn, errorMsg, fallbackData) {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMsg + ':', error);
    const result = { success: false, message: error.message || errorMsg };
    if (fallbackData !== undefined) {
      result.data = fallbackData;
    }
    return result;
  }
}
