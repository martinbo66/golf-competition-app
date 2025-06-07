/**
 * Notification Service for the Golf Competition App
 * 
 * This service provides methods for displaying notifications to the user.
 */

import store from '@/store';

class NotificationService {
  /**
   * Show a success notification
   * @param {string} message - The notification message
   * @param {number} timeout - The timeout in milliseconds (default: 3000)
   * @returns {number} The notification ID
   */
  success(message, timeout = 3000) {
    return this._showNotification({
      type: 'success',
      message,
      timeout
    });
  }
  
  /**
   * Show an error notification
   * @param {string} message - The notification message
   * @param {number} timeout - The timeout in milliseconds (default: 5000)
   * @returns {number} The notification ID
   */
  error(message, timeout = 5000) {
    return this._showNotification({
      type: 'error',
      message,
      timeout
    });
  }
  
  /**
   * Show a warning notification
   * @param {string} message - The notification message
   * @param {number} timeout - The timeout in milliseconds (default: 4000)
   * @returns {number} The notification ID
   */
  warning(message, timeout = 4000) {
    return this._showNotification({
      type: 'warning',
      message,
      timeout
    });
  }
  
  /**
   * Show an info notification
   * @param {string} message - The notification message
   * @param {number} timeout - The timeout in milliseconds (default: 3000)
   * @returns {number} The notification ID
   */
  info(message, timeout = 3000) {
    return this._showNotification({
      type: 'info',
      message,
      timeout
    });
  }
  
  /**
   * Remove a notification by ID
   * @param {number} id - The notification ID
   */
  remove(id) {
    store.dispatch('ui/removeNotification', id);
  }
  
  /**
   * Show a notification
   * @private
   * @param {Object} notification - The notification object
   * @returns {number} The notification ID
   */
  _showNotification(notification) {
    return store.dispatch('ui/addNotification', notification);
  }
}

// Create and export a singleton instance
export default new NotificationService();

