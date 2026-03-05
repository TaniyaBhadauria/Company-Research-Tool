import { motion } from 'framer-motion';
import { Building2, MapPin, DollarSign, Users, ShieldCheck, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';

export function KPICards({ stats }: { stats: DashboardStats }) {
    if (!stats) return null;

    const topService = Object.entries(stats.byService || {}).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0];

    const cards = [
        {
            label: 'Total Companies',
            value: stats.total.toString(),
            icon: Building2,
            change: '',
            accent: false,
        },
        {
            label: 'States with Identified Targets',
            value: stats.uniqueStates.toString(),
            icon: MapPin,
            change: '',
            accent: false,
        },
        {
            label: 'Revenue Data Coverage',
            value: `${stats.withRevenueCount} / ${stats.total}`,
            icon: DollarSign,
            change: `${stats.revenuePct}% of companies`,
            accent: false,
        },
        {
            label: 'Ownership Identified',
            value: `${stats.ownershipPct}%`,
            icon: ShieldCheck,
            change: `${stats.withOwnership} companies`,
            accent: true,
        },
        {
            label: topService ? topService[0] : 'Top Service',
            value: topService ? topService[1].toString() : '0',
            icon: TrendingUp,
            change: 'Companies offering',
            accent: false,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                    className={`rounded-xl p-5 border transition-shadow duration-300 hover:card-shadow-hover ${card.accent
                        ? 'gradient-primary text-primary-foreground border-transparent'
                        : 'bg-card border-border card-shadow'
                        }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-medium uppercase tracking-wider ${card.accent ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                            {card.label}
                        </span>
                        <card.icon className={`w-4 h-4 ${card.accent ? 'text-primary-foreground/70' : 'text-primary'}`} />
                    </div>
                    <div className={`text-2xl font-display font-bold ${card.accent ? '' : 'text-foreground'}`}>
                        {card.value}
                    </div>
                    <div className={`text-xs mt-1 ${card.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {card.change}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
