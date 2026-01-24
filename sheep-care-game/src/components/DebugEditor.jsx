
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { calculateSheepState, parseMaturity } from '../utils/gameLogic';

export const DebugEditor = ({ selectedSheepId, onClose }) => {
    const { sheep, updateSheep, prayForSheep, deleteSheep, forceLoadFromCloud, isAdmin } = useGame();

    const target = (sheep || []).find(s => s.id === selectedSheepId);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    // Admin States
    // const [selectedType, setSelectedType] = useState('LAMB'); // removed manual control
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteNameInput, setDeleteNameInput] = useState('');
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    // Spiritual Maturity State
    const [sLevel, setSLevel] = useState('');
    const [sStage, setSStage] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [localMsg, setLocalMsg] = useState('');

    useEffect(() => {
        if (target) {
            setName(target.name);
            setNote(target.note || '');
            // Parse "Level (Stage)" or just "Level"
            // Parse "Level (Stage)" or just "Level"
            const { level, stage } = parseMaturity(target.spiritualMaturity);
            setSLevel(level);
            setSStage(stage);
            // Reset delete state when opening new sheep
            setDeleteConfirmOpen(false);
            setDeleteNameInput('');
            setIsEditing(false); // Default to read-only
            setLocalMsg('');
        }
    }, [target?.id]);

    if (!target) return null;

    const handleSave = () => {
        const finalMaturity = sLevel;
        updateSheep(target.id, { name, note, spiritualMaturity: finalMaturity });
        setIsEditing(false); // Exit edit mode
    };

    const handleCancel = () => {
        // Reset to original target data
        setName(target.name);
        setNote(target.note || '');
        const { level, stage } = parseMaturity(target.spiritualMaturity);
        setSLevel(level);
        setSStage(stage);
        setIsEditing(false);
        setLocalMsg('');
    };

    const handleResetHealth = () => {
        updateSheep(target.id, { health: 100, status: 'healthy' });
    };

    const handleDelete = () => {
        if (deleteNameInput === target.name) {
            deleteSheep(target.id);
            onClose();
        }
    };

    const handlePray = () => {
        const todayStr = new Date().toDateString();
        // Check if Dead and already prayed today
        if (target.status === 'dead' && target.lastPrayedDate === todayStr && !isAdmin) {
            setLocalMsg("今天已經為這隻小羊禱告過了，請明天再來！🙏");
            return;
        }

        prayForSheep(target.id);
        // Optional: Set success feedback? Global toast handles it.
        // But if successful, maybe clear error msg?
        setLocalMsg('');
    };

    const isDead = target.status === 'dead';

    // Prayer / Resurrection Logic
    const today = new Date().toDateString();
    const currentCount = (target.lastPrayedDate === today) ? (target.prayedCount || 0) : 0;
    const isFull = !isDead && currentCount >= 3;

    // Button Text
    let buttonText = '';
    if (isDead) {
        buttonText = `🔮 迫切認領禱告 (${target.resurrectionProgress || 0}/5)`;
    } else {
        if (isAdmin) {
            buttonText = `🙏 為牠禱告 (今日: ${currentCount}/∞)`;
        } else {
            buttonText = isFull ? '🙏 今日禱告已達上限' : `🙏 為牠禱告 (今日: ${currentCount}/3)`;
        }
    }

    // Status Text
    const getStatusText = (status, health) => {
        if (status === 'dead') return '已安息 🪦';
        if (status === 'sick') return '生病 (需禱告恢復)';
        if (status === 'injured') return '受傷 (需禱告恢復)';
        if (health >= 80) return '強壯 💪';
        return '健康';
    };

    const startMat = target?.spiritualMaturity || '';
    let currentMat = sLevel;
    if (sLevel && sStage) currentMat = `${sLevel} (${sStage})`;

    const hasChanges = target && (
        name !== target.name ||
        note !== (target.note || '') ||
        currentMat !== startMat
    );

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            <div className="debug-editor simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="editor-header">
                    <h3>{isDead ? '🪦 墓碑' : '📝 小羊資料'}</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="editor-form">
                    <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                        <label>{isDead ? '墓誌銘 (姓名)' : '姓名'}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={10}
                            placeholder="名字..."
                            disabled={!isEditing}
                            style={{ pointerEvents: !isEditing ? 'none' : 'auto' }} // Ensure click passes to parent
                        />
                    </div>

                    <div className="form-group">
                        <label>狀態</label>
                        <div style={{
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            display: 'flex', flexDirection: 'column', gap: '5px',
                            color: isDead ? '#666' : (target.health >= 80 ? '#2196f3' : (target.status === 'healthy' ? 'green' : 'red'))
                        }}>
                            <div>
                                {getStatusText(target.status, target.health)}
                                {!isDead && <span style={{ marginLeft: '10px' }}>HP: {Math.round(target.health)}%</span>}
                                {!isDead && <span style={{ marginLeft: '10px', color: '#ff9800' }}>❤️ 關愛: {target.careLevel || 0}</span>}
                            </div>

                        </div>
                    </div>

                    <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                        <label>靈程 (Spiritual Maturity)</label>
                        <select
                            value={sLevel}
                            onChange={(e) => setSLevel(e.target.value)}
                            disabled={!isEditing}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', marginBottom: '5px', pointerEvents: !isEditing ? 'none' : 'auto' }}
                        >
                            <option value="">-- 請選擇 --</option>
                            <option value="新朋友">新朋友</option>
                            <option value="慕道友">慕道友</option>
                            <option value="基督徒">基督徒</option>
                        </select>

                        {/* Stage Selection Removed */}
                    </div>

                    <div className="form-group">
                        <label>負擔狀態 (依照數值)</label>
                        <div style={{ padding: '8px', background: '#eee', borderRadius: '8px', color: '#555', fontSize: '0.9rem' }}>
                            {target.health < 40 ? '🍂 虛弱' : (target.health >= 80 ? '💪 強壯' : '🐑 正常')}
                        </div>
                        {isAdmin && !isDead && (
                            <div style={{ marginTop: '10px', padding: '10px', background: '#e0f7fa', borderRadius: '8px', border: '1px dashed #00bcd4' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#006064' }}>🔧 管理員調整: {Math.round(target.health)}%</label>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={target.health}
                                        onChange={(e) => {
                                            const newHealth = Number(e.target.value);
                                            const { health, status, type } = calculateSheepState(newHealth, target.status);
                                            updateSheep(target.id, { health, type, status });
                                        }}
                                        style={{ flex: 1, cursor: 'pointer' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateSheep(target.id, { health: 0 })}
                                        style={{
                                            padding: '2px 8px', fontSize: '0.8rem', background: '#ff5252', color: 'white',
                                            border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                        title="直接歸零 (測試死亡)"
                                    >
                                        💀 歸零
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group" onClick={() => !isEditing && setIsEditing(true)} style={{ cursor: !isEditing ? 'pointer' : 'default' }} title={!isEditing ? "點擊編輯" : ""}>
                        <label>備註 / 追憶</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', pointerEvents: !isEditing ? 'none' : 'auto' }}
                            placeholder={isDead ? "寫下對牠的負擔..." : "記錄這隻小羊的狀況..."}
                            disabled={!isEditing}
                        />
                    </div>

                    <button
                        className="pray-action-btn"
                        onClick={handlePray}
                        disabled={!isDead && isFull && !isAdmin}
                        style={{
                            opacity: (!isDead && isFull && !isAdmin) ? 0.6 : 1,
                            cursor: (!isDead && isFull && !isAdmin) ? 'not-allowed' : 'pointer',
                            background: isDead ? '#9c27b0' : undefined // Purple for magic
                        }}
                    >
                        {buttonText}
                    </button>

                    {localMsg && (
                        <div style={{
                            marginTop: '10px',
                            color: '#e65100',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            background: '#fff3e0',
                            padding: '8px',
                            borderRadius: '5px'
                        }}>
                            {localMsg}
                        </div>
                    )}

                    <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />

                    {/* Reset Confirmation Section */}
                    {resetConfirmOpen ? (
                        <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px', border: '1px solid #ffe0b2', marginBottom: '10px' }}>
                            <p style={{ color: '#e65100', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>確定要重置所有資料嗎？(將回到初始狀態)</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => {
                                        updateSheep(target.id, {
                                            health: 60,
                                            status: 'healthy',
                                            type: 'LAMB',
                                            careLevel: 0,
                                            prayedCount: 0,
                                            resurrectionProgress: 0,
                                            note: '',
                                            lastPrayedDate: null
                                        });
                                        // setSelectedType('LAMB');
                                        setNote('');
                                        setResetConfirmOpen(false);
                                        onClose();
                                    }}
                                    style={{
                                        flex: 1, padding: '6px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    確認重置
                                </button>
                                <button
                                    onClick={() => setResetConfirmOpen(false)}
                                    style={{
                                        flex: 1, padding: '6px', background: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Delete Section */}
                    {deleteConfirmOpen ? (
                        <div style={{ background: '#ffebee', padding: '10px', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
                            <p style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>請問確定要刪除這隻小羊嗎？</p>
                            <p style={{ fontSize: '0.8rem', marginBottom: '8px' }}>請輸入 <strong>{target.name}</strong> 以確認：</p>
                            <input
                                type="text"
                                value={deleteNameInput}
                                onChange={(e) => setDeleteNameInput(e.target.value)}
                                placeholder="輸入名字..."
                                style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteNameInput !== target.name}
                                    style={{
                                        flex: 1, padding: '6px', background: deleteNameInput === target.name ? '#d32f2f' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    確認刪除
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmOpen(false)}
                                    style={{
                                        flex: 1, padding: '6px', background: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Main Actions (Hide if any confirm is open) */}
                    {/* Main Actions (Hide if any confirm is open) */}
                    {!deleteConfirmOpen && !resetConfirmOpen && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {isEditing && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={!hasChanges}
                                        style={{
                                            flex: 1, height: '36px', padding: '0 5px',
                                            background: hasChanges ? '#4caf50' : '#ccc',
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            cursor: hasChanges ? 'pointer' : 'not-allowed',
                                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                                        }}
                                    >
                                        儲存
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        style={{
                                            flex: 1, height: '36px', padding: '0 5px',
                                            background: '#29b6f6',
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                                        }}
                                    >
                                        取消
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setResetConfirmOpen(true)}
                                style={{ flex: 2, height: '36px', padding: '0 5px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', gap: '5px', whiteSpace: 'nowrap' }}
                                title="重置資料"
                            >
                                🔄 重置資料
                            </button>

                            <button
                                onClick={() => setDeleteConfirmOpen(true)}
                                style={{ flex: 1.2, height: '36px', padding: '0 5px', background: '#ff5252', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                title="刪除"
                            >
                                🗑️ 刪除
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>

    );
};
