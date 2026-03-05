import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ExternalLink, Filter, Flag } from 'lucide-react';
import { CompanyDetail } from './CompanyDetail';
import { Company } from '@/types/dashboard';

// Color palette for service pills and filter buttons
const SERVICE_COLORS = [
    { bg: 'bg-emerald-500/15', text: 'text-emerald-600', activeBg: 'bg-emerald-500', activeText: 'text-white' },
    { bg: 'bg-sky-500/15', text: 'text-sky-600', activeBg: 'bg-sky-500', activeText: 'text-white' },
    { bg: 'bg-amber-500/15', text: 'text-amber-600', activeBg: 'bg-amber-500', activeText: 'text-white' },
    { bg: 'bg-violet-500/15', text: 'text-violet-600', activeBg: 'bg-violet-500', activeText: 'text-white' },
    { bg: 'bg-rose-500/15', text: 'text-rose-600', activeBg: 'bg-rose-500', activeText: 'text-white' },
    { bg: 'bg-teal-500/15', text: 'text-teal-600', activeBg: 'bg-teal-500', activeText: 'text-white' },
    { bg: 'bg-orange-500/15', text: 'text-orange-600', activeBg: 'bg-orange-500', activeText: 'text-white' },
    { bg: 'bg-indigo-500/15', text: 'text-indigo-600', activeBg: 'bg-indigo-500', activeText: 'text-white' },
];

// Build a stable mapping: first unique service seen -> index 0, next -> index 1, etc.
const serviceColorMap = new Map<string, number>();

const getServiceColorIndex = (service: string, allServices: string[]) => {
    if (!serviceColorMap.has(service)) {
        // Assign based on the order the service appears in the allServices list
        const idx = allServices.indexOf(service);
        serviceColorMap.set(service, idx >= 0 ? idx : serviceColorMap.size);
    }
    return serviceColorMap.get(service)! % SERVICE_COLORS.length;
};

type SortKey = 'name' | 'state' | 'estimatedRevenue' | 'employeeCount' | 'ownership';

export function CompanyTable({ companies }: { companies: Company[] }) {
    const [search, setSearch] = useState('');
    const [serviceFilter, setServiceFilter] = useState<string>('All');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const filtered = useMemo(() => {
        let list = [...(companies || [])];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                (c.city || '').toLowerCase().includes(q) ||
                (c.state || '').toLowerCase().includes(q) ||
                (c.stateAbbr || '').toLowerCase().includes(q)
            );
        }
        if (serviceFilter !== 'All') {
            list = list.filter(c => Array.isArray(c.services) && c.services.includes(serviceFilter));
        }

        list.sort((a, b) => {
            let aVal: string | number | null = a[sortKey];
            let bVal: string | number | null = b[sortKey];

            if (aVal === null) return sortDir === 'asc' ? 1 : -1;
            if (bVal === null) return sortDir === 'asc' ? -1 : 1;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }

            const nA = aVal as number;
            const nB = bVal as number;
            return sortDir === 'asc' ? nA - nB : nB - nA;
        });
        return list;
    }, [companies, search, serviceFilter, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-muted-foreground/40" />;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
    };

    const services = useMemo(() => {
        const set = new Set<string>();
        (companies || []).forEach(c => {
            if (c.services && Array.isArray(c.services)) {
                c.services.forEach((s: string) => set.add(s));
            }
        });
        return ['All', ...Array.from(set).sort()];
    }, [companies]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-card rounded-xl border border-border card-shadow overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <div>
                            <h2 className="text-lg font-display font-semibold text-foreground">Companies Pipeline</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} companies found</p>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/20 w-56 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="flex gap-1 items-center">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                {services.map((s, idx) => {
                                    const isAll = s === 'All';
                                    const isActive = serviceFilter === s;
                                    const colorIdx = isAll ? -1 : getServiceColorIndex(s, services.filter(x => x !== 'All'));
                                    const color = !isAll && colorIdx >= 0 ? SERVICE_COLORS[colorIdx] : null;

                                    let className = 'px-2.5 py-1 text-xs rounded-md transition-colors font-medium ';
                                    if (isActive) {
                                        className += isAll
                                            ? 'bg-primary text-primary-foreground'
                                            : `${color!.activeBg} ${color!.activeText}`;
                                    } else {
                                        className += isAll
                                            ? 'bg-muted text-muted-foreground hover:bg-accent'
                                            : `${color!.bg} ${color!.text} hover:opacity-80`;
                                    }

                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setServiceFilter(s)}
                                            className={className}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                {([['name', 'Company'], ['state', 'Location'], ['estimatedRevenue', 'Est. Revenue'], ['employeeCount', 'Employees'], ['ownership', 'Ownership']] as [SortKey, string][]).map(([key, label]) => (
                                    <th
                                        key={key}
                                        onClick={() => toggleSort(key)}
                                        className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            {label}
                                            <SortIcon col={key} />
                                        </div>
                                    </th>
                                ))}
                                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Services</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filtered.map((company, i) => (
                                    <motion.tr
                                        key={company.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                                        onClick={() => setSelectedCompany(company)}
                                        className="border-b border-border/50 hover:bg-accent/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{company.name}</span>
                                                {company.website && <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                {(company.ownership?.toLowerCase().includes('equity') || company.ownership?.toLowerCase().includes('pe-backed')) && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 text-[10px] font-semibold">
                                                        <Flag className="w-2.5 h-2.5" />
                                                        PE
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground">{company.city}, {company.stateAbbr}</td>
                                        <td className="px-5 py-3.5 text-foreground">
                                            {company.estimatedRevenue ? `$${(company.estimatedRevenue / 1000000).toFixed(1)}M` : <span className="text-muted-foreground/50">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-foreground">
                                            {company.employeeCount ?? <span className="text-muted-foreground/50">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(company.ownership?.toLowerCase().includes('equity') || company.ownership?.toLowerCase().includes('pe-backed')) ? 'bg-red-500/15 text-red-600 ring-1 ring-red-500/30' :
                                                company.ownership?.toLowerCase() === 'private' ? 'bg-primary/15 text-primary' :
                                                    company.ownership?.toLowerCase() === 'public' ? 'bg-warning/15 text-warning' :
                                                        company.ownership?.toLowerCase() === 'franchise' ? 'bg-chart-5/15 text-chart-5' :
                                                            'bg-muted text-muted-foreground'
                                                }`}>
                                                {company.ownership}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1 flex-wrap">
                                                {(company.services || []).map((s: string) => {
                                                    const colorIdx = getServiceColorIndex(s, services.filter(x => x !== 'All'));
                                                    const color = SERVICE_COLORS[colorIdx];
                                                    return (
                                                        <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${color.bg} ${color.text}`}>
                                                            {s}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{company.keyContact ? company.keyContact.split('(')[0].trim() : <span className="text-muted-foreground/50">—</span>}</td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {selectedCompany && (
                <CompanyDetail company={selectedCompany} onClose={() => setSelectedCompany(null)} />
            )}
        </>
    );
}
