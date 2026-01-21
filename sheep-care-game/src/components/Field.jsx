
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Sheep } from './Sheep';


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

    // --- 4. Dead Sheep Placement (Distributed) ---
    // --- 4. Dead Sheep Placement (Distributed) ---
    // Pre-defined "Organic" Slots (STRICT Top-Left Zone)
    // Avoid Entrance approx at (23, 77). Keep Deep.
    // X between 2-15 (mostly), Y between 80-98.
    const GRAVE_SLOTS = useMemo(() => [
        { x: 2, y: 98 }, { x: 6, y: 96 }, { x: 10, y: 97 },
        { x: 14, y: 94 }, { x: 3, y: 92 }, { x: 8, y: 90 },
        { x: 12, y: 88 }, { x: 2, y: 86 }, { x: 6, y: 84 },
        { x: 5, y: 80 }
    ], []);

    const visibleDeadWithPos = useMemo(() => {
        // Limit count
        const limitedDead = deadSheep.slice(0, graveLimit);

        // Map to slots
        return limitedDead.map((s, index) => {
            const slot = GRAVE_SLOTS[index % GRAVE_SLOTS.length];
            // Add slight randomness (Jitter) so it's not perfectly rigid
            // Use sheep ID to make jitter deterministic (so they don't jump per frame)
            const idSum = s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const jitterX = (idSum % 5) - 2; // -2 to +2
            const jitterY = (idSum % 7) - 3; // -3 to +3

            return {
                ...s,
                x: slot.x + jitterX,
                y: slot.y + jitterY
            };
        });
    }, [deadSheep, graveLimit, GRAVE_SLOTS]);


    // --- 5. Decorations (Static) ---
    const decorations = useMemo(() => {
        const items = [];
        // Trees
        for (let i = 0; i < 8; i++) {
            items.push({
                id: `tree-${i}`, type: 'tree', emoji: '🌲',
                x: Math.random() * 90 + 5, y: Math.random() * 90
            });
        }
        // Rocks
        for (let i = 0; i < 5; i++) {
            items.push({
                id: `rock-${i}`, type: 'rock', emoji: '🪨',
                x: Math.random() * 90 + 5, y: Math.random() * 90
            });
        }
        // Graveyard Boundary (Fan Shape) - R=33
        const R = 33;
        for (let theta = 0; theta <= Math.PI / 2; theta += 0.06) {
            if (theta > 0.7 && theta < 0.9) continue; // Entrance gap
            items.push({
                id: `grave-wall-arc-${theta}`, type: 'rock', emoji: '🪨',
                x: R * Math.sin(theta) + (Math.random() * 0.5),
                y: 100 - R * Math.cos(theta) + (Math.random() * 0.5),
                scale: 0.9 + Math.random() * 0.3
            });
        }
        // Signboard
        items.push({
            id: 'grave-sign', type: 'sign', emoji: '🪧',
            x: 20, y: 60, scale: 3.5, hasLabel: true, label: '安息之地'
        });
        return items.sort((a, b) => b.y - a.y);
    }, []);

    return (
        <div className={`field-container ${weather?.type || 'sunny'} ${weather?.isDay ? 'day' : 'night'}`}>
            <div className="sky">
                {/* Extra Clouds */}
                <div className="cloud-extra c1"></div>
                <div className="cloud-extra c2"></div>
                {/* Sun */}
                {weather?.type === 'sunny' && weather?.isDay && <div className="sun"></div>}
                {/* Hills */}
                <div className="hill-range">
                    <div className="hill h-1"></div>
                    <div className="hill h-2"></div>
                    <div className="hill h-3"></div>
                </div>
            </div>

            <div className="grass">
                {/* Graveyard Zone Highlight */}
                <div style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '40%', height: '40%',
                    background: 'radial-gradient(circle at top left, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.2) 60%, transparent 70%)',
                    zIndex: 0, pointerEvents: 'none'
                }}></div>

                {/* Decorations */}
                {decorations.map(d => {
                    const bottomPos = 5 + d.y * 0.9;
                    const baseScale = 1.0 - (d.y / 200);
                    const finalScale = baseScale * (d.scale || 1);
                    const zIdx = Math.floor(1000 - d.y);
                    return (
                        <div key={d.id} className="decoration" style={{
                            left: `${d.x}%`, bottom: `${bottomPos}%`, zIndex: zIdx,
                            transform: `scale(${finalScale})`
                        }}>
                            {d.emoji}
                            {d.hasLabel && (
                                <div style={d.id === 'grave-sign' ? {
                                    position: 'absolute', top: '40%', left: '50%',
                                    transform: 'translate(-50%, -50%) scale(0.33)',
                                    color: '#4e342e', fontSize: '15px', fontWeight: 'bold',
                                    whiteSpace: 'nowrap', pointerEvents: 'none',
                                    fontFamily: '"Varela Round", sans-serif',
                                    width: '165%', textAlign: 'center', background: '#d7ccc8',
                                    borderRadius: '9px', padding: '3px 0', boxShadow: '0 0 3px rgba(0,0,0,0.1)'
                                } : {
                                    position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                                    background: '#5d4037', color: '#ffecb3', padding: '1px 5px', borderRadius: '3px',
                                    fontSize: '0.5rem', whiteSpace: 'nowrap', border: '1px solid #3e2723', fontWeight: 'bold',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)', width: 'auto'
                                }}>
                                    {d.label}
                                </div>
                            )}
                        </div>
                    );
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

            {/* Weather Overlay */}
            {(weather?.type === 'rain' || weather?.type === 'storm' || weather?.type === 'snow') && (
                <div className="weather-overlay">
                    {/* ... Same as before, simplified for brevity ... */}
                    {/* Re-implementing the inner memo for weather drops directly to ensure it works */}
                    {useMemo(() => {
                        const isRain = weather.type === 'rain' || weather.type === 'storm';
                        const count = 50;
                        const drops = [...Array(count)].map((_, i) => ({
                            id: i, left: `${Math.random() * 100}%`,
                            delay: `-${Math.random() * 10}s`,
                            duration: isRain ? `${2.5 + Math.random()}s` : `${15 + Math.random() * 5}s`
                        }));
                        return (
                            <div className={`weather-layer ${weather.type}`}>
                                {drops.map(drop => (
                                    <div key={drop.id} className={isRain ? 'rain-drop' : 'snow-drop'}
                                        style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
                                    >
                                        {isRain ? '' : '❄'}
                                    </div>
                                ))}
                            </div>
                        );
                    }, [weather?.type])}
                </div>
            )}
        </div>
    );
};
