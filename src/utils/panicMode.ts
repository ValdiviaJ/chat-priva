/**
 * Panic / Stealth Mode helper
 * Clears local chat storage and redirects immediately to a safe neutral site.
 */

export function triggerPanicMode(redirectUrl = 'https://www.google.com'): void {
  try {
    // Clear all conversation histories, reactions, ephemeral settings
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('quickchat_') || key.startsWith('chat_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch (err) {
    console.error('Error in panic mode purge:', err);
  }

  // Redirect immediately replacing browser history
  window.location.replace(redirectUrl);
}
