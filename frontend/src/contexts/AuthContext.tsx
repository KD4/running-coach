import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GuestProfile {
  goalEvent: string;
  goalTimeSeconds: number;
  targetDate: string;
  trainingDays: string[];
  longRunDay: string;
  bodyWeight: number;
  targetWeight?: number | null;
}

interface AuthContextType {
  token: string | null;
  isNewUser: boolean;
  isGuest: boolean;
  guestProfile: GuestProfile | null;
  login: (token: string, isNewUser: boolean) => void;
  loginAsGuest: () => void;
  logout: () => void;
  setOnboarded: () => void;
  setGuestProfile: (profile: GuestProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isNewUser, setIsNewUser] = useState<boolean>(() => localStorage.getItem('isNewUser') === 'true');
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem('isGuest') === 'true');
  const [guestProfile, setGuestProfileState] = useState<GuestProfile | null>(() => {
    const saved = localStorage.getItem('guestProfile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('isNewUser', String(isNewUser));
  }, [isNewUser]);

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('isGuest', 'true');
    } else {
      localStorage.removeItem('isGuest');
    }
  }, [isGuest]);

  const login = (newToken: string, newUser: boolean) => {
    setToken(newToken);
    setIsNewUser(newUser);
    setIsGuest(false);
    setGuestProfileState(null);
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestProfile');
  };

  const loginAsGuest = () => {
    setToken(null);
    setIsGuest(true);
    setIsNewUser(true);
    localStorage.removeItem('token');
  };

  const logout = () => {
    setToken(null);
    setIsNewUser(false);
    setIsGuest(false);
    setGuestProfileState(null);
    localStorage.removeItem('token');
    localStorage.removeItem('isNewUser');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestProfile');
  };

  const setOnboarded = () => {
    setIsNewUser(false);
    localStorage.setItem('isNewUser', 'false');
  };

  const setGuestProfile = (profile: GuestProfile) => {
    setGuestProfileState(profile);
    localStorage.setItem('guestProfile', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider value={{ token, isNewUser, isGuest, guestProfile, login, loginAsGuest, logout, setOnboarded, setGuestProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
