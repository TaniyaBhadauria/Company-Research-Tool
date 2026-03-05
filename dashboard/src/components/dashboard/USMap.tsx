import { useState } from 'react';
import { motion } from 'framer-motion';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { stateCoordinates } from '@/data/stateCoordinates';
import { Company, DashboardStats } from '@/types/dashboard';

export function USMap({ companies, stats }: { companies: Company[], stats: DashboardStats }) {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    const stateData: Record<string, { count: number, lat: number, lng: number, companies: Company[] }> = {};

    if (companies && companies.length > 0) {
        companies.forEach(company => {
            const stateAbbr = company.stateAbbr || company.state;
            const coords = stateCoordinates[stateAbbr];
            if (coords) {
                if (!stateData[stateAbbr]) {
                    stateData[stateAbbr] = { count: 0, lat: coords.lat, lng: coords.lng, companies: [] };
                }
                stateData[stateAbbr].count += 1;
                stateData[stateAbbr].companies.push(company);
            }
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="bg-card rounded-xl border border-border card-shadow p-5 flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-display font-semibold text-foreground mb-1">Geographic Reach</h3>
                </div>
            </div>

            <div className="w-full rounded-md overflow-hidden mt-2 flex-grow min-h-[300px]">
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                    <Map
                        defaultZoom={3.5}
                        defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
                        mapId="DEMO_MAP_ID"
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                    >
                        {Object.entries(stateData).map(([state, data]) => {
                            const size = Math.min(12 + data.count * 1.5, 30);
                            return (
                                <AdvancedMarker
                                    key={state}
                                    position={{ lat: data.lat, lng: data.lng }}
                                    onClick={() => setSelectedState(state)}
                                >
                                    <div
                                        className="rounded-full cursor-pointer shadow-md flex items-center justify-center text-white font-bold"
                                        style={{
                                            width: `${size}px`,
                                            height: `${size}px`,
                                            backgroundColor: 'hsl(160, 51%, 35%)',
                                            opacity: 0.85,
                                            fontSize: `${Math.max(size * 0.38, 8)}px`,
                                        }}
                                    >
                                        {data.count}
                                    </div>
                                </AdvancedMarker>
                            );
                        })}

                        {selectedState && stateData[selectedState] && (
                            <InfoWindow
                                position={{ lat: stateData[selectedState].lat, lng: stateData[selectedState].lng }}
                                onCloseClick={() => setSelectedState(null)}
                            >
                                <div className="p-2 max-w-[220px] text-zinc-800">
                                    <h4 className="font-bold text-sm mb-1.5 border-b pb-1">
                                        {selectedState} — {stateData[selectedState].count} {stateData[selectedState].count === 1 ? 'company' : 'companies'}
                                    </h4>
                                    <ul className="text-xs space-y-1 max-h-[150px] overflow-y-auto">
                                        {stateData[selectedState].companies.map(c => (
                                            <li key={c.id}>• {c.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>
                </APIProvider>
            </div>
        </motion.div>
    );
}
