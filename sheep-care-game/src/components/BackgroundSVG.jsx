
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets ---

const Sun = () => (
    <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    >
        <circle cx="0" cy="0" r="35" fill="#FFD700" />
        <circle cx="0" cy="0" r="35" fill="#FFA000" opacity="0.3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        {/* Rays */}
        {[...Array(12)].map((_, i) => (
            <line
                key={i}
                x1="0" y1="-40" x2="0" y2="-55"
                stroke="#FFD700" strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${i * 30})`}
            />
        ))}
    </motion.g>
);

const Moon = () => (
    <motion.g
        animate={{ rotate: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    >
        <circle cx="0" cy="0" r="30" fill="#F4F6F0" />
        <path
            d="M-30,-30 Q0,-30 15,-15 Q30,0 15,15 Q0,30 -30,30 Z"
            fill="transparent"
        />
        {/* Craters */}
        <circle cx="-10" cy="-5" r="5" fill="#E0E0E0" opacity="0.6" />
        <circle cx="5" cy="10" r="7" fill="#E0E0E0" opacity="0.6" />
        <circle cx="8" cy="-12" r="3" fill="#E0E0E0" opacity="0.6" />
    </motion.g>
);

const CloudDrifter = ({ y, scale = 1, duration = 40, color = "white", opacity = 0.8, delay = 0 }) => (
    <motion.g
        initial={{ x: -150 }}
        animate={{ x: 1150 }}
        transition={{ duration: duration, repeat: Infinity, ease: 'linear', delay: delay }}
        transform={`translate(0, ${y}) scale(${scale})`}
    >
        <path
            d="M0,0 Q10,-15 25,-10 Q35,-25 55,-15 Q70,-20 80,0 Q90,5 85,15 Q80,25 60,25 Q40,30 20,25 Q0,25 -5,15 Q-10,5 0,0 Z"
            fill={color}
            fillOpacity={opacity}
        />
    </motion.g>
);

const RainLines = React.memo(({ count = 30, color = "#a8d5e5" }) => {
    // Generate drops ONCE on mount
    const drops = useMemo(() => [...Array(count)].map((_, i) => ({
        id: i,
        startX: Math.random() * 1000,
        duration: 3.5 + Math.random() * 2.5, // Slow
        delay: Math.random() * 2
    })), [count]);

    return (
        <g opacity="0.5">
            {drops.map(d => (
                <motion.circle
                    key={`rain-${d.id}`}
                    cx={d.startX} cy={-20}
                    r={1.5}
                    fill={color}
                    animate={{ cy: [0, 700], cx: [d.startX, d.startX - 50] }} // Drift left more
                    transition={{ duration: d.duration, repeat: Infinity, ease: 'linear', delay: d.delay }}
                />
            ))}
        </g>
    );
});

const SnowFlakes = React.memo(({ count = 30 }) => {
    const flakes = useMemo(() => [...Array(count)].map((_, i) => ({
        id: i,
        startX: Math.random() * 1000,
        r: Math.random() * 2 + 1,
        duration: 6 + Math.random() * 4,
        delay: Math.random() * 5,
        drift: (Math.random() - 0.5) * 100
    })), [count]);

    return (
        <g opacity="0.6">
            {flakes.map(f => (
                <motion.circle
                    key={`snow-${f.id}`}
                    cx={f.startX} cy={-20}
                    r={f.r}
                    fill="white"
                    animate={{ cy: 700, cx: f.startX + f.drift }}
                    transition={{ duration: f.duration, repeat: Infinity, ease: 'linear', delay: f.delay }}
                />
            ))}
        </g>
    );
});

const Star = ({ x, y, delay, r }) => (
    <motion.g transform={`translate(${x}, ${y})`}>
        <motion.path
            d={`M0,-${r} L${r},0 L0,${r} L-${r},0 Z`}
            fill="#FFF"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, delay: delay, ease: "easeInOut" }}
        />
    </motion.g>
);

export const BackgroundSVG = ({ isDay = true, weatherType = 'sunny' }) => {

    // --- Star Generation (Stable) ---
    // --- Star Generation (Dynamic) ---
    const generateStars = () => {
        const timestamp = Date.now();
        return [...Array(30)].map((_, i) => ({
            id: `${timestamp}-${i}`, // Unique ID to force re-render/reset animation
            x: Math.random() * 1000,
            y: Math.random() * 250, // More spread
            r: Math.random() * 3 + 2,
            delay: Math.random() * 3
        }));
    };

    const [stars, setStars] = React.useState(generateStars());

    React.useEffect(() => {
        if (isDay) return; // Don't churn state during day

        // Change positions every 10 seconds (approx 3-4 flickers)
        const interval = setInterval(() => {
            setStars(generateStars());
        }, 10000);

        return () => clearInterval(interval);
    }, [isDay]);

    // --- Weather Config ---
    const config = useMemo(() => {
        let skyGradient = isDay ? ['#87CEEB', '#ffffff'] : ['#1a237e', '#4527a0'];
        let mountainColor = isDay ? "#81C784" : "#2E7D32";
        let cloudColor = "white";
        let cloudOpacity = 0.8;
        let cloudCount = 4;
        let precip = null;

        if (weatherType === 'rain') {
            skyGradient = isDay ? ['#546E7A', '#CFD8DC'] : ['#263238', '#37474F'];
            cloudColor = "#90A4AE";
            cloudOpacity = 0.9;
            cloudCount = 6;
            precip = 'rain';
        } else if (weatherType === 'storm') {
            skyGradient = isDay ? ['#37474F', '#455A64'] : ['#102027', '#263238'];
            cloudColor = "#546E7A";
            cloudOpacity = 1;
            cloudCount = 8;
            precip = 'storm';
        } else if (weatherType === 'snow') {
            skyGradient = isDay ? ['#B3E5FC', '#E1F5FE'] : ['#1A237E', '#3949AB'];
            cloudColor = "#E1F5FE";
            cloudCount = 5;
            precip = 'snow';
        }

        return { skyGradient, mountainColor, cloudColor, cloudOpacity, cloudCount, precip };
    }, [isDay, weatherType]);


    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh',
            zIndex: 0, overflow: 'hidden',
            background: `linear-gradient(to bottom, ${config.skyGradient[0]} 0%, ${config.skyGradient[1]} 100%)`,
            transition: 'background 2s ease'
        }}>
            <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMin slice" style={{ width: '100%', height: '100%' }}>

                {/* --- Celestial Bodies --- */}
                <AnimatePresence mode="wait">
                    {isDay && weatherType !== 'storm' && (
                        <motion.g
                            key="sun"
                            initial={{ y: 600, x: 200, opacity: 0 }}
                            animate={{ y: 80, x: 800, opacity: 1 }}
                            exit={{ y: 600, x: 1000, opacity: 0 }}
                            transition={{ duration: 1 }}
                            transform="translate(0, 0)"
                        >
                            {/* Adjusted: Fixed coordinates to center on the motion group (0,0) */}
                            <foreignObject x="-50" y="-50" width="100" height="100" style={{ overflow: 'visible' }}>
                                <svg width="100" height="100" viewBox="-50 -50 100 100"><Sun /></svg>
                            </foreignObject>
                        </motion.g>
                    )}
                    {!isDay && (
                        <motion.g
                            key="moon"
                            initial={{ y: 600, x: 800, opacity: 0 }}
                            animate={{ y: 60, x: 150, opacity: 1 }}
                            exit={{ y: 600, x: 0, opacity: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <foreignObject x="-50" y="-50" width="100" height="100" style={{ overflow: 'visible' }}>
                                <svg width="100" height="100" viewBox="-50 -50 100 100"><Moon /></svg>
                            </foreignObject>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* --- Stars --- */}
                {!isDay && weatherType !== 'rain' && weatherType !== 'storm' && stars.map(s => (
                    <Star key={s.id} x={s.x} y={s.y} r={s.r} delay={s.delay} />
                ))}

                {/* --- Clouds (Floating Lower) --- */}
                {config.cloudCount > 0 && [...Array(config.cloudCount)].map((_, i) => (
                    <CloudDrifter
                        key={`cloud-${i}`}
                        y={80 + Math.random() * 80} // Y: 80-160 (Lower, avoiding top edge)
                        scale={0.8 + Math.random() * 0.8}
                        duration={45 + Math.random() * 30}
                        delay={-Math.random() * 60}
                        color={config.cloudColor}
                        opacity={config.cloudOpacity}
                    />
                ))}

                {/* --- Background Precipitation --- */}
                {config.precip === 'rain' && <RainLines count={60} color="#B0BEC5" />}
                {config.precip === 'storm' && <RainLines count={100} color="#78909C" />}
                {config.precip === 'snow' && <SnowFlakes count={50} />}

                {/* --- Mountains (Back) - TALLER & VISIBLE VALLEYS --- */}
                <path
                    d="M0,600 L0,200 Q250,5 500,140 Q750,20 1000,120 L1000,600 Z"
                    fill={config.mountainColor}
                    opacity="1" /* Opaque */
                />

                {/* --- Mountains (Mid) - RAISED --- */}
                <path
                    d="M-50,600 L-50,300 Q300,150 650,280 T1050,300 L1050,600 Z"
                    fill={config.mountainColor}
                    filter="brightness(0.9)"
                    opacity="1" /* Opaque */
                />

                {/* --- Front Hills --- */}
                <path
                    d="M0,600 L0,350 Q250,400 500,320 Q750,280 1000,360 L1000,600 Z"
                    fill={isDay ? "#AED581" : "#558B2F"}
                    opacity="1" /* Opaque */
                />
            </svg>
        </div>
    );
};
