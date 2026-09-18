const CLIENT_ID_KEY = 'chat_client_id';
const USERNAME_KEY = 'chat_username';

export function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'c_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getUserName(): string {
  return localStorage.getItem(USERNAME_KEY) || 'Anónimo';
}

export function setUserName(name: string): void {
  localStorage.setItem(USERNAME_KEY, name.trim() || 'Anónimo');
}

