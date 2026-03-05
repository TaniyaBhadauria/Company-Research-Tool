export type ServiceType = 'R&D Credits' | 'Cost Segregation' | 'WOTC' | 'Sales & Use Tax';
export type OwnershipType = 'Private' | 'Franchise' | 'PE-Backed' | 'Public' | 'Unknown';

export interface Company {
    id: number;
    name: string;
    city: string;
    state: string;
    stateAbbr: string;
    website: string;
    services: ServiceType[];
    estimatedRevenue: number | null;
    employeeCount: number | null;
    ownership: OwnershipType;
    keyContact: string | null;
    dataSource: string;
}

const states = [
    { name: 'California', abbr: 'CA', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'] },
    { name: 'Texas', abbr: 'TX', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio'] },
    { name: 'New York', abbr: 'NY', cities: ['New York City', 'Buffalo', 'Albany'] },
    { name: 'Florida', abbr: 'FL', cities: ['Miami', 'Tampa', 'Orlando', 'Jacksonville'] },
    { name: 'Illinois', abbr: 'IL', cities: ['Chicago', 'Springfield', 'Naperville'] },
    { name: 'Pennsylvania', abbr: 'PA', cities: ['Philadelphia', 'Pittsburgh', 'Harrisburg'] },
    { name: 'Ohio', abbr: 'OH', cities: ['Columbus', 'Cleveland', 'Cincinnati'] },
    { name: 'Georgia', abbr: 'GA', cities: ['Atlanta', 'Savannah', 'Augusta'] },
    { name: 'North Carolina', abbr: 'NC', cities: ['Charlotte', 'Raleigh', 'Durham'] },
    { name: 'Michigan', abbr: 'MI', cities: ['Detroit', 'Grand Rapids', 'Ann Arbor'] },
    { name: 'New Jersey', abbr: 'NJ', cities: ['Newark', 'Jersey City', 'Princeton'] },
    { name: 'Virginia', abbr: 'VA', cities: ['Richmond', 'Virginia Beach', 'Arlington'] },
    { name: 'Washington', abbr: 'WA', cities: ['Seattle', 'Tacoma', 'Bellevue'] },
    { name: 'Massachusetts', abbr: 'MA', cities: ['Boston', 'Cambridge', 'Worcester'] },
    { name: 'Arizona', abbr: 'AZ', cities: ['Phoenix', 'Scottsdale', 'Tucson'] },
    { name: 'Colorado', abbr: 'CO', cities: ['Denver', 'Boulder', 'Colorado Springs'] },
    { name: 'Tennessee', abbr: 'TN', cities: ['Nashville', 'Memphis', 'Knoxville'] },
    { name: 'Maryland', abbr: 'MD', cities: ['Baltimore', 'Bethesda', 'Rockville'] },
    { name: 'Minnesota', abbr: 'MN', cities: ['Minneapolis', 'St. Paul'] },
    { name: 'Connecticut', abbr: 'CT', cities: ['Hartford', 'Stamford', 'New Haven'] },
];

const serviceTypes: ServiceType[] = ['R&D Credits', 'Cost Segregation', 'WOTC', 'Sales & Use Tax'];
const ownershipTypes: OwnershipType[] = ['Private', 'Franchise', 'PE-Backed', 'Public', 'Unknown'];
const dataSources = ['Google Maps', 'LinkedIn', 'State Business Filings', 'Industry Directory', 'Web Scraping', 'Professional Association'];

const companyNames = [
    'Apex Tax Solutions', 'Meridian Credits Group', 'Summit Specialty Tax', 'Pinnacle R&D Advisors',
    'Atlas Tax Consulting', 'Vanguard Credit Services', 'Catalyst Tax Partners', 'Horizon Tax Group',
    'Sterling Tax Associates', 'Quantum Tax Solutions', 'Elevate Credits LLC', 'Nexus Tax Strategies',
    'Keystone Specialty Tax', 'Ironclad Tax Services', 'Bridgepoint Tax Group', 'Cornerstone Credits',
    'Trident Tax Partners', 'Evergreen Tax Solutions', 'Lighthouse Tax Advisors', 'Silverline Credits',
    'Ascend Tax Group', 'Patriot Tax Solutions', 'Redwood Credit Services', 'Clearwater Tax Advisors',
    'Sapphire Specialty Tax', 'Falcon Tax Partners', 'Granite Tax Solutions', 'Oakwood Credits Group',
    'Diamond Tax Consulting', 'Magellan Tax Advisors', 'Centurion Tax Group', 'Phoenix Credits LLC',
    'Northstar Tax Solutions', 'Beacon Tax Partners', 'Ironbridge Tax Group', 'Sagebrush Tax Advisors',
    'Titan Credits Solutions', 'Velocity Tax Partners', 'Landmark Tax Services', 'Prestige Credit Group',
    'BlueStar Tax Advisors', 'Harbor Tax Solutions', 'Crestview Credits', 'Frontier Tax Partners',
    'Alpine Tax Group', 'Emerald Tax Solutions', 'Pacific Credits Consulting', 'Riverview Tax Advisors',
    'Crossroads Tax Group', 'Liberty Specialty Tax', 'Capital Credits Partners', 'Ridgeline Tax Solutions',
    'Maverick Tax Advisors', 'Noble Tax Group', 'Cascade Credit Services', 'Venture Tax Partners',
    'Sentinel Tax Solutions', 'Compass Credits Group', 'Excelsior Tax Advisors', 'Zenith Tax Partners',
];

const contacts = [
    'James Mitchell', 'Sarah Chen', 'Michael Roberts', 'Jennifer Walsh', 'David Kim',
    'Lisa Thompson', 'Robert Garcia', 'Amanda Foster', 'William Park', 'Emily Johnson',
    'Christopher Lee', 'Rachel Martinez', 'Daniel Brown', 'Stephanie Davis', 'Andrew Wilson',
    'Katherine Moore', 'Thomas Anderson', 'Michelle Taylor', 'Brian White', 'Nicole Harris',
    null, null, null, null, null, null, null, null, null, null,
];

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const rand = seededRandom(42);

export const companies: Company[] = companyNames.map((name, i) => {
    const stateInfo = states[Math.floor(rand() * states.length)];
    const city = stateInfo.cities[Math.floor(rand() * stateInfo.cities.length)];
    const numServices = Math.floor(rand() * 3) + 1;
    const shuffled = [...serviceTypes].sort(() => rand() - 0.5);
    const services = shuffled.slice(0, numServices) as ServiceType[];
    const hasRevenue = rand() > 0.3;
    const hasEmployees = rand() > 0.25;
    const contact = contacts[Math.floor(rand() * contacts.length)];

    return {
        id: i + 1,
        name,
        city,
        state: stateInfo.name,
        stateAbbr: stateInfo.abbr,
        website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        services,
        estimatedRevenue: hasRevenue ? Math.round((rand() * 45 + 1) * 100000) : null,
        employeeCount: hasEmployees ? Math.floor(rand() * 200) + 5 : null,
        ownership: ownershipTypes[Math.floor(rand() * ownershipTypes.length)],
        keyContact: contact,
        dataSource: dataSources[Math.floor(rand() * dataSources.length)],
    };
});

// Computed stats
export const getStats = () => {
    const total = companies.length;
    const withOwnership = companies.filter(c => c.ownership !== 'Unknown').length;
    const withRevenue = companies.filter(c => c.estimatedRevenue !== null);
    const avgRevenue = withRevenue.length > 0
        ? withRevenue.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0) / withRevenue.length
        : 0;

    const byService: Record<string, number> = {};
    serviceTypes.forEach(s => { byService[s] = 0; });
    companies.forEach(c => c.services.forEach(s => { byService[s] = (byService[s] || 0) + 1; }));

    const byState: Record<string, number> = {};
    companies.forEach(c => { byState[c.stateAbbr] = (byState[c.stateAbbr] || 0) + 1; });

    const uniqueStates = Object.keys(byState).length;

    return { total, withOwnership, avgRevenue, byService, byState, uniqueStates, ownershipPct: Math.round((withOwnership / total) * 100) };
};
