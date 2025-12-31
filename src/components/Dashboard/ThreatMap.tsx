
import { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Graticule, Sphere } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberNewsTicker } from '@/components/Dashboard/CyberNewsTicker';

// GeoJSON for the world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatPing {
    id: string;
    coordinates: [number, number];
    isSafe: boolean;
    timestamp: number;
}

interface ScanLog {
    id: string;
    verdict: string;
    created_at: string;
    // If lat/long are not in DB, we will mock them
    latitude?: number;
    longitude?: number;
}

export const ThreatMap = () => {
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [pings, setPings] = useState<ThreatPing[]>([]);

    // Cleanup old pings
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            // Keep pings for 1 minute (60000ms) or indefinitely if needed for history
            setPings((current) => current.filter((p) => now - p.timestamp < 60000));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // 1. Initial Load: Fetch recent history so map isn't empty
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('scan_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                const historicalPings: ThreatPing[] = data.map(log => {
                    // Fallback coord logic if DB has nulls (for old data)
                    const mockLat = (Math.random() * 140) - 70;
                    const mockLng = (Math.random() * 360) - 180;

                    return {
                        id: log.id,
                        coordinates: [
                            log.longitude ?? mockLng,
                            log.latitude ?? mockLat
                        ],
                        isSafe: log.verdict === 'SAFE',
                        timestamp: new Date(log.created_at).getTime()
                    };
                });
                setPings(historicalPings);
            }
        };

        fetchHistory();

        // 2. Realtime Subscription
        const channel = supabase
            .channel('global-threat-map')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'scan_logs' },
                (payload) => {
                    const log = payload.new as ScanLog;

                    // MOCK COORDINATES if not present (Fallback logic)
                    const mockLat = (Math.random() * 140) - 70;
                    const mockLng = (Math.random() * 360) - 180;

                    const coordinates: [number, number] = [
                        log.longitude ?? mockLng,
                        log.latitude ?? mockLat
                    ];

                    const newPing: ThreatPing = {
                        id: log.id,
                        coordinates,
                        isSafe: log.verdict === 'SAFE',
                        timestamp: Date.now(),
                    };

                    setPings((prev) => [...prev, newPing]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="w-full h-[400px] bg-[#050a14] rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col">
            {/* Map Container - Flex grow to fill space above ticker */}
            <div className="relative flex-1 w-full min-h-0">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 280,
                        center: [0, 15]
                    }}
                    width={1400}
                    height={350}
                    className="w-full h-full"
                >
                    <Sphere stroke="#374151" strokeWidth={0.5} id="sphere" fill="none" />
                    <Graticule stroke="rgba(255, 255, 255, 0.05)" strokeWidth={0.5} />

                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onClick={() => setSelectedCountry(geo)}
                                    fill={selectedCountry?.rsmKey === geo.rsmKey ? "rgba(56, 189, 248, 0.4)" : "rgba(30, 41, 59, 0.8)"}
                                    stroke={selectedCountry?.rsmKey === geo.rsmKey ? "rgba(56, 189, 248, 0.8)" : "rgba(56, 189, 248, 0.3)"}
                                    strokeWidth={selectedCountry?.rsmKey === geo.rsmKey ? 1 : 0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: {
                                            fill: "rgba(56, 189, 248, 0.2)",
                                            stroke: "rgba(56, 189, 248, 0.8)",
                                            outline: "none",
                                            transition: "all 0.3s ease",
                                            cursor: "pointer"
                                        },
                                        pressed: {
                                            fill: "rgba(56, 189, 248, 0.5)",
                                            outline: "none"
                                        },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Static Network Nodes Grid (Blue) */}
                    {Array.from({ length: 60 }).map((_, i) => {
                        const lat = (Math.floor(i / 12) * 25) - 50;
                        const lng = ((i % 12) * 30) - 160;
                        return (
                            <Marker key={`node-${i}`} coordinates={[lng, lat]}>
                                <circle r={1} fill="rgba(56, 189, 248, 0.3)" />
                            </Marker>
                        );
                    })}

                    {/* Sample Active Attack Hotspots (Red) */}
                    {[
                        [-74.006, 40.7128], // NYC
                        [37.6173, 55.7558], // Moscow
                        [116.4074, 39.9042], // Beijing
                        [139.6917, 35.6895], // Tokyo
                        [-0.1276, 51.5074],  // London
                        [-43.0, -22.0], // Rio
                        [151.2, -33.8] // Sydney
                    ].map((coords, i) => (
                        <Marker key={`hotspot-${i}`} coordinates={coords as [number, number]}>
                            <motion.circle
                                r={3}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth={1}
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
                            />
                            <circle r={2} fill="#ef4444" className="filter drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                        </Marker>
                    ))}

                    {/* Render Pings */}
                    {pings.map((ping) => (
                        <Marker key={ping.id} coordinates={ping.coordinates}>
                            <g>
                                {/* Ripple Effect */}
                                <motion.circle
                                    r={4}
                                    fill="none"
                                    stroke={ping.isSafe ? "#38bdf8" : "#ef4444"}
                                    strokeWidth={2}
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 4, opacity: 0 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                />

                                {/* Core Dot */}
                                <circle
                                    r={2}
                                    fill={ping.isSafe ? "#38bdf8" : "#ef4444"}
                                    className="filter drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]"
                                />
                            </g>
                        </Marker>
                    ))}
                </ComposableMap>

                {/* Overlay UI */}
                <div className="absolute top-4 left-4 pointer-events-none">
                    <h3 className="text-neon-cyan font-display text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Live Threat Feed
                    </h3>
                </div>

                {/* Grid Overlay for Cyber Feel */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                {/* Country Detail Popup - Moved up to avoid ticker */}
                <AnimatePresence>
                    {selectedCountry && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-4 left-4 z-50 bg-[#0f172a]/95 backdrop-blur-md border border-neon-cyan/50 p-4 rounded-xl shadow-2xl w-64 text-left"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-neon-cyan font-bold text-lg">{selectedCountry.properties.name}</h4>
                                <button
                                    onClick={() => setSelectedCountry(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    x
                                </button>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Threat Level:</span>
                                    <span className="text-red-400 font-mono animate-pulse">CRITICAL</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Active Nodes:</span>
                                    <span className="text-neon-green font-mono">{Math.floor(Math.random() * 50) + 12}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Intercepts:</span>
                                    <span className="text-white font-mono">{Math.floor(Math.random() * 1000) + 500}</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-700">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recent Activity</div>
                                <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple w-[75%] animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* News Ticker Bar */}
            <div className="relative z-50 border-t border-slate-800">
                <CyberNewsTicker />
            </div>
        </div >
    );
};
