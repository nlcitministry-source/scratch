
import React from 'react';
import { motion } from 'framer-motion';

export const Tree = ({ x, y, scale = 1 }) => (
    <motion.g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        initial={{ scale: 0 }}
        animate={{ scale: scale }}
    >
        {/* Shadow */}
        <ellipse cx="0" cy="5" rx="15" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Trunk */}
        <path d="M-4,0 L4,0 L6,-30 L-6,-30 Z" fill="#5D4037" />

        {/* Leaves - Swaying Animation */}
        <motion.g
            animate={{ rotate: [2, -2, 2] }}
            transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "0px", originY: "-30px" }}
        >
            <path d="M0,-60 L-25,-20 L25,-20 Z" fill="#388E3C" />
            <path d="M0,-50 L-20,-15 L20,-15 Z" fill="#4CAF50" transform="translate(0, -10)" />
            <path d="M0,-40 L-15,-10 L15,-10 Z" fill="#81C784" transform="translate(0, -20)" />
        </motion.g>
    </motion.g>
);

export const Rock = ({ x, y, scale = 1 }) => (
    <motion.g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        {/* Shadow */}
        <ellipse cx="5" cy="5" rx="12" ry="4" fill="rgba(0,0,0,0.2)" />

        {/* Main Rock */}
        <path d="M-10,0 L-5,-10 L5,-12 L12,-5 L10,5 L-8,5 Z" fill="#9E9E9E" />
        <path d="M-5,-10 L0,-11 L5,-5 L-4,0 Z" fill="#BDBDBD" />
        <path d="M5,-12 L8,-8 L12,-5 L5,-5 Z" fill="#757575" />
    </motion.g>
);

export const Sign = ({ x, y, label, scale = 1 }) => (
    <motion.g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        initial={{ y: y - 50, opacity: 0 }}
        animate={{ y: y, opacity: 1 }}
    >
        {/* Post */}
        <rect x="-2" y="-5" width="4" height="25" fill="#5D4037" />

        {/* Board */}
        <g transform="translate(0, -15)">
            <rect x="-20" y="-10" width="40" height="20" rx="2" fill="#8D6E63" stroke="#5D4037" strokeWidth="1" />
            {/* Grain details */}
            <path d="M-15,-5 L-5,-5 M5,2 L15,2" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />

            {/* Text Overlay (HTML inside ForeignObject for easier text handling or just SVG text) */}
            <text x="0" y="4" textAnchor="middle" fontSize="6" fill="#3E2723" fontFamily="sans-serif" fontWeight="bold">
                {label}
            </text>
        </g>
    </motion.g>
);

export const GraveyardZone = () => (
    <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '40%', height: '40%',
        pointerEvents: 'none', zIndex: 0
    }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Radial Gradient Definition */}
            <defs>
                <radialGradient id="graveGradient" cx="0" cy="0" r="1">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
                    <stop offset="60%" stopColor="rgba(0,0,0,0.1)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
            </defs>
            {/* The Zone Highlight */}
            <path d="M0,0 L0,100 A100,100 0 0,0 100,0 Z" fill="url(#graveGradient)" transform="scale(0.8)" />
        </svg>
    </div>
);

export const GrassTuft = ({ x, y, scale = 1 }) => (
    <motion.g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        initial={{ scale: 0 }}
        animate={{ scale: scale }}
    >
        <motion.path
            d="M0,0 Q-2,-10 -5,-8 M0,0 Q2,-12 5,-10 M0,0 Q0,-8 1,-15"
            stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: [2, -2, 2] }}
            transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
        />
    </motion.g>
);
