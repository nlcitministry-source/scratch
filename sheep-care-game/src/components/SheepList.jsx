import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SheepVisual } from './SheepVisual';
import { getStableSheepMessage } from '../utils/gameLogic';
import { AddSheepModal } from './AddSheepModal';

export const SheepList = ({ onSelect, onClose }) => {
    const { sheep, deleteMultipleSheep, updateSheep } = useGame();
    const sortedSheep = [...(sheep || [])].sort((a, b) => a.id - b.id);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingSheep, setEditingSheep] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Search State
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'HEALTHY', 'SICK', 'DEAD'

    // Filter Logic
    // Filter Logic (Memoized)
    const filteredSheep = React.useMemo(() => sortedSheep.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isDead = s.status === 'dead';
        const isSick = s.status === 'sick';

        if (!matchesSearch) return false;

        if (filterStatus === 'DEAD') return isDead;
        if (filterStatus === 'SICK') return isSick;
        if (filterStatus === 'HEALTHY') return !isDead && !isSick;
        return true;
    }), [sortedSheep, searchTerm, filterStatus]);

    // Counts Logic (Memoized Single Pass)
    const counts = React.useMemo(() => sortedSheep.reduce((acc, s) => {
        const isDead = s.status === 'dead';
        const isSick = s.status === 'sick';

        if (isDead) acc.DEAD++;
        else if (isSick) acc.SICK++;
        else acc.HEALTHY++;

        return acc;
    }, { ALL: sortedSheep.length, HEALTHY: 0, SICK: 0, DEAD: 0 }), [sortedSheep]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredSheep.length) {
            setSelectedIds(new Set()); // Deselect All
        } else {
            const allIds = new Set(filteredSheep.map(s => s.id));
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要刪除這 ${selectedIds.size} 隻小羊嗎？\n此動作無法復原！`)) {
            deleteMultipleSheep(Array.from(selectedIds));
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleResetSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`確定要重置這 ${selectedIds.size} 隻小羊的資料嗎？\n將回到初始狀態（負擔 60%）`)) {
            selectedIds.forEach(id => {
                updateSheep(id, {
                    health: 60,
                    status: 'healthy',
                    type: 'LAMB',
                    careLevel: 0,
                    prayedCount: 0,
                    resurrectionProgress: 0,
                    lastPrayedDate: null
                });
            });
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleUpdateConfirm = (updatedData) => {
        if (editingSheep && updateSheep) {
            updateSheep(editingSheep.id, updatedData);
            setEditingSheep(null);
        }
    };

    // Helper for filter counts
    const getCount = (status) => counts[status] || 0;

    return (
        <div className="debug-editor-overlay" onClick={onClose}>
            {/* If Editing, Show Modal ON TOP of List (or replace it? Replaces usually better UX here) */}
            {editingSheep ? (
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <AddSheepModal
                        editingSheep={editingSheep}
                        onConfirm={handleUpdateConfirm}
                        onCancel={() => setEditingSheep(null)}
                    />
                </div>
            ) : (
                <div className="simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '360px', height: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="editor-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h3>📖 小羊圖鑑 ({filteredSheep.length}/{sheep.length})</h3>
                        </div>
                        <div>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    setSelectedIds(new Set());
                                }}
                                style={{
                                    background: 'transparent', border: '1px solid #ccc',
                                    borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem',
                                    cursor: 'pointer', marginRight: '5px',
                                    color: isSelectionMode ? '#2196f3' : '#666'
                                }}
                            >
                                {isSelectionMode ? '取消選取' : '批次管理'}
                            </button>
                            <button className="close-btn" onClick={onClose}>✖</button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ padding: '0 10px 5px 10px' }}>
                        <input
                            type="text"
                            placeholder="🔍 搜尋小羊名稱..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '8px', borderRadius: '5px',
                                border: '1px solid #ddd', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Status Filters */}
                    <div style={{ padding: '0 10px 10px 10px', display: 'flex', gap: '5px', overflowX: 'auto', borderBottom: isSelectionMode ? 'none' : '1px solid #eee' }}>
                        {[
                            { id: 'ALL', label: '全部', count: sheep.length, color: '#666' },
                            { id: 'HEALTHY', label: '正常', count: getCount('HEALTHY'), color: '#4caf50' },
                            { id: 'SICK', label: '生病', count: getCount('SICK'), color: '#f44336' },
                            { id: 'DEAD', label: '已離世', count: getCount('DEAD'), color: '#9c27b0' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterStatus(f.id)}
                                style={{
                                    padding: '4px 10px', borderRadius: '15px', border: 'none',
                                    fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: filterStatus === f.id ? f.color : '#eee',
                                    color: filterStatus === f.id ? 'white' : '#666',
                                    fontWeight: filterStatus === f.id ? 'bold' : 'normal',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f.label} <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>{f.count}</span>
                            </button>
                        ))}
                    </div>

                    {isSelectionMode && (
                        <div style={{ padding: '8px 10px', background: '#f5f5f5', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'black' }}>
                                <input
                                    type="checkbox"
                                    checked={sortedSheep.length > 0 && selectedIds.size === sortedSheep.length}
                                    onChange={handleSelectAll}
                                    style={{ transform: 'scale(1.2)', marginRight: '8px' }}
                                />
                                全選 ({selectedIds.size}/{sortedSheep.length})
                            </label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    onClick={handleResetSelected}
                                    disabled={selectedIds.size === 0}
                                    style={{
                                        background: selectedIds.size > 0 ? '#ff9800' : '#ddd',
                                        color: 'white', border: 'none', borderRadius: '4px',
                                        padding: '5px 10px', fontSize: '0.8rem',
                                        cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    🔄 重置選取 ({selectedIds.size})
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedIds.size === 0}
                                    style={{
                                        background: selectedIds.size > 0 ? '#f44336' : '#ddd',
                                        color: 'white', border: 'none', borderRadius: '4px',
                                        padding: '5px 10px', fontSize: '0.8rem',
                                        cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    🗑️ 刪除選取 ({selectedIds.size})
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                        {filteredSheep.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                {searchTerm ? '找不到這隻小羊...' : (
                                    <>
                                        牧場還是空的...<br />快去新增小羊吧！
                                    </>
                                )}
                            </div>
                        ) : (
                            filteredSheep.map(s => {
                                const isDead = s.status === 'dead';
                                const isSick = s.status === 'sick';
                                const isSelected = selectedIds.has(s.id);

                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            if (isSelectionMode) toggleSelection(s.id);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center',
                                            padding: '10px', borderBottom: '1px solid #eee',
                                            background: isSelectionMode && isSelected ? '#e3f2fd' : (isDead ? '#f8f8f8' : (isSick ? '#fff0f0' : 'transparent')),
                                            opacity: isDead ? 0.7 : 1,
                                            cursor: isSelectionMode ? 'pointer' : 'default'
                                        }}
                                    >
                                        {isSelectionMode && (
                                            <div style={{ marginRight: '10px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(s.id)}
                                                    style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                                                    onClick={(e) => e.stopPropagation()} // Prevent double trigger
                                                />
                                            </div>
                                        )}

                                        {/* Mini Visual Preview - CLICK TO EDIT */}
                                        <div style={{
                                            width: '70px', minWidth: '70px', // Fixed width to prevent squeezing
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            marginRight: '15px',
                                            cursor: !isSelectionMode ? 'pointer' : 'default', // Hint clickable
                                            position: 'relative'
                                        }}
                                            onClick={(e) => {
                                                if (!isSelectionMode) {
                                                    e.stopPropagation();
                                                    setEditingSheep(s);
                                                }
                                            }}
                                            title={!isSelectionMode ? "點擊編輯外觀" : ""}
                                        >
                                            <div style={{ width: '60px', height: '60px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {/* Edit Icon Overlay on Hover (optional, but good for UX) */}
                                                {!isSelectionMode && (
                                                    <div style={{
                                                        position: 'absolute', top: -5, right: -5,
                                                        background: '#fff', borderRadius: '50%',
                                                        width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 10, fontSize: '12px'
                                                    }}>✏️</div>
                                                )}

                                                {/* NEW Badge */}
                                                {(s.createdAt && (Date.now() - new Date(s.createdAt).getTime() < 15 * 60 * 1000)) && (
                                                    <div style={{
                                                        position: 'absolute', top: -8, left: -8,
                                                        background: '#ff5252', color: 'white', borderRadius: '4px',
                                                        padding: '1px 4px', fontSize: '0.6rem', fontWeight: 'bold',
                                                        zIndex: 11, boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                        animation: 'bounce 1s infinite'
                                                    }}>
                                                        NEW
                                                    </div>
                                                )}

                                                <SheepVisual
                                                    status={s.status}
                                                    visual={s.visual}
                                                    health={s.health}
                                                    type={s.type}
                                                    isStatic={true}
                                                    scale={0.65}
                                                    direction={1}
                                                    centered={true}
                                                />
                                            </div>
                                            <div style={{
                                                marginTop: '2px', fontSize: '0.7rem', color: '#fff',
                                                background: isDead ? '#757575' : (isSick ? '#f44336' : (s.type === 'HUMAN' ? '#ff9800' : (s.type === 'STRONG' ? '#2196f3' : '#8bc34a'))),
                                                padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap',
                                                fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                                transform: 'translateY(-5px)', zIndex: 2
                                            }}>
                                                {isDead ? '陣亡' : (isSick ? '生病中' : (s.type === 'HUMAN' ? '榮耀' : (s.type === 'STRONG' ? '強壯' : '小羊')))}
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
                                                {!isDead && ` | 負擔: ${Math.ceil(s.health)}% `}
                                                {!isDead && <span style={{ color: '#ff9800', marginLeft: '5px' }}>| ❤️: {s.careLevel || 0}</span>}
                                            </div>
                                            {/* Message Preview */}
                                            <div style={{
                                                marginTop: '4px', background: '#f5f5f5', padding: '4px 8px',
                                                borderRadius: '6px', fontSize: '0.8rem', color: 'black',
                                                display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                fontStyle: 'italic', maxWidth: '100%'
                                            }}>
                                                💬 {s.message || getStableSheepMessage(s, isDead ? 'dead' : (isSick || s.health < 30 ? 'critical' : (s.health < 60 ? 'neglected' : 'happy')))}
                                            </div>
                                        </div>

                                        {!isSelectionMode && (
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
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
