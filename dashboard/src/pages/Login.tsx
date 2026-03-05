import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        // Simulate a short network delay for feel
        await new Promise(r => setTimeout(r, 600));
        const result = login(email, password);
        setIsLoading(false);
        if (!result.success) {
            setError(result.error || 'Login failed.');
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left branding panel */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="hidden lg:flex lg:w-1/2 gradient-dark flex-col justify-between p-12 relative overflow-hidden"
            >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary blur-3xl" />
                    <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-primary blur-3xl" />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-display font-bold text-white text-xl">M&A Thesis Research Tool</span>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl font-display font-bold text-white leading-tight">
                        Acquisition Target
                        <br />
                        Screening
                    </h1>
                    <p className="text-white/60 text-lg leading-relaxed max-w-md">
                        Companies identified through public research that align with the selected investment thesis.
                    </p>
                    <div className="flex flex-col gap-3">
                        {[
                            'Company screening & filtering',
                            'Geographic distribution insights',
                            'Ownership & key contact intelligence',
                        ].map(feature => (
                            <div key={feature} className="flex items-center gap-3">
                                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-white/70 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/30 text-xs">© 2025 M&A Thesis Research Tool. All rights reserved.</p>
                </div>
            </motion.div>

            {/* Right login panel */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="flex-1 flex items-center justify-center p-8"
            >
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-display font-bold text-foreground text-lg">M&A Thesis Research Tool</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground text-sm">Sign in to access your research dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition text-foreground placeholder:text-muted-foreground"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 gradient-primary text-primary-foreground font-semibold text-sm rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Demo credential hints */}
                    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demo Credentials</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p><span className="font-medium text-foreground">Admin:</span> admin@taxtarget.com / admin123</p>
                            <p><span className="font-medium text-foreground">Viewer:</span> viewer@taxtarget.com / viewer123</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
