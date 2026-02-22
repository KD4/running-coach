import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/user';
import type { ProfileResponse } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import type { GuestProfile } from '../contexts/AuthContext';

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

function formatTime(seconds: number): { h: number; m: number; s: number } {
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

function guestToProfileResponse(g: GuestProfile): ProfileResponse {
  return {
    goalEvent: g.goalEvent,
    goalTimeSeconds: g.goalTimeSeconds,
    targetDate: g.targetDate,
    trainingDays: g.trainingDays,
    longRunDay: g.longRunDay,
    bodyWeight: g.bodyWeight,
    targetWeight: g.targetWeight ?? null,
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout, isGuest, guestProfile, setGuestProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // edit form state
  const [goalEvent, setGoalEvent] = useState('');
  const [goalH, setGoalH] = useState(0);
  const [goalM, setGoalM] = useState(0);
  const [goalS, setGoalS] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [trainingDays, setTrainingDays] = useState<string[]>([]);
  const [longRunDay, setLongRunDay] = useState('');
  const [bodyWeight, setBodyWeight] = useState(70);
  const [targetWeight, setTargetWeight] = useState<string>('');

  useEffect(() => {
    if (isGuest && guestProfile) {
      const p = guestToProfileResponse(guestProfile);
      setProfile(p);
      fillForm(p);
      setLoading(false);
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
        fillForm(p);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('프로필이 아직 설정되지 않았습니다. 온보딩을 완료해주세요.');
        } else {
          setError('프로필을 불러오지 못했습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fillForm = (p: ProfileResponse) => {
    setGoalEvent(p.goalEvent);
    const t = formatTime(p.goalTimeSeconds);
    setGoalH(t.h);
    setGoalM(t.m);
    setGoalS(t.s);
    setTargetDate(p.targetDate);
    setTrainingDays(p.trainingDays);
    setLongRunDay(p.longRunDay);
    setBodyWeight(p.bodyWeight);
    setTargetWeight(p.targetWeight != null ? String(p.targetWeight) : '');
  };

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    if (trainingDays.length < 3) {
      setError('최소 3일 이상의 훈련일을 선택해주세요.');
      return;
    }
    if (!trainingDays.includes(longRunDay)) {
      setError('롱런 요일은 훈련일에 포함되어야 합니다.');
      return;
    }

    const profileData = {
      goalEvent,
      goalTimeSeconds: goalH * 3600 + goalM * 60 + goalS,
      targetDate,
      trainingDays,
      longRunDay,
      bodyWeight,
      targetWeight: targetWeight ? Number(targetWeight) : null,
    };

    if (isGuest) {
      setGuestProfile(profileData);
      setProfile(guestToProfileResponse(profileData));
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(profileData);
      setProfile(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) fillForm(profile);
    setEditing(false);
    setError(null);
  };

  if (loading) return <div className="page"><p>로딩 중...</p></div>;

  if (!profile) return <div className="page"><p className="error-text">{error || '프로필이 없습니다.'}</p></div>;

  const eventLabel = EVENTS.find((e) => e.value === profile.goalEvent)?.label ?? profile.goalEvent;
  const time = formatTime(profile.goalTimeSeconds);

  return (
    <div className="page profile-page">
      <h1>내 프로필</h1>

      {!editing ? (
        <div className="profile-view">
          <div className="profile-card">
            <div className="profile-row"><span className="label">목표 대회</span><span>{eventLabel}</span></div>
            <div className="profile-row"><span className="label">목표 기록</span><span>{time.h}시간 {time.m}분 {time.s}초</span></div>
            <div className="profile-row"><span className="label">대회 날짜</span><span>{profile.targetDate}</span></div>
            <div className="profile-row">
              <span className="label">훈련 요일</span>
              <span>{profile.trainingDays.map((d) => DAYS.find((dd) => dd.value === d)?.label).join(', ')}</span>
            </div>
            <div className="profile-row">
              <span className="label">롱런 요일</span>
              <span>{DAYS.find((d) => d.value === profile.longRunDay)?.label}</span>
            </div>
            <div className="profile-row"><span className="label">체중</span><span>{profile.bodyWeight} kg</span></div>
            {profile.targetWeight != null && (
              <div className="profile-row"><span className="label">목표 체중</span><span>{profile.targetWeight} kg</span></div>
            )}
          </div>
          {success && <p className="success-text">저장 완료!</p>}
          {isGuest && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>게스트 모드로 사용 중입니다. 로그인하면 데이터가 저장됩니다.</p>}
          <button className="btn-primary" onClick={() => setEditing(true)}>수정하기</button>
          {isGuest ? (
            <button className="btn-secondary" onClick={() => { logout(); navigate('/login', { replace: true }); }} style={{ marginTop: 8 }}>로그인하기</button>
          ) : (
            <button className="btn-secondary" onClick={logout} style={{ marginTop: 8 }}>로그아웃</button>
          )}
        </div>
      ) : (
        <div className="profile-edit">
          <div className="form-group">
            <label>목표 대회</label>
            <div className="chip-group">
              {EVENTS.map((ev) => (
                <button key={ev.value} type="button" className={`chip ${goalEvent === ev.value ? 'active' : ''}`} onClick={() => setGoalEvent(ev.value)}>
                  {ev.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>목표 기록</label>
            <div className="time-inputs">
              <div className="time-field">
                <input type="number" min={0} max={9} value={goalH} onChange={(e) => setGoalH(Number(e.target.value))} />
                <span>시간</span>
              </div>
              <div className="time-field">
                <input type="number" min={0} max={59} value={goalM} onChange={(e) => setGoalM(Number(e.target.value))} />
                <span>분</span>
              </div>
              <div className="time-field">
                <input type="number" min={0} max={59} value={goalS} onChange={(e) => setGoalS(Number(e.target.value))} />
                <span>초</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>대회 날짜</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="form-input" />
          </div>

          <div className="form-group">
            <label>훈련 요일</label>
            <div className="chip-group">
              {DAYS.map((day) => (
                <button key={day.value} type="button" className={`chip ${trainingDays.includes(day.value) ? 'active' : ''}`} onClick={() => toggleDay(day.value)}>
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>롱런 요일</label>
            <div className="chip-group">
              {DAYS.filter((d) => trainingDays.includes(d.value)).map((day) => (
                <button key={day.value} type="button" className={`chip ${longRunDay === day.value ? 'active' : ''}`} onClick={() => setLongRunDay(day.value)}>
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>체중 (kg)</label>
            <input type="number" min={30} max={200} step={0.1} value={bodyWeight} onChange={(e) => setBodyWeight(Number(e.target.value))} className="form-input" />
          </div>

          <div className="form-group">
            <label>레이스 목표 체중 (선택)</label>
            <input type="number" min={30} max={200} step={0.1} value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="예: 62.0" className="form-input" />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="btn-row">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            <button className="btn-secondary" onClick={handleCancel}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
