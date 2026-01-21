
import React from 'react';
import './SheepVisual.css';

export const SheepVisual = ({
    x, y, state, direction,
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
    const isMoving = state === 'move';
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

        // If dark (< 130), return light pattern; else dark pattern
        return brightness < 130 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
    };

    // Dynamic Sizing
    let transformString = `scale(${scale}) scaleX(${direction})`;
    // Note: If centered (relative), we don't need translate(-50%, -50%) because Flexbox handles position.
    // We just need to ensure origin is center for scaling.

    const containerStyle = {
        position: centered ? 'relative' : 'absolute',
        left: centered ? 'auto' : `${x}%`,
        top: centered ? 'auto' : `${y}%`,
        transform: transformString,
        transformOrigin: 'center center', // Ensure scaling happens from center
        zIndex: Math.floor(y), // Depth sorting
        '--sheep-color': color,
        '--pattern-color': getContrastPatternColor(color)
    };

    // Icons
    let StatusIcon = null;
    if (status === 'sick') StatusIcon = <div className="icon-sick">🤢</div>;
    else if (status === 'hungry') StatusIcon = <div className="icon-hungry">🍖</div>;
    else if (status === 'injured') StatusIcon = <div className="icon-injured">🤕</div>;
    else if (isDead) StatusIcon = <div className="icon-dead">🪦</div>;
    else if (state === 'eating') StatusIcon = <div className="icon-eating">🥬</div>;

    const isHuman = type === 'GLORY';
    const eyeClass = isDead ? 'eye-dead' : (status === 'sick' ? 'eye-sick' : 'eye-normal');

    const skinData = visual.skinData;
    const patternClass = pattern !== 'none' ? `pattern-${pattern}` : '';

    if (isDead) {
        return (
            <div className={`sheep-visual-container ${animClass} ${statusClass} stage-${healthStage}`} style={containerStyle}>
                <div className="sheep-grave">🪦</div>
            </div>
        );
    }

    // Custom Image Skin Rendering
    if (skinData && skinData.type === 'image' && skinData.data?.url) {
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
                    <div className={`sheep-body-group ${patternClass}`}>
                        <div className="sheep-body"></div>
                        <div className="sheep-head"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`sheep-visual-container ${animClass} ${statusClass} ${typeClass} stage-${healthStage}`} style={containerStyle}>

            {/* Status Float Icon */}
            {StatusIcon && <div className="status-icon-float">{StatusIcon}</div>}

            <div className={`sheep-body-group ${patternClass}`}>
                {isHuman ? (
                    // --- HUMAN SHAPE ---
                    <div className="human-structure">
                        <div className="human-body"></div>
                        <div className="human-head">
                            <div className="sheep-face">
                                <div className="sheep-eyes">
                                    <div className={eyeClass}></div>
                                    <div className={eyeClass}></div>
                                </div>
                            </div>
                            {/* Human Accessories might need adjustment, keeping basic for now */}
                            {accessory === 'tie_red' && <div className="acc-tie acc-tie-red" style={{ bottom: '-2px', left: '6px' }}></div>}
                            {accessory === 'tie_blue' && <div className="acc-tie acc-tie-blue" style={{ bottom: '-2px', left: '6px' }}></div>}
                        </div>
                        <div className="human-arm arm-l"></div>
                        <div className="human-arm arm-r"></div>
                        <div className="human-leg leg-l"></div>
                        <div className="human-leg leg-r"></div>
                        {/* Halo for 'Glory' aspect */}
                        <div className="human-halo"></div>
                    </div>
                ) : (
                    // --- SHEEP SHAPE (Standard) ---
                    <>
                        <div className="sheep-leg leg-fl"></div>
                        <div className="sheep-leg leg-fr"></div>
                        <div className="sheep-leg leg-bl"></div>
                        <div className="sheep-leg leg-br"></div>
                        <div className="sheep-body"></div>

                        <div className="sheep-head-group">
                            <div className="sheep-ear ear-left"></div>
                            <div className="sheep-ear ear-right"></div>

                            <div className="sheep-head">
                                <div className="sheep-face">
                                    <div className="sheep-eyes">
                                        <div className={`eye ${eyeClass}`}></div>
                                        <div className={`eye ${eyeClass}`}></div>
                                    </div>
                                </div>
                                {/* Accessories */}
                                {accessory === 'tie_red' && <div className="acc-tie acc-tie-red"></div>}
                                {accessory === 'tie_blue' && <div className="acc-tie acc-tie-blue"></div>}
                                {accessory === 'flower' && <div className="acc-flower">🌸</div>}
                                {accessory === 'scarf_green' && <div className="acc-scarf"></div>}
                            </div>
                            {/* Horns for Strong Sheep */}
                            {type === 'STRONG' && (
                                <>
                                    <div className="ram-horn horn-left"></div>
                                    <div className="ram-horn horn-right"></div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
