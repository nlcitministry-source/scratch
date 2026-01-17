
import React from 'react';
import { useGame } from '../context/GameContext';
import { SheepVisual } from './SheepVisual';
import { getSheepMessage, getStableSheepMessage } from '../utils/gameLogic';

export const SheepList = ({ onSelect, onClose }) => {
    const { sheep } = useGame();

    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);

    return (
        <div className="debug-editor-overlay">
            <div className="simple-editor" style={{ width: '360px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
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
                                    <div style={{ width: '60px', height: '60px', position: 'relative', marginRight: '15px' }}>
                                        <SheepVisual
                                            status={s.status}
                                            visual={s.visual}
                                            isStatic={true}
                                            scale={0.8}
                                            direction={1}
                                        />
                                    </div>

                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isDead ? '#666' : '#333' }}>
                                            {s.name} <small style={{ color: '#999', fontSize: '0.7rem' }}>#{String(s.id).slice(-4)}</small>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: isDead ? '#999' : (isSick ? 'red' : 'green') }}>
                                            {isDead ? '已離世 (需復活)' : (isSick ? '生病中' : '健康')}
                                            {!isDead && ` | HP: ${Math.round(s.health)}%`}
                                        </div>
                                        {/* Message Preview */}
                                        {!isDead && (
                                            <div style={{
                                                marginTop: '5px', background: '#f0f0f0', padding: '5px 10px',
                                                borderRadius: '10px', fontSize: '0.85rem', color: '#555',
                                                display: 'inline-block', fontStyle: 'italic'
                                            }}>
                                                💬 {s.message || getStableSheepMessage(s, isSick || s.health < 30 ? 'critical' : (s.health < 60 ? 'neglected' : 'happy'))}
                                            </div>
                                        )}
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
