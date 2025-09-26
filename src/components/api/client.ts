export const API_BASE = 'http://192.168.1.158:8000'; // ← remplace par l’IP/URL de ton API

export async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed (${res.status}) ${txt}`);
  }

  const json = await res.json();
  // Lexik renvoie { token: "..." }
  if (!json?.token) throw new Error('Token absent dans la réponse');
  return json.token as string;
}