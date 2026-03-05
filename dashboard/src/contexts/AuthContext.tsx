import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo users — replace with a real backend integration when ready
const DEMO_USERS: { email: string; password: string; user: AuthUser }[] = [
    {
        email: 'admin@taxtarget.com',
        password: 'admin123',
        user: { name: 'Admin User', email: 'admin@taxtarget.com', role: 'admin' },
    },
    {
        email: 'viewer@taxtarget.com',
        password: 'viewer123',
        user: { name: 'Viewer User', email: 'viewer@taxtarget.com', role: 'viewer' },
    },
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem('auth_user');
            return stored ? (JSON.parse(stored) as AuthUser) : null;
        } catch {
            return null;
        }
    });

    const login = (email: string, password: string): { success: boolean; error?: string } => {
        const match = DEMO_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!match) {
            return { success: false, error: 'Invalid email or password.' };
        }
        setUser(match.user);
        localStorage.setItem('auth_user', JSON.stringify(match.user));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
