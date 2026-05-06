const SESSION_KEY = 'chalk_session_token';

export async function getOrCreateSessionToken(): Promise<string> {
  const result = await chrome.storage.local.get(SESSION_KEY);
  if (result[SESSION_KEY]) return result[SESSION_KEY] as string;
  const token = crypto.randomUUID();
  await chrome.storage.local.set({ [SESSION_KEY]: token });
  return token;
}
