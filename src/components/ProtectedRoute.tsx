import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: ('woman' | 'child' | 'guardian')[];
}

export function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { user, userType } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedTypes && userType && !allowedTypes.includes(userType)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
