
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';
import { BackgroundSVG } from './BackgroundSVG';
import { Rock, Sign, GraveyardZone, GrassTuft } from './Decorations';

// --- SVG Weather Components (Foreground) ---
const ForegroundRain = React.memo(() => {
    // Generate drops ONCE on mount
    const drops = useMemo(() => [...Array(80)].map((_, i) => ({
        id: i,
        startX: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3.0 + Math.random() * 3.0 // Slow float (3-6s)
    })), []);

    return (
        <g>
            {drops.map(d => (
                <motion.circle
                    key={`rain-fg-${d.id}`}
                    cx={`${d.startX}%`} cy={-10}
                    r={2}
                    fill="#E1F5FE" fillOpacity="0.6"
                    animate={{ cy: ['-10%', '110%'], cx: [`${d.startX}%`, `${d.startX - 5}%`] }}
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

const ForegroundSnow = React.memo(() => {
    const drops = useMemo(() => [...Array(40)].map((_, i) => ({
        id: i,
        cx: Math.random() * 100,
        r: Math.random() * 3 + 2,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 5
    })), []);

    return (
        <g>
            {drops.map(d => (
                <motion.circle
                    key={`snow-fg-${d.id}`}
                    cx={`${d.cx}%`} cy={-10}
                    r={d.r}
                    fill="white"
                    animate={{
                        cy: ["-5%", "110%"],
                        cx: [`${d.cx}%`, `${d.cx - 10}%`, `${d.cx + 5}%`, `${d.cx - 5}%`] // Meander
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

    // --- 1. Grave Limit Logic (Mobile vs Desktop) ---
    const [graveLimit, setGraveLimit] = useState(10);
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setGraveLimit(window.innerWidth < 768 ? 6 : 10);
            }, 200); // Debounce 200ms
        };

        // Initial check without delay
        setGraveLimit(window.innerWidth < 768 ? 6 : 10);

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
    const fencePoints = useMemo(() => {
        const R = 33;
        const points = [];
        for (let theta = 0; theta <= Math.PI / 2; theta += 0.12) {
            points.push({
                theta,
                x: R * Math.sin(theta),
                y: 100 - R * Math.cos(theta),
                isGap: (theta > 0.72 && theta < 0.85)
            });
        }
        return points;
    }, []);

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
                zIndex: Math.floor(1000 - slot.y) // Correct Z for Graves
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
            style={{ background: 'transparent', position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
        >
            {/* Dynamic Background SVG - zIndex 0 - Aligned to Top */}
            <BackgroundSVG isDay={weather?.isDay} weatherType={weather?.type} />

            {/* Grass Ground - Bottom 70% Only - zIndex 1 */}
            <div className="grass" style={{
                position: 'absolute', bottom: 0, left: 0,
                width: '100%', height: '70%',
                zIndex: 1,
                overflow: 'visible'
            }}>

                {/* Graveyard Zone Highlight (SVG) */}
                <GraveyardZone />

                {/* --- Fence Rails SVG Layer --- */}
                <svg style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 5, pointerEvents: 'none', overflow: 'visible'
                }}>
                    <defs>
                        <filter id="rail-shadow">
                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
                        </filter>
                    </defs>
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

                    // Fix Z-Index: Far (y=100) = Low, Near (y=0) = High
                    const zIdx = Math.floor(1000 - d.y);

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
                                    <defs>
                                        <filter id="post-shadow" x="-50%" y="-20%" width="200%" height="200%">
                                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.4" />
                                        </filter>
                                    </defs>
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
                        {(weather.type === 'rain' || weather.type === 'storm') && <ForegroundRain />}
                        {weather.type === 'snow' && <ForegroundSnow />}
                    </svg>
                </div>
            )}
        </div>
    );
};
