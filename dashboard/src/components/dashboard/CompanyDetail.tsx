import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, MapPin, Users, DollarSign, Building2, User, Database, LucideIcon } from 'lucide-react';
import { Company } from '@/types/dashboard';

interface Props {
    company: Company;
    onClose: () => void;
}

export function CompanyDetail({ company, onClose }: Props) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={e => e.stopPropagation()}
                    className="relative bg-card rounded-2xl border border-border shadow-elevated w-full max-w-lg overflow-hidden"
                >
                    {/* Header */}
                    <div className="gradient-primary p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-primary-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-primary-foreground">{company.name}</h2>
                                <p className="text-sm text-primary-foreground/75 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {company.city}, {company.state}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem icon={DollarSign} label="Est. Revenue" value={company.estimatedRevenue ? `$${(company.estimatedRevenue / 1000000).toFixed(2)}M` : 'Not available'} />
                            <InfoItem icon={Users} label="Employees" value={company.employeeCount?.toString() || 'Not available'} />
                            <InfoItem icon={Building2} label="Ownership" value={company.ownership} />
                            <InfoItem icon={User} label="Key Contact" value={company.keyContact || 'Not listed'} />
                            <InfoItem icon={Globe} label="Website" value={company.website} isLink />
                            <InfoItem icon={Database} label="Data Source" value={company.dataSource} />
                        </div>

                        <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Services</span>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {company.services.map(s => (
                                    <span key={s} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function InfoItem({ icon: Icon, label, value, isLink }: { icon: LucideIcon; label: string; value: string; isLink?: boolean }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="w-3 h-3" />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            {isLink ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">{value}</a>
            ) : (
                <p className="text-sm font-medium text-foreground">{value}</p>
            )}
        </div>
    );
}
