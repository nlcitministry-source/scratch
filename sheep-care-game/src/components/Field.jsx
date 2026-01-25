
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';
import { BackgroundSVG } from './BackgroundSVG';
import { Rock, Sign, GraveyardZone, GrassTuft } from './Decorations';

// --- SVG Weather Components (Foreground) ---
// --- SVG Weather Components (Foreground) ---
const FG_RAIN_CONFIG = {
    storm: { drift: 8, count: 60, mobileCount: 30, strokeWidth: 1.5, durationMin: 1.0, durationRange: 0.5, lengthMin: 1.5, lengthRange: 1.5 },
    rain: { drift: 3, count: 80, mobileCount: 40, strokeWidth: 1, durationMin: 1.5, durationRange: 1.0, lengthMin: 0.2, lengthRange: 0.3 }
};

const ForegroundRain = React.memo(({ isStorm, isMobile }) => {
    const cfg = isStorm ? FG_RAIN_CONFIG.storm : FG_RAIN_CONFIG.rain;
    const fallHeight = 120; // %
    const activeCount = isMobile ? cfg.mobileCount : cfg.count;

    const drops = useMemo(() => [...Array(activeCount)].map((_, i) => ({
        id: i,
        startX: Math.random() * (100 + cfg.drift) - 5,
        delay: Math.random() * 2,
        duration: cfg.durationMin + Math.random() * cfg.durationRange,
        length: cfg.lengthMin + Math.random() * cfg.lengthRange
    })), [cfg, activeCount]);

    return (
        <g>
            {drops.map(d => {
                const slant = d.length * (cfg.drift / fallHeight);
                return (
                    <motion.line
                        key={`rain-fg-${d.id}`}
                        x1={`${d.startX}%`} y1="-10%"
                        x2={`${d.startX - slant}%`} y2={`${-10 + d.length}%`}
                        stroke={isStorm ? "#90A4AE" : "#E1F5FE"}
                        strokeWidth={cfg.strokeWidth}
                        strokeOpacity="0.5"
                        strokeLinecap="round"
                        animate={{
                            y1: ["-10%", "110%"],
                            y2: [`${-10 + d.length}%`, `${110 + d.length}%`],
                            x1: [`${d.startX}%`, `${d.startX - cfg.drift}%`],
                            x2: [`${d.startX - slant}%`, `${d.startX - cfg.drift - slant}%`]
                        }}
                        transition={{
                            duration: d.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: d.delay
                        }}
                    />
                );
            })}
        </g>
    );
});

const ForegroundSnow = React.memo(() => {
    const drops = useMemo(() => [...Array(40)].map((_, i) => ({
        id: i,
        startX: Math.random() * 100,
        r: Math.random() * 3 + 2,
        duration: 10 + Math.random() * 10, // Very slow float
        delay: Math.random() * 5,
        sway: 5 + Math.random() * 10 // % units
    })), []);

    return (
        <g>
            {drops.map(d => (
                <motion.circle
                    key={`snow-fg-${d.id}`}
                    cx={`${d.startX}%`} cy={-10}
                    r={d.r}
                    fill="white"
                    fillOpacity="0.8"
                    animate={{
                        cy: ["-10%", "110%"],
                        cx: [`${d.startX}%`, `${d.startX - d.sway}%`, `${d.startX + d.sway}%`, `${d.startX}%`]
                    }}
                    transition={{
                        duration: d.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: d.delay
                    }}
                />
            ))}
        </g>
    );
});

export const Field = ({ onSelectSheep }) => {
    const { sheep, prayForSheep, message, weather, settings } = useGame();

    // --- 1. Grave Limit & Mobile Logic ---
    const [graveLimit, setGraveLimit] = useState(10);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const mobile = window.innerWidth < 768;
                setGraveLimit(mobile ? 6 : 10);
                setIsMobile(mobile);
            }, 200);
        };

        // Initial check
        const initialMobile = window.innerWidth < 768;
        setGraveLimit(initialMobile ? 6 : 10);
        setIsMobile(initialMobile);

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    // --- 2. Separate Sheep ---
    const livingSheep = useMemo(() => sheep.filter(s => s.status !== 'dead'), [sheep]);
    const deadSheep = useMemo(() => sheep.filter(s => s.status === 'dead'), [sheep]);

    // --- 3. Living Sheep Rotation (Existing Logic) ---
    const [visibleLivingIds, setVisibleLivingIds] = useState(new Set());

    useEffect(() => {
        const updateVisible = () => {
            if (!livingSheep || livingSheep.length === 0) return;
            const max = settings?.maxVisibleSheep || 15;

            if (livingSheep.length <= max) {
                setVisibleLivingIds(new Set(livingSheep.map(s => s.id)));
                return;
            }

            // Fisher-Yates Shuffle
            const allIds = livingSheep.map(s => s.id);
            for (let i = allIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
            }
            setVisibleLivingIds(new Set(allIds.slice(0, max)));
        };

        updateVisible();
        const interval = setInterval(updateVisible, 60000); // 60s Rotation
        return () => clearInterval(interval);
    }, [settings?.maxVisibleSheep, livingSheep.length]); // Re-run if limit or count changes

    // Combined Visible Living Sheep
    const visibleLiving = useMemo(() => {
        if (!settings) return livingSheep;
        if (livingSheep.length <= (settings.maxVisibleSheep || 15)) return livingSheep;
        return livingSheep.filter(s => visibleLivingIds.has(s.id));
    }, [livingSheep, visibleLivingIds, settings]);

    // --- 4. Fence Data (Centralized for alignment) ---
    // --- 4. Fence Data (Centralized for alignment) ---
    // Dynamic Fence Scaling for Mobile (User Request: Prevent Deformation)
    const [fenceXScale, setFenceXScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const aspect = window.innerWidth / window.innerHeight;
            // Desktop (aspect > 1): Scale 1 (Circle R=33)
            // Mobile (aspect ~0.5): Scale 1.8 (Ellipse R=60)
            // Linear interpolation or simple threshold
            const newScale = Math.max(1, 1.8 - (aspect * 0.8));
            setFenceXScale(Math.min(2.0, newScale));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fencePoints = useMemo(() => {
        const R = 33;
        const points = [];
        for (let theta = 0; theta <= Math.PI / 2; theta += 0.12) {
            points.push({
                theta,
                x: (R * fenceXScale) * Math.sin(theta), // Scale X Only
                y: 100 - R * Math.cos(theta),
                isGap: (theta > 0.72 && theta < 0.85)
            });
        }
        return points;
    }, [fenceXScale]);

    // --- 5. Dead Sheep Placement (Distributed in Top-Left Graveyard) ---
    const GRAVE_SLOTS = useMemo(() => [
        { x: 5, y: 95 }, { x: 12, y: 92 }, { x: 4, y: 88 },
        { x: 15, y: 86 }, { x: 8, y: 84 }, { x: 20, y: 82 },
        { x: 6, y: 78 }, { x: 14, y: 78 }, { x: 22, y: 79 },
        { x: 2, y: 82 }, { x: 10, y: 90 }, { x: 18, y: 88 }
    ], []);

    const visibleDeadWithPos = useMemo(() => {
        const limitedDead = deadSheep.slice(0, graveLimit);
        return limitedDead.map((s, index) => {
            const slot = GRAVE_SLOTS[index % GRAVE_SLOTS.length];
            const idSum = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const jitterX = (idSum % 2) - 1;
            const jitterY = (idSum % 2) - 1;

            return {
                ...s,
                x: slot.x + jitterX,
                y: slot.y + jitterY,
                zIndex: 15 // Layer: Bottom (Graves)
            };
        });
    }, [deadSheep, graveLimit, GRAVE_SLOTS]);


    // --- 6. Decorations (Static) ---
    const decorations = useMemo(() => {
        const items = [];

        // Helper to check fence collision
        const isNearFence = (x, y) => {
            // Simple check: y > 60 is fence territory. 
            // Better: loop fence points
            for (let p of fencePoints) {
                const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
                if (dist < 8) return true; // 8% threshold
            }
            return false;
        };

        // Grass (Replaces Trees) - More abundant
        let attempts = 0;
        while (items.length < 20 && attempts < 100) {
            attempts++;
            const x = Math.random() * 90 + 5;
            const y = Math.random() * 90;
            if (isNearFence(x, y)) continue;

            items.push({
                id: `grass-${items.length}`, type: 'grass',
                x, y,
                scale: 0.8 + Math.random() * 0.4
            });
        }

        // Rocks
        attempts = 0;
        let rockCount = 0;
        while (rockCount < 5 && attempts < 50) {
            attempts++;
            const x = Math.random() * 90 + 5;
            const y = Math.random() * 90;
            if (isNearFence(x, y)) continue;

            items.push({
                id: `rock-${rockCount}`, type: 'rock',
                x, y,
                scale: 0.8 + Math.random() * 0.4
            });
            rockCount++;
        }

        // Use Pre-calculated Fence Points for POSTS only
        for (let i = 0; i < fencePoints.length; i++) {
            const p = fencePoints[i];
            if (!p.isGap) {
                items.push({
                    id: `fence-post-${i}`, type: 'fence-post',
                    x: p.x, y: p.y, scale: 1
                });
            }
        }

        // Signboard - REPOSITIONED TO FENCE ENTRANCE (Doorplate Style)
        items.push({
            id: 'grave-sign', type: 'sign',
            x: 21, y: 75, scale: 2.2, hasLabel: true, label: '安息之地'
        });
        return items.sort((a, b) => b.y - a.y);
    }, [fencePoints]);

    return (
        <div className={`field-container ${weather?.type || 'sunny'} ${weather?.isDay ? 'day' : 'night'}`}
            style={{ background: 'transparent', position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}
        >
            {/* Dynamic Background SVG - zIndex 0 - Aligned to Top */}
            <BackgroundSVG isDay={weather?.isDay} weatherType={weather?.type} isMobile={isMobile} />

            {/* Grass Ground - Bottom 70% Only - zIndex 1 */}
            <div className="grass" style={{
                position: 'absolute', bottom: 0, left: 0,
                width: '100%', height: '70%',
                zIndex: 1,
                overflow: 'visible'
            }}>
                {/* --- Shared Definitions --- */}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <filter id="rail-shadow">
                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
                        </filter>
                        <filter id="post-shadow" x="-50%" y="-20%" width="200%" height="200%">
                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.4" />
                        </filter>
                    </defs>
                </svg>

                {/* Graveyard Zone Highlight (SVG) */}
                <GraveyardZone />

                {/* --- Fence Rails SVG Layer --- */}
                <svg style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 20, pointerEvents: 'none', overflow: 'visible' // Layer: Middle (Fence Rails)
                }}>
                    <g filter="url(#rail-shadow)">
                        {fencePoints.map((p, i) => {
                            if (i >= fencePoints.length - 1) return null;
                            const nextP = fencePoints[i + 1];
                            if (p.isGap || nextP.isGap) return null;

                            const y1 = 95 - 0.9 * p.y;
                            const y2 = 95 - 0.9 * nextP.y;

                            return (
                                <g key={i}>
                                    <line x1={`${p.x}%`} y1={`${y1 - 2}%`} x2={`${nextP.x}%`} y2={`${y2 - 2}%`} stroke="#4a3b32" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                    <line x1={`${p.x}%`} y1={`${y1 - 5}%`} x2={`${nextP.x}%`} y2={`${y2 - 5}%`} stroke="#5d4037" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Decorations (Posts, Grass, Rocks, Signs) */}
                {decorations.map(d => {
                    const bottomPos = 5 + d.y * 0.9;
                    // Fix Perspective Scale: Far (y=0) = Small, Near (y=100) = Large
                    // We assume y=100 is "Top/Far" based on how bottomPos is calculated? 
                    // Wait, bottomPos = 5 + y*0.9.
                    // If y=100 -> bottom=95% (Top of Screen).
                    // So y=100 IS Top/Far.
                    // So Scale should mean SMALLER as y gets bigger.
                    const baseScale = 1.1 - (d.y / 200);
                    const finalScale = baseScale * (d.scale || 1);

                    // Fix Z-Index Layers
                    let zIdx = Math.floor(1000 - d.y);
                    if (d.type === 'fence-post') zIdx = 25; // Layer: Middle (Fence Posts)
                    if (d.type === 'sign') zIdx = 30; // Layer: Top (Signs)

                    if (d.type === 'fence-post') {
                        return (
                            <div key={d.id} style={{
                                position: 'absolute',
                                left: `${d.x}%`, bottom: `${bottomPos}%`,
                                zIndex: zIdx,
                                transform: `translate(-50%, 10%) scale(${finalScale})`, // Anchor bottom center
                                width: '10px', height: '40px',
                                pointerEvents: 'none'
                            }}>
                                <svg viewBox="0 0 10 40" style={{ overflow: 'visible' }}>
                                    <g filter="url(#post-shadow)">
                                        <rect x="3" y="0" width="4" height="40" fill="#4a3b32" rx="1" />
                                        <path d="M5,-5 L2,0 L8,0 Z" fill="#4a3b32" />
                                        <circle cx="5" cy="0" r="1.5" fill="#4a3b32" />
                                    </g>
                                </svg>
                            </div>
                        );
                    }

                    if (d.type === 'grass') {
                        return (
                            <div key={d.id} style={{ position: 'absolute', left: `${d.x}%`, bottom: `${bottomPos}%`, zIndex: zIdx, pointerEvents: 'none', width: 0, height: 0, overflow: 'visible' }}>
                                <svg width="1" height="1" style={{ overflow: 'visible' }}>
                                    <GrassTuft x={0} y={0} scale={finalScale * 2} />
                                </svg>
                            </div>
                        );
                    }
                    if (d.type === 'rock') {
                        return (
                            <div key={d.id} style={{ position: 'absolute', left: `${d.x}%`, bottom: `${bottomPos}%`, zIndex: zIdx, pointerEvents: 'none', width: 0, height: 0, overflow: 'visible' }}>
                                <svg width="1" height="1" style={{ overflow: 'visible' }}>
                                    <Rock x={0} y={0} scale={finalScale * 2} />
                                </svg>
                            </div>
                        );
                    }
                    if (d.type === 'sign') {
                        return (
                            <div key={d.id} style={{ position: 'absolute', left: `${d.x}%`, bottom: `${bottomPos}%`, zIndex: zIdx, pointerEvents: 'none', width: 0, height: 0, overflow: 'visible' }}>
                                <svg width="1" height="1" style={{ overflow: 'visible' }}>
                                    <Sign x={0} y={0} label={d.label} scale={finalScale * 1.5} />
                                </svg>
                            </div>
                        );
                    }

                    return null;
                })}

                {/* Living Sheep */}
                {visibleLiving.map(s => (
                    <Sheep key={s.id} sheep={s} onPray={prayForSheep} onSelect={onSelectSheep} />
                ))}

                {/* Dead Sheep (Graves) */}
                {visibleDeadWithPos.map(s => (
                    <Sheep key={s.id} sheep={s} onPray={prayForSheep} onSelect={onSelectSheep} />
                ))}

                {/* Count Overlay */}
                {sheep.length > (visibleLiving.length + visibleDeadWithPos.length) && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.5)', color: 'white',
                        padding: '4px 8px', borderRadius: '10px',
                        fontSize: '0.8rem', pointerEvents: 'none', zIndex: 10
                    }}>
                        👁️ 顯示: {visibleLiving.length + visibleDeadWithPos.length} / {sheep.length}
                    </div>
                )}

                {sheep.length === 0 && (
                    <div className="empty-state">
                        牧場靜悄悄的...<br />(快來認領新增小羊!)
                    </div>
                )}
            </div>

            {/* Weather Overlay (SVG based) */}
            {(weather?.type === 'rain' || weather?.type === 'storm' || weather?.type === 'snow') && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
                    <svg width="100%" height="100%" style={{ overflow: 'hidden' }}>
                        {(weather.type === 'rain' || weather.type === 'storm') && (
                            <ForegroundRain
                                key={`rain-${weather.type}`} // FORCE REMOUNT on switch
                                isStorm={weather.type === 'storm'}
                                isMobile={isMobile}
                            />
                        )}
                        {weather.type === 'snow' && <ForegroundSnow />}
                    </svg>
                </div>
            )}
        </div>
    );
};
