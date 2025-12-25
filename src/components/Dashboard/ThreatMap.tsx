
import { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [pings, setPings] = useState<ThreatPing[]>([]);

    // Cleanup old pings
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setPings((current) => current.filter((p) => now - p.timestamp < 3000));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // 1. Initial Load (Optional, maybe just show empty map or last few)
        // For visual impact, let's just wait for live events or simulate some if needed.

        // 2. Realtime Subscription
        const channel = supabase
            .channel('global-threat-map')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'scan_logs' },
                (payload) => {
                    const log = payload.new as ScanLog;

                    // MOCK COORDINATES if not present (Fallback logic)
                    // Ideally, the backend should provide this via GeoIP.
                    // For Imagine Cup demo, random distribution on land-masses is often acceptable if GeoIP isn't ready.
                    const mockLat = (Math.random() * 140) - 70; // Avoid extreme poles
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
        <div className="w-full h-[400px] bg-[#050a14] rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl">
            {/* Map Container */}
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 100,
                }}
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#0f172a"
                                stroke="#1e293b"
                                strokeWidth={0.5}
                                style={{
                                    default: { fill: "#0f172a", outline: "none" },
                                    hover: { fill: "#1e293b", outline: "none" },
                                    pressed: { fill: "#1e293b", outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Render Pings */}
                {pings.map((ping) => (
                    <Marker key={ping.id} coordinates={ping.coordinates}>
                        <g>
                            {/* Ripple Effect */}
                            <motion.circle
                                r={4}
                                fill="none"
                                stroke={ping.isSafe ? "#00ff9d" : "#ef4444"}
                                strokeWidth={2}
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 4, opacity: 0 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            />

                            {/* Core Dot */}
                            <circle
                                r={2}
                                fill={ping.isSafe ? "#00ff9d" : "#ef4444"}
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
        </div>
    );
};
