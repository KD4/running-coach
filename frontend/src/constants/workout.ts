export const WORKOUT_LABELS: Record<string, string> = {
  EASY: '이지런',
  AR: '에어로빅런',
  TEMPO: '템포런',
  INTERVAL: '인터벌',
  LONG: '롱런',
  REST: '휴식',
  RACE: '레이스',
  PACE_RUN: '페이스런',
  ACTIVE_RECOVERY: '회복 조깅',
};

export const WORKOUT_COLORS: Record<string, string> = {
  EASY: '#4CAF50',
  AR: '#66BB6A',
  TEMPO: '#FF9800',
  INTERVAL: '#F44336',
  LONG: '#2196F3',
  REST: '#9E9E9E',
  RACE: '#9C27B0',
  PACE_RUN: '#00BCD4',
  ACTIVE_RECOVERY: '#78909C',
};

export const WORKOUT_SHORT: Record<string, string> = {
  EASY: '이지',
  AR: 'AR',
  TEMPO: '템포',
  INTERVAL: '인터벌',
  LONG: '롱런',
  REST: '휴식',
  RACE: '레이스',
  PACE_RUN: '페이스',
  ACTIVE_RECOVERY: '회복',
};

export const DAYS = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
] as const;

export const EVENTS = [
  { value: '10K', label: '10K' },
  { value: 'HALF', label: '하프 마라톤' },
  { value: 'MARATHON', label: '풀 마라톤' },
] as const;

export function formatTime(seconds: number): { h: number; m: number; s: number } {
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}
