import client from './client';
import type { TodayResponse, MonthlyScheduleResponse } from '../types';
import type { GuestProfile } from '../contexts/AuthContext';

function getGuestProfile(): GuestProfile | null {
  const saved = localStorage.getItem('guestProfile');
  return saved ? JSON.parse(saved) : null;
}

function isGuestMode(): boolean {
  return localStorage.getItem('isGuest') === 'true';
}

export async function getTodaySchedule(): Promise<TodayResponse> {
  if (isGuestMode()) {
    const profile = getGuestProfile();
    if (!profile) throw new Error('게스트 프로필이 없습니다.');
    const { data } = await client.post<TodayResponse>('/api/guest/schedule/today', profile);
    return data;
  }
  const { data } = await client.get<TodayResponse>('/api/schedule/today');
  return data;
}

export async function getMonthlySchedule(year: number, month: number): Promise<MonthlyScheduleResponse> {
  if (isGuestMode()) {
    const profile = getGuestProfile();
    if (!profile) throw new Error('게스트 프로필이 없습니다.');
    const { data } = await client.post<MonthlyScheduleResponse>('/api/guest/schedule/monthly', {
      ...profile,
      year,
      month,
    });
    return data;
  }
  const { data } = await client.get<MonthlyScheduleResponse>('/api/schedule/monthly', {
    params: { year, month },
  });
  return data;
}
