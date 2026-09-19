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

export function showBrowserNotification(title: string, body: string, icon = '/vite.svg'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Only notify when window is not focused/minimized
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    return;
  }

  try {
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
