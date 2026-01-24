import React from 'react';
import { motion } from 'framer-motion';

// --- Motion Variants ---
const bodyAnim = {
    idle: {
        scale: [1, 1.02, 1],
        y: [0, -1, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    dead: {
        scale: 1,
        y: 10,
        rotate: 0,
        transition: { duration: 0.5 }
    },
    sick: {
        scale: [1, 0.98, 1],
        rotate: [0, 1, 0, -1, 0],
        transition: { duration: 4, repeat: Infinity }
    },
    walk: {
        y: [0, -2, 0, -2, 0], // Doubled bob frequency (up on each step)
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
    },
    sit: {
        y: 15,
        scaleY: 0.9,
        transition: { duration: 0.5, ease: "backOut" }
    },
    sleep: {
        y: 12,
        scaleY: 0.85,
        transition: { duration: 1, ease: "easeInOut" }
    },
    walkBack: {
        y: [0, -2, 0, -2, 0],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
    }
};

// --- Optimized Gait Logic (The D-Path) ---
// Duration: 0.8s (Full Cycle)
// Swing: 45deg -> -45deg (Forward -> Back) = Stance Phase (Ground)
// Return: -45deg -> 45deg (Back -> Forward) = Swing Phase (Air)

const legAnimStanceFirst = {
    idle: { rotate: 0, y: 0, opacity: 1 },
    walk: {
        rotate: [-45, 45, -45], // PREF: Front Reach
        y: [0, 0, -8, 0],      // Ground -> Ground -> Lift -> Ground
        transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 0.75, 1]
        }
    },
    sit: { y: -5, rotate: 90, opacity: 0, transition: { duration: 0.3 } },
    sleep: { opacity: 0, transition: { duration: 0.5 } },
    walkBack: {
        rotate: [45, -45, 45],
        y: [0, 0, -8, 0],
        transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 0.75, 1]
        }
    }
};

const legAnimSwingFirst = {
    idle: { rotate: 0, y: 0, opacity: 1 },
    walk: {
        rotate: [45, -45, 45], // PREF: Back Kick
        y: [0, -8, 0, 0],      // Ground -> Lift -> Ground -> Ground
        transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.25, 0.5, 1]
        }
    },
    sit: { y: -5, rotate: 90, opacity: 0, transition: { duration: 0.3 } },
    sleep: { opacity: 0, transition: { duration: 0.5 } },
    walkBack: {
        rotate: [-45, 45, -45],
        y: [0, -8, 0, 0],
        transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.25, 0.5, 1]
        }
    }
};

const headAnim = {
    idle: {
        y: [0, 2, 0],
        rotate: [0, 2, 0, -2, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    dead: { y: 2, rotate: 15 },
    sick: { y: 5, rotate: 10 },
    walk: {
        y: [0, 2, 0], // Head bob
        rotate: [0, 5, 0, -5, 0], // Larger sway
        transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
    },
    walkBack: {
        y: [0, 2, 0], // Head bob
        rotate: [0, 5, 0, -5, 0], // Larger sway
        transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
    },
    sit: {
        y: 5,
        rotate: [0, 1, 0, -1, 0],
        transition: { duration: 4, repeat: Infinity }
    },
    sleep: {
        y: 10,
        rotate: 8,
        transition: { duration: 1 }
    }
};

const zzzAnim = {
    hidden: { opacity: 0, y: 0, scale: 0.5 },
    visible: {
        opacity: [0, 1, 0],
        y: -15, // Reduced height, No X drift
        scale: 1,
        transition: { duration: 2, repeat: Infinity, ease: "easeOut" }
    }
};

export const SheepSVG = ({
    color = '#ffffff',
    patternColor = 'rgba(0,0,0,0.1)',
    faceColor = '#ffccaa',
    isDead = false,
    isSick = false,
    isSleeping = false,
    isMoving = false,
    isReversing = false,
    direction = 1,
    scale = 1,
    duration = 1,
    accessory = 'none',
    pattern = 'none',
    onClick
}) => {
    // --- Derived State for Animation ---
    const stateKey = isDead ? 'dead' : (isSleeping ? 'sleep' : (isSick ? 'sick' : (isMoving ? (isReversing ? 'walkBack' : 'walk') : 'idle')));

    // --- Assets ---
    const legPath = "M-3,0 L3,0 L2,12 L-2,12 Z"; // Tapered leg

    let currentEye = <circle r="2.5" fill="#333" />;
    if (isDead) {
        currentEye = <path d="M-3,-3 L3,3 M-3,3 L3,-3" stroke="#333" strokeWidth="1.5" />; // X Eyes
    } else if (isSick) {
        currentEye = <circle r="2.5" fill="#333" opacity="0.5" />; // Dim/Glassy eyes
    } else if (isSleeping) {
        currentEye = <path d="M-3,1 Q0,3 3,1" stroke="#333" strokeWidth="1.5" fill="none" />; // Closed U
    }

    // --- Pattern Helper ---
    const renderPattern = () => {
        if (!pattern || pattern === 'none') return null;

        if (pattern === 'dots') {
            return (
                <g fill={patternColor} opacity="0.6">
                    <circle cx="30" cy="35" r="3" />
                    <circle cx="45" cy="25" r="3" />
                    <circle cx="60" cy="30" r="3" />
                    <circle cx="75" cy="45" r="3" />
                    <circle cx="50" cy="50" r="3" />
                    <circle cx="25" cy="45" r="3" />
                </g>
            );
        }
        if (pattern === 'stripes') {
            return (
                <g stroke={patternColor} strokeWidth="3" opacity="0.5" strokeLinecap="round">
                    <path d="M30,30 L30,50" />
                    <path d="M40,25 L40,50" />
                    <path d="M50,20 L50,55" />
                    <path d="M60,25 L60,50" />
                    <path d="M70,30 L70,45" />
                </g>
            );
        }
        return null;
    };

    // --- Accessories Helper ---
    const renderAccessory = (type) => {
        // Adjust coordinates based on where it's rendered (Head vs Body space)

        switch (accessory) {
            case 'tie_red':
                if (type !== 'body') return null;
                return (
                    <g transform="translate(68, 52) rotate(10)">
                        <path d="M0,0 L-5,-3 L-5,3 Z" fill="#D32F2F" />
                        <path d="M0,0 L5,-3 L5,3 Z" fill="#D32F2F" />
                        <circle cx="0" cy="0" r="1.5" fill="#B71C1C" />
                    </g>
                );
            case 'tie_blue':
                if (type !== 'body') return null;
                return (
                    <g transform="translate(68, 52) rotate(10)">
                        <path d="M0,0 L-5,-3 L-5,3 Z" fill="#1976D2" />
                        <path d="M0,0 L5,-3 L5,3 Z" fill="#1976D2" />
                        <circle cx="0" cy="0" r="1.5" fill="#0D47A1" />
                    </g>
                );
            case 'scarf_green':
                if (type !== 'body') return null;
                return (
                    <g transform="translate(66, 48)">
                        <path d="M-8,5 Q0,10 8,5 L8,9 Q0,14 -8,9 Z" fill="#388E3C" />
                        <path d="M6,5 L7,12 L10,11 L8,5 Z" fill="#2E7D32" />
                    </g>
                );
            case 'flower':
                if (type !== 'head') return null;
                return (
                    <g transform="translate(70, 20)">
                        <circle cx="0" cy="0" r="2.5" fill="#FFEB3B" />
                        <circle cx="0" cy="-3.5" r="2.5" fill="#F06292" stroke="none" />
                        <circle cx="3.5" cy="0" r="2.5" fill="#F06292" stroke="none" />
                        <circle cx="0" cy="3.5" r="2.5" fill="#F06292" stroke="none" />
                        <circle cx="-3.5" cy="0" r="2.5" fill="#F06292" stroke="none" />
                    </g>
                );
            case 'glasses':
                if (type !== 'head') return null;
                return (
                    <g transform="translate(75, 34)">
                        <circle cx="-9" cy="0" r="5" fill="rgba(255,255,255,0.3)" stroke="#333" strokeWidth="1" />
                        <circle cx="9" cy="0" r="5" fill="rgba(255,255,255,0.3)" stroke="#333" strokeWidth="1" />
                        <line x1="-4" y1="0" x2="4" y2="0" stroke="#333" strokeWidth="1" />
                    </g>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            style={{
                width: 100, height: 100,
                position: 'relative',
                cursor: onClick ? 'pointer' : 'default',
                transformOrigin: 'bottom center',
                filter: isDead ? 'grayscale(0.8) brightness(0.9)' : (isSick ? 'sepia(0.3) hue-rotate(-20deg)' : 'none')
            }}
            animate={stateKey}
            variants={bodyAnim}
            whileTap={!isDead ? { scale: 0.9, rotate: -3 } : {}}
            onClick={onClick}
        >
            <svg viewBox="0 0 100 80" style={{ overflow: 'visible' }}>
                {isDead ? (
                    // --- GRAVE VISUAL ---
                    <g transform="translate(50, 75)">
                        {/* Mound */}
                        <ellipse cx="0" cy="0" rx="25" ry="6" fill="#6d4c41" opacity="0.8" />
                        {/* Stone */}
                        <path
                            d="M-18,0 L-18,-35 Q-18,-50 0,-50 Q18,-50 18,-35 L18,0 Z"
                            fill="#bdbdbd"
                            stroke="#757575"
                            strokeWidth="2"
                        />
                        {/* Cross */}
                        <path d="M0,-38 L0,-20 M-8,-30 L8,-30" stroke="#757575" strokeWidth="3" opacity="0.6" />
                        <path d="M0,-38 L0,-20 M-8,-30 L8,-30" stroke="#555" strokeWidth="2" />
                        {/* R.I.P Text (Optional, maybe too small) */}
                    </g>
                ) : (
                    // --- LIVE SHEEP VISUAL ---
                    <>
                        {/* Legs (Behind) */}
                        <g transform="translate(34, 52)">
                            <motion.g variants={legAnimSwingFirst} style={{ originY: 0, originX: 0.5 }}>
                                <path d={legPath} fill="#444" />
                            </motion.g>
                        </g>
                        <g transform="translate(74, 52)">
                            <motion.g variants={legAnimStanceFirst} style={{ originY: 0, originX: 0.5 }}>
                                <path d={legPath} fill="#444" />
                            </motion.g>
                        </g>

                        {/* Body Fluff */}
                        <path
                            d="M25,55 Q15,55 15,45 Q15,35 25,30 Q30,15 50,15 Q70,15 75,30 Q85,35 85,45 Q85,55 75,55 Z"
                            fill={color}
                            filter="drop-shadow(0px 2px 0px rgba(0,0,0,0.1))"
                        />

                        {/* Extra Fluff Puffs */}
                        <circle cx="30" cy="25" r="12" fill={color} />
                        <circle cx="50" cy="20" r="15" fill={color} />
                        <circle cx="70" cy="25" r="12" fill={color} />
                        <circle cx="20" cy="40" r="10" fill={color} />
                        <circle cx="80" cy="40" r="10" fill={color} />

                        {renderPattern()}

                        {renderAccessory('body')}

                        {/* Head Group */}
                        <motion.g variants={headAnim} transformOrigin="65 40">
                            <ellipse cx="75" cy="35" rx="12" ry="10" fill={faceColor} />
                            <circle cx="75" cy="26" r="6" fill={color} />
                            <circle cx="68" cy="28" r="4" fill={color} />
                            <circle cx="82" cy="28" r="4" fill={color} />
                            <ellipse cx="62" cy="36" rx="6" ry="3" fill={faceColor} transform="rotate(-20, 62, 36)" />
                            <ellipse cx="88" cy="36" rx="6" ry="3" fill={faceColor} transform="rotate(20, 88, 36)" />
                            <g transform="translate(71, 34)">{currentEye}</g>
                            <g transform="translate(79, 34)">{currentEye}</g>
                            {!isSick && <path d="M73,40 Q75,42 77,40" stroke="#333" strokeWidth="1" fill="none" />}
                            {isSick && <path d="M73,41 Q75,39 77,41" stroke="#333" strokeWidth="1" fill="none" />}
                            {renderAccessory('head')}
                        </motion.g>

                        {/* Legs (Front) */}
                        <g transform="translate(26, 56)">
                            <motion.g variants={legAnimStanceFirst} style={{ originY: 0, originX: 0.5 }}>
                                <path d={legPath} fill="#444" />
                            </motion.g>
                        </g>
                        <g transform="translate(66, 56)">
                            <motion.g variants={legAnimSwingFirst} style={{ originY: 0, originX: 0.5 }}>
                                <path d={legPath} fill="#444" />
                            </motion.g>
                        </g>

                        {/* Zzz Animation for Sleeping */}
                        {isSleeping && (
                            <g transform={`translate(75, 20) scale(${direction}, 1)`}>
                                <motion.g
                                    initial="hidden"
                                    animate="visible"
                                    variants={zzzAnim}
                                >
                                    <text
                                        x="0" y="0"
                                        fill="#88aaee"
                                        textAnchor="middle"
                                        pointerEvents="none"
                                        style={{ font: 'bold 16px sans-serif', opacity: 0.8 }}
                                    >
                                        Zzz
                                    </text>
                                </motion.g>
                            </g>
                        )}
                    </>
                )}
            </svg>
        </motion.div >
    );
};
