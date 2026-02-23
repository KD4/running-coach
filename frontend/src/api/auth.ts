import client from './client';

interface LoginResponse {
  token: string;
  isNewUser: boolean;
}

export async function oauthLogin(provider: string, code: string, referrer?: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/api/auth/oauth', { provider, code, referrer });
  return data;
}
