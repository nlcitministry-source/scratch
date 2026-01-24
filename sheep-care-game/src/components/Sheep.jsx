import React from 'react';
import { SheepVisual } from './SheepVisual';
import { SHEEP_TYPES } from '../data/sheepData';

export const Sheep = React.memo(({ sheep, onPray, onSelect }) => {
    const isGolden = sheep.type === 'GOLDEN';
    const [showName, setShowName] = React.useState(false);

    // Map y (0-100) to bottom % (25% base to shift up, max ~95%)
    // Map y (0-100) to bottom % (0% base to allow full front access, max ~95%)
    const bottomPos = (sheep.y || 0) * 0.95;
    // Scale down as they go "back" (higher y) -> Wait, "back" is lower Y in screen coords? 
    // No, standard web coords: 0 is top, 100 is bottom.
    // In this game: "Top" of screen is "Far away". "Bottom" is "Close".
    // So Y=0 is Far, Y=100 is Close.
    // Scale should be SMALLER at Y=0, LARGER at Y=100.
    // The previous code: `1.0 - (y / 300)` means at y=0 scale=1, at y=100 scale=0.66.
    // THIS IS BACKWARDS TOO! Far objects should be smaller.
    // Fix Scale: 0.6 + (y / 200). (At 0 -> 0.6. At 100 -> 1.1)

    const depthScale = 1.1 - ((sheep.y || 0) / 200);
    const zIdx = Math.floor(1000 - (sheep.y || 0));

    const handleInteract = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Toggle name visibility
        setShowName(prev => {
            if (!prev) {
                // Determine auto-hide duration
                setTimeout(() => setShowName(false), 3000);
                return true;
            }
            return false; // Toggle off if clicked again
        });
    };

    return (
        <div
            className="sheep-wrapper"
            style={{
                left: `${sheep.x}%`,
                bottom: `${bottomPos}%`,
                position: 'absolute',
                width: '100px', // Explicit width for centering
                height: '100px',
                marginLeft: '-50px', // Center the wrapper on the x-coordinate
                transition: sheep.status === 'dead' ? 'none' : 'left 0.5s linear, bottom 0.5s linear',
                zIndex: zIdx,
                transform: `scale(${depthScale})`,
                transformOrigin: 'bottom center'
            }}
        >
            {/* Name Tag - Only Show when toggled */}
            {showName && (
                <div className="sheep-name-tag" style={{
                    position: 'absolute',
                    top: '0px', // Closer to head
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none' // Click through to sheep
                }}>
                    {sheep.name}
                    {isGolden && ' 🌟'}
                </div>
            )}

            {/* Speech Bubble (Emotional Blackmail) */}
            {sheep.message && (
                <div className="speech-bubble">
                    {sheep.message}
                </div>
            )}

            {/* Visual Container (Flippable) */}
            <div
                style={{
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                }}
                onClick={handleInteract}
            >
                <SheepVisual
                    type={sheep.type}
                    state={sheep.state}
                    status={sheep.status}
                    visual={sheep.visual}
                    health={sheep.health}
                    direction={sheep.direction}
                    isReversing={sheep.isReversing}
                    centered={true} // Fill wrapper relative
                />
            </div>

            {/* Actions (Non-Flipped) */}
            <div className="sheep-actions">
                {/* Health Bar Removed */}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom Comparison for Performance
    // Ignore micro-changes in health (decay) unless it changes the visual stage
    const prev = prevProps.sheep;
    const next = nextProps.sheep;

    if (prev.id !== next.id) return false;
    if (prev.x !== next.x) return false;
    if (prev.y !== next.y) return false;
    if (prev.status !== next.status) return false;
    if (prev.state !== next.state) return false;
    if (prev.direction !== next.direction) return false;
    if (prev.message !== next.message) return false;
    if (prev.type !== next.type) return false;
    if (prev.name !== next.name) return false;

    // Deep compare visual if needed
    if (prev.visual !== next.visual) {
        if (JSON.stringify(prev.visual) !== JSON.stringify(next.visual)) return false;
    }

    // Health Stage Logic (Match SheepVisual)
    const getStage = (h) => {
        if (h > 80) return 'super';
        if (h < 20) return 'critical';
        if (h < 40) return 'weak';
        return 'normal';
    };

    if (getStage(prev.health) !== getStage(next.health)) return false;

    return true; // Props are "equal" visually
});
