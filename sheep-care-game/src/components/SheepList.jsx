
import React from 'react';
import { useGame } from '../context/GameContext';
import { SheepVisual } from './SheepVisual';
import { getSheepMessage, getStableSheepMessage } from '../utils/gameLogic';

export const SheepList = ({ onSelect, onClose }) => {
    const { sheep } = useGame();

    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '360px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="editor-header">
                    <h3>📖 小羊圖鑑 ({sheep.length})</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                    {sortedSheep.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                            牧場還是空的...<br />快去新增小羊吧！
                        </div>
                    ) : (
                        sortedSheep.map(s => {
                            const isDead = s.status === 'dead';
                            const isSick = s.status === 'sick';

                            return (
                                <div key={s.id} style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '10px', borderBottom: '1px solid #eee',
                                    background: isDead ? '#f8f8f8' : (isSick ? '#fff0f0' : 'transparent'),
                                    opacity: isDead ? 0.7 : 1
                                }}>
                                    {/* Mini Visual Preview */}
                                    <div style={{
                                        width: '70px', minWidth: '70px', // Fixed width to prevent squeezing
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        marginRight: '15px'
                                    }}>
                                        <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                                            <SheepVisual
                                                status={s.status}
                                                visual={s.visual}
                                                health={s.health}
                                                type={s.type}
                                                isStatic={true}
                                                scale={0.65}
                                                direction={1}
                                            />
                                        </div>
                                        <div style={{
                                            marginTop: '2px', fontSize: '0.7rem', color: '#fff',
                                            background: isDead ? '#757575' : (s.type === 'HUMAN' ? '#ff9800' : (s.type === 'STRONG' ? '#2196f3' : '#8bc34a')),
                                            padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap',
                                            fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                            transform: 'translateY(-5px)', zIndex: 2
                                        }}>
                                            {isDead ? '陣亡' : (s.type === 'HUMAN' ? '榮耀' : (s.type === 'STRONG' ? '強壯' : '小羊'))}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left', marginRight: '10px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isDead ? '#666' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {s.name} <small style={{ color: '#999', fontSize: '0.7rem' }}>#{String(s.id).slice(-4)}</small>
                                        </div>
                                        {s.spiritualMaturity && (
                                            <div style={{ fontSize: '0.8rem', color: '#66bb6a', marginBottom: '2px' }}>
                                                🌱 {s.spiritualMaturity}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: isDead ? '#999' : (isSick ? 'red' : 'green'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {isDead ? '已離世 (需復活)' : (isSick ? '生病中' : '正常')}
                                            {!isDead && ` | 負擔: ${Math.round(s.health)}%`}
                                            {!isDead && <span style={{ color: '#ff9800', marginLeft: '5px' }}>| ❤️: {s.careLevel || 0}</span>}
                                        </div>
                                        {/* Message Preview */}
                                        <div style={{
                                            marginTop: '4px', background: '#f5f5f5', padding: '4px 8px',
                                            borderRadius: '6px', fontSize: '0.8rem', color: '#666',
                                            display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            fontStyle: 'italic', maxWidth: '100%'
                                        }}>
                                            💬 {s.message || getStableSheepMessage(s, isDead ? 'dead' : (isSick || s.health < 30 ? 'critical' : (s.health < 60 ? 'neglected' : 'happy')))}
                                        </div>
                                    </div>

                                    <button
                                        className="action-btn"
                                        style={{
                                            padding: '5px 12px', fontSize: '0.9rem',
                                            background: isDead ? '#9c27b0' : '#4facfe',
                                            color: 'white'
                                        }}
                                        onClick={() => onSelect(s)}
                                    >
                                        {isDead ? '復活' : '查看'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
