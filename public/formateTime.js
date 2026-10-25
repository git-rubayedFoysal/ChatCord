/**
 * Format a millisecond timestamp into a readable local time string.
 * Example output: "2:30 PM"
 * @param {number|string} ts - Unix timestamp in milliseconds
 * @returns {string} Localized time display string
 */
export const formateTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",     // Two digits for hour (e.g. "9" → "09")
    minute: "2-digit",    // Two digits for minute (e.g. "5" → "05")
    hour12: true,        // 12-hour clock with AM/PM
  });
