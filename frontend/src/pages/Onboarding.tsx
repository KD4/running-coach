import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding } from '../api/user';
import { useAuth } from '../contexts/AuthContext';

const DAYS = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];

const EVENTS = [
  { value: '10K', label: '10K' },
  { value: 'HALF', label: '하프 마라톤' },
  { value: 'MARATHON', label: '풀 마라톤' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { isGuest, setOnboarded, setGuestProfile } = useAuth();
  const [goalEvent, setGoalEvent] = useState('10K');
  const [goalHours, setGoalHours] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(50);
  const [goalSeconds, setGoalSeconds] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [trainingDays, setTrainingDays] = useState<string[]>(['TUE', 'THU', 'SAT']);
  const [longRunDay, setLongRunDay] = useState('SAT');
  const [bodyWeight, setBodyWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (trainingDays.length < 3) {
      setError('최소 3일 이상의 훈련일을 선택해주세요.');
      return;
    }
    if (!trainingDays.includes(longRunDay)) {
      setError('롱런 요일은 훈련일에 포함되어야 합니다.');
      return;
    }
    if (!targetDate) {
      setError('대회 날짜를 선택해주세요.');
      return;
    }

    const profileData = {
      goalEvent,
      goalTimeSeconds: goalHours * 3600 + goalMinutes * 60 + goalSeconds,
      targetDate,
      trainingDays,
      longRunDay,
      bodyWeight,
      targetWeight: targetWeight ? Number(targetWeight) : null,
    };

    if (isGuest) {
      setGuestProfile(profileData);
      setOnboarded();
      navigate('/today', { replace: true });
      return;
    }

    setLoading(true);
    try {
      await submitOnboarding(profileData);
      setOnboarded();
      navigate('/today', { replace: true });
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page onboarding-page">
      <h1>훈련 프로필 설정</h1>
      <p className="page-subtitle">맞춤 훈련 플랜을 위한 정보를 입력해주세요</p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label>목표 대회</label>
          <div className="chip-group">
            {EVENTS.map((ev) => (
              <button
                key={ev.value}
                type="button"
                className={`chip ${goalEvent === ev.value ? 'active' : ''}`}
                onClick={() => setGoalEvent(ev.value)}
              >
                {ev.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>목표 기록</label>
          <div className="time-inputs">
            <div className="time-field">
              <input type="number" min={0} max={9} value={goalHours} onChange={(e) => setGoalHours(Number(e.target.value))} />
              <span>시간</span>
            </div>
            <div className="time-field">
              <input type="number" min={0} max={59} value={goalMinutes} onChange={(e) => setGoalMinutes(Number(e.target.value))} />
              <span>분</span>
            </div>
            <div className="time-field">
              <input type="number" min={0} max={59} value={goalSeconds} onChange={(e) => setGoalSeconds(Number(e.target.value))} />
              <span>초</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>대회 날짜</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="form-input" />
        </div>

        <div className="form-group">
          <label>훈련 요일 (3일 이상)</label>
          <div className="chip-group">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`chip ${trainingDays.includes(day.value) ? 'active' : ''}`}
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>롱런 요일</label>
          <div className="chip-group">
            {DAYS.filter((d) => trainingDays.includes(d.value)).map((day) => (
              <button
                key={day.value}
                type="button"
                className={`chip ${longRunDay === day.value ? 'active' : ''}`}
                onClick={() => setLongRunDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>체중 (kg)</label>
          <input
            type="number"
            min={30}
            max={200}
            step={0.1}
            value={bodyWeight}
            onChange={(e) => setBodyWeight(Number(e.target.value))}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>레이스 목표 체중 (선택)</label>
          <input
            type="number"
            min={30}
            max={200}
            step={0.1}
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="예: 62.0"
            className="form-input"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '훈련 시작하기'}
        </button>
      </form>
    </div>
  );
}
