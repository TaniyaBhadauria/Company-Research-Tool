import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Company, DashboardStats } from '@/types/dashboard';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-elevated text-xs">
            <p className="font-medium text-foreground">{label || payload[0].name}</p>
            <p className="text-primary font-bold">{payload[0].value} companies</p>
        </div>
    );
};

export function Charts({ companies, stats }: { companies: Company[], stats: DashboardStats }) {
    if (!companies || companies.length === 0 || !stats) {
        return (
            <div className="flex h-64 items-center justify-center bg-card rounded-xl border border-border mt-4">
                <p className="text-muted-foreground text-sm">No data available for charts.</p>
            </div>
        );
    }

    const serviceData = Object.entries(stats.byService || {})
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1]) // Sort from highest to lowest
        .map(([name, value]) => ({
            name: name.length > 20 ? name.substring(0, 20) + '...' : name,
            value
        }));
    const COLORS = ['hsl(160,51%,35%)', 'hsl(200,80%,50%)', 'hsl(38,92%,50%)', 'hsl(220,45%,50%)'];

    const stateData = Object.entries(stats.byState)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)
        .map(([state, count]) => ({ state, count }));

    const revenueRanges = [
        { range: '<$1M', count: 0 },
        { range: '$1-2M', count: 0 },
        { range: '$2-3M', count: 0 },
        { range: '$3-4M', count: 0 },
        { range: '$4M+', count: 0 },
    ];
    companies.forEach(c => {
        if (!c.estimatedRevenue) return;
        const m = c.estimatedRevenue / 1000000;
        if (m < 1) revenueRanges[0].count++;
        else if (m < 2) revenueRanges[1].count++;
        else if (m < 3) revenueRanges[2].count++;
        else if (m < 4) revenueRanges[3].count++;
        else revenueRanges[4].count++;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Service Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-card rounded-xl border border-border card-shadow p-5"
            >
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Service Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">By specialty type</p>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={serviceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {serviceData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {serviceData.map((d: any, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-muted-foreground">{d.name}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Geographic Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="bg-card rounded-xl border border-border card-shadow p-5"
            >
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Top States</h3>
                <p className="text-xs text-muted-foreground mb-4">Geographic distribution</p>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stateData} layout="vertical" margin={{ left: 20, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,14%,91%)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(210,11%,45%)' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: 'hsl(210,11%,45%)' }} axisLine={false} tickLine={false} width={50} interval={0} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="hsl(160,51%,35%)" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Revenue Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-card rounded-xl border border-border card-shadow p-5"
            >
                <h3 className="text-sm font-display font-semibold text-foreground mb-1">Revenue Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Estimated annual revenue</p>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={revenueRanges} margin={{ left: -10, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,14%,91%)" vertical={false} />
                        <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(210,11%,45%)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(210,11%,45%)' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="hsl(160,40%,50%)" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
}
