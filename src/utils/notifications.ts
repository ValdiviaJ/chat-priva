/**
 * Browser Notification Helper
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export async function showBrowserNotification(title: string, body: string, icon = '/vite.svg'): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Only notify when window is not focused/minimized
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: icon,
        });
        return;
      }
    }

    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.error('Error displaying notification:', err);
  }
}
