
import { SheepSVG } from './SheepSVG';
import './SheepVisual.css';

export const SheepVisual = ({
    x, y, state, direction, isReversing,
    status, visual = {},
    health = 100,
    type = 'LAMB', // Default to LAMB
    scale = 1,
    isStatic = false,
    name = '',
    centered = false // New Prop for UI Centering
}) => {
    const isDead = status === 'dead';
    // Visual Props
    const { color = '#ffffff', accessory = 'none', pattern = 'none' } = visual || {};

    // State & Animation Classes
    const isMoving = state === 'walking';
    const animClass = isMoving ? 'anim-bounce' : 'anim-breathe';
    const statusClass = status !== 'healthy' ? `status-${status}` : '';
    const typeClass = type === 'GLORY' ? 'type-gold' : (type === 'HORNED' ? 'type-horned' : '');
    // Health Visuals
    let healthStage = 'normal';
    if (health > 80) healthStage = 'super';
    else if (health < 20) healthStage = 'critical'; // < 20
    else if (health < 40) healthStage = 'weak';     // 20-40

    // Helper: Calculate contrast pattern color
    const getContrastPatternColor = (hexColor) => {
        if (!hexColor || !hexColor.startsWith('#')) return 'rgba(0, 0, 0, 0.15)'; // Default dark

        // Simple brightness check
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // HSP Color Model formula for perceived brightness
        const brightness = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );

        return brightness < 130 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
    };

    // Dynamic Sizing
    let transformString = `scale(${scale}) scaleX(${direction || 1})`;

    // Note: If centered (relative), we don't need translate(-50%, -50%) because Flexbox handles position.
    // We just need to ensure origin is center for scaling.

    const containerStyle = {
        position: centered ? 'relative' : 'absolute',
        left: centered ? 'auto' : `${x}%`,
        top: centered ? 'auto' : `${y}%`,
        transform: `${transformString}`,
        transformOrigin: 'bottom center', // Ensure scaling happens from bottom
        zIndex: Math.floor(y || 0), // Depth sorting
        width: '100px', // Standardize SVG container
        height: '100px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end', // Align to bottom
        // pointerEvents: 'auto' // Default is auto, removing 'none' allows interaction
    };

    // Icons
    let StatusIcon = null;
    // Fallback for Injured (No SVG state yet)
    if (status === 'injured') StatusIcon = <div className="icon-injured">🤕</div>;

    const isHuman = type === 'GLORY';
    const skinData = visual.skinData;
    const patternClass = pattern !== 'none' ? `pattern-${pattern}` : '';

    // Custom Image Skin Rendering (Only if ALIVE)
    if (!isDead && skinData && skinData.type === 'image' && skinData.data?.url) {
        return (
            <div className={`sheep-visual-container ${animClass} ${statusClass} ${typeClass} stage-${healthStage}`} style={containerStyle}>
                {StatusIcon && <div className="status-icon-float">{StatusIcon}</div>}
                <img
                    src={skinData.data.url}
                    alt="sheep-skin"
                    className="sheep-skin-img"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} // Fallback
                />
                {/* Fallback CSS Body (Hidden by default unless error) */}
                <div style={{ display: 'none', width: '100%', height: '100%' }}>
                    <SheepSVG
                        color={color}
                        isSick={status === 'sick'}
                        isDead={false}
                    />
                </div>
            </div>
        );
    }

    // Default Render
    return (
        <div style={containerStyle}>
            {/* Status Float Icon - Only for non-SVG statuses (Injured) */}
            {StatusIcon && <div className="status-icon-float" style={{ position: 'absolute', top: 0, zIndex: 10 }}>{StatusIcon}</div>}

            {isHuman && !isDead ? (
                // --- HUMAN SHAPE (Legacy CSS for now) ---
                <div className={`sheep-visual-container ${animClass} ${statusClass} ${typeClass}`} style={{ position: 'static' }}>
                    <div className="human-structure">
                        <div className="human-body"></div>
                        <div className="human-head">
                            <div className="sheep-face">
                                <div className="sheep-eyes">
                                    <div className="eye-normal"></div>
                                    <div className="eye-normal"></div>
                                </div>
                            </div>
                        </div>
                        <div className="human-arm arm-l"></div>
                        <div className="human-arm arm-r"></div>
                        <div className="human-leg leg-l"></div>
                        <div className="human-leg leg-r"></div>
                        <div className="human-halo"></div>
                    </div>
                </div>
            ) : (
                // --- SVG SHEEP ---
                <SheepSVG
                    color={color}
                    patternColor={getContrastPatternColor(color)}
                    faceColor={visual.faceColor}
                    isSick={status === 'sick'}
                    isDead={status === 'dead'}
                    isMoving={state === 'walking'} // Mapped 'walking' state correctly? Check gameLogic. Yes, 'walking'. Old code said 'move'? Check gameLogic.
                    // Wait, gameLogic uses 'walking'. SheepVisual used 'move'. 
                    // Let's check SheepVisual line 20: const isMoving = state === 'move';
                    // The old code had inconsistent state names? 
                    // GameLogic uses 'walking'. SheepVisual checks 'move'.
                    // I should fix isMoving too.
                    direction={direction}
                    isSleeping={state === 'sleep'}
                    isReversing={isReversing}
                    accessory={accessory}
                    pattern={pattern}
                />
            )}
        </div>
    );
};
