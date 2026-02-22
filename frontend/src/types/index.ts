export interface WorkoutDto {
  workoutType: string;
  distanceKm: number;
  paceTarget: string | null;
  description: string | null;
}

export interface CaloriesDto {
  bmr: number;
  trainingBurn: number;
  intensityBonus: number;
  tomorrowPrep: number;
  dailyDeficit: number;
  totalRecommended: number;
  targetWeight: number | null;
  weightToLose: number;
  dietDaysRemaining: number;
  tomorrowWorkoutType: string | null;
  carbLoadingRecommended: boolean;
}

export interface TodayResponse {
  date: string;
  weekNumber: number;
  totalWeeks: number;
  workout: WorkoutDto | null;
  calories: CaloriesDto;
  isRestDay: boolean;
}

export interface ScheduleDayDto {
  date: string;
  weekNumber: number;
  workout: WorkoutDto | null;
  isRestDay: boolean;
  isTrainingDay: boolean;
}

export interface MonthlyScheduleResponse {
  year: number;
  month: number;
  days: ScheduleDayDto[];
}
