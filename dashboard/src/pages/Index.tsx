import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { USMap } from '@/components/dashboard/USMap';
import { CompanyTable } from '@/components/dashboard/CompanyTable';
import { PipelineForm } from '@/components/dashboard/PipelineForm';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Company, DashboardStats } from '@/types/dashboard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
const Index = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [selectedPipeline, setSelectedPipeline] = useState('Specialty Tax Advisory Services');
    const [pipelines, setPipelines] = useState<{ id: string, label: string }[]>([]);
    const [isLoadingPipelines, setIsLoadingPipelines] = useState(true);

    // Dynamic company state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

    // Compute stats identically to the old static version whenever `companies` change
    const stats = useMemo<DashboardStats | null>(() => {
        if (!companies || companies.length === 0) return null;

        const total = companies.length;
        const withOwnership = companies.filter(c => c.ownership && c.ownership !== 'Unknown').length;
        const withRevenue = companies.filter(c => c.estimatedRevenue !== null && c.estimatedRevenue !== undefined && c.estimatedRevenue > 0);

        const avgRevenue = withRevenue.length > 0
            ? withRevenue.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0) / withRevenue.length
            : 0;

        const byService: Record<string, number> = {};

        companies.forEach(c => {
            if (c.services && Array.isArray(c.services)) {
                c.services.forEach((s: string) => { byService[s] = (byService[s] || 0) + 1; });
            }
        });

        const byState: Record<string, number> = {};
        companies.forEach(c => {
            if (c.stateAbbr) {
                byState[c.stateAbbr] = (byState[c.stateAbbr] || 0) + 1;
            }
        });

        const uniqueStates = Object.keys(byState).length;

        return {
            total,
            withOwnership,
            avgRevenue,
            withRevenueCount: withRevenue.length,
            revenuePct: total > 0 ? Math.round((withRevenue.length / total) * 100) : 0,
            byService,
            byState,
            uniqueStates,
            ownershipPct: total > 0 ? Math.round((withOwnership / total) * 100) : 0
        };
    }, [companies]);

    useEffect(() => {
        const fetchPipelines = async () => {
            try {
                // Adjust the endpoint to match your backend exactly, e.g., /api/pipelines
                const response = await fetch('/thesis-names');
                if (response.ok) {
                    const data = await response.json();

                    // Assuming the data might be an array of strings ['Specialty Tax Advisory Services', ...] 
                    // OR an array of objects, OR returned in data.pipelines
                    const fetchedPipelines = Array.isArray(data) ? data : (data.pipelines || []);

                    // Format strings into { id, label } objects if necessary
                    const formattedPipelines = fetchedPipelines.map((p: any) =>
                        typeof p === 'string' ? { id: p, label: p } : p
                    );

                    if (formattedPipelines.length > 0) {
                        setPipelines(formattedPipelines);

                        // Force default to Specialty Tax if it exists in the fetched list
                        const specialtyTax = formattedPipelines.find(
                            (p: any) => p.id === 'Specialty Tax Advisory Services' || p.label === 'Specialty Tax Advisory Services'
                        );

                        if (specialtyTax) {
                            setSelectedPipeline(specialtyTax.id);
                        } else if (!formattedPipelines.find((p: any) => p.id === selectedPipeline)) {
                            setSelectedPipeline(formattedPipelines[0].id);
                        }
                    } else {
                        throw new Error('Empty pipelines');
                    }
                } else {
                    throw new Error('Failed to fetch pipelines');
                }
            } catch (error) {
                console.error('Error fetching pipelines:', error);
                // Fallback on error or empty response
                setPipelines([
                    { id: 'Specialty Tax Advisory Services', label: 'Specialty Tax Advisory Services' },
                ]);
            } finally {
                setIsLoadingPipelines(false);
            }
        };

        fetchPipelines();
    }, []);

    // Fetch companies dynamically when selectedPipeline changes
    useEffect(() => {
        if (!selectedPipeline) return;

        const fetchCompanies = async () => {
            setIsLoadingCompanies(true);
            try {
                const response = await fetch('/companies-by-thesis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ thesis_name: selectedPipeline })
                });

                if (response.ok) {
                    const data = await response.json();
                    const rawCompanies = Array.isArray(data) ? data : (data.companies || []);

                    // Map backend schema to frontend Component properties
                    const mappedCompanies: Company[] = rawCompanies.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        city: c.city,
                        state: c.state, // Used depending on if stateAbbr exists
                        stateAbbr: c.state, // Map backend 'state' to 'stateAbbr' if it's the abbreviation
                        website: c.website || '',
                        services: (() => {
                            if (!c.services_readable) return [];
                            return c.services_readable.split(',').map((s: string) => s.trim()).filter(Boolean);
                        })(),
                        estimatedRevenue: c.estimated_revenue || (c.revenue_min && c.revenue_max ? Math.round((c.revenue_min + c.revenue_max) / 2) : null),
                        employeeCount: c.employee_count || (c.employee_min && c.employee_max ? Math.round((c.employee_min + c.employee_max) / 2) : null),
                        ownership: c.ownership_type || 'Unknown',
                        keyContact: c.key_contact || null,
                        dataSource: c.data_source === 'google_maps_places' ? 'Google Maps API' : (c.data_source || 'Unknown'),
                        isExcluded: c.is_excluded === 1,
                    }));

                    setCompanies(mappedCompanies.filter(c => !c.isExcluded));
                } else {
                    console.error('Failed to fetch companies');
                    setCompanies([]);
                }
            } catch (error) {
                console.error('Error fetching companies:', error);
                setCompanies([]);
            } finally {
                setIsLoadingCompanies(false);
            }
        };

        fetchCompanies();
    }, [selectedPipeline]);

    return (
        <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'Dashboard' && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                            <div className="flex items-center gap-2">
                                <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                                    <SelectTrigger className="h-auto border-none shadow-none p-0 text-2xl font-display font-bold text-foreground focus:ring-0 w-auto gap-2 [&>svg]:w-5 [&>svg]:h-5">
                                        {isLoadingPipelines && <Loader2 className="w-5 h-5 animate-spin" />}
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingPipelines ? (
                                            <SelectItem value="loading" disabled>Loading pipelines...</SelectItem>
                                        ) : (
                                            pipelines.map((pipeline: any) => (
                                                <SelectItem key={pipeline.id} value={pipeline.id}>
                                                    {pipeline.label}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">Real-time overview of target companies</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (!companies || companies.length === 0) return;
                                    const exportData = companies.map(c => ({
                                        'Company Name': c.name,
                                        'City': c.city,
                                        'State': c.stateAbbr || c.state,
                                        'Website': c.website,
                                        'Estimated Revenue': c.estimatedRevenue,
                                        'Employee Count': c.employeeCount,
                                        'Ownership': c.ownership,
                                        'Services': (c.services || []).join(', '),
                                        'Key Contact': c.keyContact || '',
                                        'Data Source': c.dataSource,
                                    }));
                                    const ws = XLSX.utils.json_to_sheet(exportData);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
                                    XLSX.writeFile(wb, `${selectedPipeline || 'companies'}.xlsx`);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </button>
                        </motion.div>
                    </div>

                    <KPICards stats={stats} />

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                        <div className="xl:col-span-2">
                            <USMap companies={companies} stats={stats} />
                        </div>
                        <div className="xl:col-span-3">
                            <Charts companies={companies} stats={stats} />
                        </div>
                    </div>

                    <CompanyTable companies={companies} />
                </>
            )}

            {activeTab === 'Pipeline' && <PipelineForm />}

            {activeTab !== 'Dashboard' && activeTab !== 'Pipeline' && (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground text-sm">{activeTab} — Coming soon</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Index;
