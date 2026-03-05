import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        // User is authenticated but doesn't have the required role
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="text-6xl">🔒</div>
                    <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                    <p className="text-muted-foreground">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
