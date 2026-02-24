import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { token, isNewUser, isGuest, guestProfile } = useAuth();

  if (!token && !isGuest) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isGuest && !guestProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!isGuest && isNewUser) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
