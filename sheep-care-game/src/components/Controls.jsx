
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { AddSheepModal } from './AddSheepModal';
import { SettingsModal } from './SettingsModal';

export const Controls = ({ onOpenList, isCollapsed, onToggleCollapse }) => {
    const { adoptSheep, sheep, currentUser, nickname, saveToCloud } = useGame(); // Removed logout here
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleConfirmAdd = (data) => {
        if (Array.isArray(data)) {
            data.forEach(item => adoptSheep(item));
        } else {
            adoptSheep(data);
        }
        setShowAddModal(false);
    };

    return (
        <div className={`controls-container ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Toggle Button */}
            <button
                className="collapse-toggle-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? "展開工具列" : "收起工具列"}
            >
                {isCollapsed ? '🔼' : '🔽'}
            </button>

            {!isCollapsed && (
                <>
                    <div className="stats-panel" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ fontSize: '0.9rem' }}>👋 嗨，牧羊人 <strong>{nickname || currentUser}</strong></div>
                        <div><strong>目前羊隻:</strong> {(sheep || []).length} 隻 🐑</div>
                    </div>

                    {/* Sheep List Button */}
                    <button
                        className="action-btn"
                        style={{
                            background: '#fff',
                            color: '#333',
                            border: '1px solid #ccc',
                            marginRight: '10px',
                            fontSize: '1.2rem',
                            padding: '8px 12px'
                        }}
                        onClick={onOpenList}
                        title="羊群名冊"
                    >
                        📋
                    </button>

                    <button
                        className="action-btn adopt-btn"
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: '#66bb6a',
                            color: 'white',
                            minWidth: '120px'
                        }}
                    >
                        新增小羊 🐑
                    </button>



                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            background: '#fff',
                            color: '#555',
                            border: '2px solid #ccc',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        title="設定"
                    >
                        ⚙️
                    </button>
                </>
            )}
            {showAddModal && (
                <AddSheepModal
                    onConfirm={handleConfirmAdd}
                    onCancel={() => setShowAddModal(false)}
                />
            )}
            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};
