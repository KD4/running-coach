import client from './client';

export interface OnboardingRequest {
  goalEvent: string;
  goalTimeSeconds: number;
  targetDate: string;
  trainingDays: string[];
  longRunDay: string;
  bodyWeight: number;
  targetWeight?: number | null;
}

export interface ProfileResponse {
  goalEvent: string;
  goalTimeSeconds: number;
  targetDate: string;
  trainingDays: string[];
  longRunDay: string;
  bodyWeight: number;
  targetWeight?: number | null;
}

export interface ProfileUpdateRequest {
  goalEvent?: string;
  goalTimeSeconds?: number;
  targetDate?: string;
  trainingDays?: string[];
  longRunDay?: string;
  bodyWeight?: number;
  targetWeight?: number | null;
}

export async function submitOnboarding(data: OnboardingRequest): Promise<ProfileResponse> {
  const { data: res } = await client.post<ProfileResponse>('/api/users/onboarding', data);
  return res;
}

export async function getProfile(): Promise<ProfileResponse> {
  const { data } = await client.get<ProfileResponse>('/api/users/profile');
  return data;
}

export async function updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
  const { data: res } = await client.put<ProfileResponse>('/api/users/profile', data);
  return res;
}

export interface NotificationSettingResponse {
  enabled: boolean;
  hour: number;
}

export async function getNotificationSetting(): Promise<NotificationSettingResponse> {
  const { data } = await client.get<NotificationSettingResponse>('/api/users/notification');
  return data;
}

export async function updateNotificationSetting(
  enabled: boolean,
  hour: number,
): Promise<NotificationSettingResponse> {
  const { data } = await client.put<NotificationSettingResponse>('/api/users/notification', {
    enabled,
    hour,
  });
  return data;
}
