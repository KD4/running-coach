import client from './client';

interface LoginResponse {
  token: string;
  isNewUser: boolean;
}

export async function oauthLogin(provider: string, code: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/api/auth/oauth', { provider, code });
  return data;
}

export async function localLogin(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/api/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/api/auth/register', { email, password });
  return data;
}
