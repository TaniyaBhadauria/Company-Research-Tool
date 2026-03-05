export interface Company {
    id: string | number;
    name: string;
    city: string;
    state: string;
    stateAbbr: string;
    website: string;
    services: string[];
    estimatedRevenue: number | null;
    employeeCount: number | null;
    ownership: string;
    keyContact: string | null;
    dataSource: string;
    isExcluded: boolean;
}

export interface DashboardStats {
    total: number;
    withOwnership: number;
    avgRevenue: number;
    withRevenueCount: number;
    revenuePct: number;
    byService: Record<string, number>;
    byState: Record<string, number>;
    uniqueStates: number;
    ownershipPct: number;
}
