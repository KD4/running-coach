import { createContext, useContext, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TodayResponse, MonthlyScheduleResponse } from '../types';
import type { ProfileResponse } from '../api/user';
import { getTodaySchedule, getMonthlySchedule } from '../api/schedule';
import { getProfile } from '../api/user';

interface DataCache {
  fetchToday: (force?: boolean) => Promise<TodayResponse>;
  fetchMonthly: (year: number, month: number, force?: boolean) => Promise<MonthlyScheduleResponse>;
  fetchProfile: (force?: boolean) => Promise<ProfileResponse>;
  invalidateAll: () => void;
}

const DataCacheContext = createContext<DataCache | null>(null);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const todayRef = useRef<{ data: TodayResponse; ts: number } | null>(null);
  const monthlyRef = useRef<Map<string, { data: MonthlyScheduleResponse; ts: number }>>(new Map());
  const profileRef = useRef<{ data: ProfileResponse; ts: number } | null>(null);

  // 캐시 유효시간: 5분
  const TTL = 5 * 60 * 1000;

  const isValid = (ts: number) => Date.now() - ts < TTL;

  const fetchToday = useCallback(async (force = false): Promise<TodayResponse> => {
    if (!force && todayRef.current && isValid(todayRef.current.ts)) {
      return todayRef.current.data;
    }
    const data = await getTodaySchedule();
    todayRef.current = { data, ts: Date.now() };
    return data;
  }, []);

  const fetchMonthly = useCallback(async (year: number, month: number, force = false): Promise<MonthlyScheduleResponse> => {
    const key = `${year}-${month}`;
    const cached = monthlyRef.current.get(key);
    if (!force && cached && isValid(cached.ts)) {
      return cached.data;
    }
    const data = await getMonthlySchedule(year, month);
    monthlyRef.current.set(key, { data, ts: Date.now() });
    return data;
  }, []);

  const fetchProfile = useCallback(async (force = false): Promise<ProfileResponse> => {
    if (!force && profileRef.current && isValid(profileRef.current.ts)) {
      return profileRef.current.data;
    }
    const data = await getProfile();
    profileRef.current = { data, ts: Date.now() };
    return data;
  }, []);

  const invalidateAll = useCallback(() => {
    todayRef.current = null;
    monthlyRef.current.clear();
    profileRef.current = null;
  }, []);

  return (
    <DataCacheContext.Provider value={{ fetchToday, fetchMonthly, fetchProfile, invalidateAll }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache(): DataCache {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}
