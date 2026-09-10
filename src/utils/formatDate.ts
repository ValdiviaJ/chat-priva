export function formatMessageTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeString = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return timeString;
    if (isYesterday) return 'Ayer, ' + timeString;

    const dateString = date.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return dateString + ' ' + timeString;
  } catch {
    return '';
  }
}
