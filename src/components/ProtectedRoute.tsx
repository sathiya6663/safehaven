import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: ('adult' | 'minor' | 'guardian')[];
}

export function ProtectedRoute({ children, allowedTypes }: ProtectedRouteProps) {
  const { user, userType } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedTypes) {
    // Wait for profile/userType to load before evaluating role-based access
    if (userType === null) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      );
    }
    if (!allowedTypes.includes(userType)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
