import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SheepVisual } from './SheepVisual'; // Import for preview
import { generateVisuals, parseMaturity } from '../utils/gameLogic';

const COLORS = [
    { name: '雪白', value: '#f5f5f5' },
    { name: '米白', value: '#f0e6d2' },
    { name: '淺褐', value: '#d4c4b0' },
    { name: '深褐', value: '#9e8a78' },
    { name: '灰褐', value: '#877b6e' },
    { name: '深灰', value: '#5a5550' },
];

const ACCESSORIES = [
    { id: 'none', label: '無' },
    { id: 'tie_red', label: '紅領帶' },
    { id: 'tie_blue', label: '藍領帶' },
    { id: 'flower', label: '小花' },
    { id: 'scarf_green', label: '綠圍巾' },
];

const PATTERNS = [
    { id: 'none', label: '無' },
    { id: 'dots', label: '圓點' },
    { id: 'stripes', label: '條紋' },
];

export const AddSheepModal = ({ onConfirm, onCancel, editingSheep = null }) => {
    const { skins = [], createSkin, isAdmin } = useGame();
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Basic Info
    const [name, setName] = useState(editingSheep?.name || '小羊');
    const [note, setNote] = useState(editingSheep?.note || '');
    const [spiritualMaturity, setSpiritualMaturity] = useState('');
    const [maturityStage, setMaturityStage] = useState('學習中');

    // Visual Info
    const [mode, setMode] = useState(editingSheep?.skinId ? 'skin' : 'css');
    // Initialize Visuals: Use existing data OR defaults
    const [selectedColor, setSelectedColor] = useState(editingSheep?.visual?.color || '#ffffff');
    const [selectedAccessory, setSelectedAccessory] = useState(editingSheep?.visual?.accessory || 'none');
    const [selectedPattern, setSelectedPattern] = useState(editingSheep?.visual?.pattern || 'none');
    const [selectedSkinId, setSelectedSkinId] = useState(editingSheep?.skinId || null);

    // New Skin Creation
    const [newSkinName, setNewSkinName] = useState('');
    const [newSkinUrl, setNewSkinUrl] = useState('');
    const [newSkinFile, setNewSkinFile] = useState(null); // RAW FILE State
    const [isCreatingSkin, setIsCreatingSkin] = useState(false);
    const [uploadError, setUploadError] = useState(''); // Inline Warning State

    const [batchInput, setBatchInput] = useState('');

    // Load initial maturity strings
    useEffect(() => {
        if (editingSheep?.spiritualMaturity) {
            const { level, stage } = parseMaturity(editingSheep.spiritualMaturity);
            setSpiritualMaturity(level);
            setMaturityStage(stage || '學習中');
        }
    }, [editingSheep]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Creation Mode (Batch)
        if (isBatchMode && !editingSheep) {
            const lines = batchInput.trim().split('\n').filter(line => line.trim());
            const sheepData = lines.map(line => {
                const parts = line.split(/[ \t,，]+/).map(p => p.trim());
                // Generate RANDOM visual for each batch sheep
                const randomVisual = generateVisuals();
                return {
                    name: parts[0],
                    spiritualMaturity: parts[1] && parts[2] ? `${parts[1]} (${parts[2]})` : (parts[1] || ''),
                    visual: { ...randomVisual, pattern: 'none' }, // Default random
                    skinId: null
                };
            }).filter(s => s.name); // Filter empty names

            if (sheepData.length === 0) return; // Prevent empty submit
            onConfirm(sheepData);
            return;
        }

        // 2. Single Creation OR Edit Logic
        let finalMaturity = spiritualMaturity;
        if (spiritualMaturity && maturityStage) {
            finalMaturity = `${spiritualMaturity} (${maturityStage})`;
        }

        let finalVisualData = {};

        if (editingSheep) {
            // Edit Mode: Use selected values specifically
            const visualObj = {
                color: selectedColor,
                accessory: selectedAccessory,
                pattern: selectedPattern
            };

            // Hydrate skinData for immediate rendering
            if (mode === 'skin' && selectedSkinId) {
                const skin = skins.find(s => s.id === selectedSkinId);
                if (skin) {
                    visualObj.skinData = skin;
                }
            }

            finalVisualData = {
                visual: visualObj,
                skinId: mode === 'skin' ? selectedSkinId : null
            };
        } else {
            // Creation Mode (Simple): Generate RANDOM Visuals
            const randomVisual = generateVisuals();
            finalVisualData = {
                visual: { ...randomVisual, pattern: 'none' },
                skinId: null
            };
        }

        onConfirm({
            name: name.trim(), // Trim Name
            note: note ? note.trim() : '',
            spiritualMaturity: finalMaturity,
            ...finalVisualData
        });
    };

    const handleCreateSkin = async () => {
        const trimmedName = newSkinName.trim();
        const trimmedUrl = newSkinUrl.trim();

        if (!trimmedName) {
            setUploadError("⚠️ 請輸入造型名稱！");
            return;
        }
        // Logic: specific file > specific url input
        const payload = newSkinFile || trimmedUrl;
        if (!payload) {
            setUploadError("⚠️ 請上傳圖片或輸入網址！");
            return;
        }
        setUploadError(''); // Clear if passing

        if (createSkin) {
            const newSkin = await createSkin(trimmedName, payload);
            if (newSkin) {
                setSelectedSkinId(newSkin.id);
                setMode('skin');
                setIsCreatingSkin(false);
                setNewSkinName('');
                setNewSkinUrl('');
                setNewSkinFile(null);
            }
        } else {
            setUploadError("Skin creation not supported yet");
        }
    };

    const isEditing = !!editingSheep;

    // Detect if visual settings have changed (for Edit mode only)
    const hasVisualChanges = isEditing && (
        (mode === 'css' && (
            selectedColor !== (editingSheep?.visual?.color || '#ffffff') ||
            selectedAccessory !== (editingSheep?.visual?.accessory || 'none') ||
            selectedPattern !== (editingSheep?.visual?.pattern || 'none')
        )) ||
        (mode === 'skin' && selectedSkinId !== (editingSheep?.skinId || null))
    );

    return (
        <div className="debug-editor-overlay" onClick={onCancel}>
            <div className="simple-editor" onClick={(e) => e.stopPropagation()}
                style={{ width: '360px', padding: '20px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div className="editor-header">
                    <h3>{isEditing ? `🎨 編輯 ${name} 的外觀` : (isBatchMode ? '批量新增' : '新增小羊')}</h3>
                    <button className="close-btn" onClick={onCancel}>✖</button>
                </div>

                {isEditing && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <div style={{
                            position: 'relative', width: '120px', height: '120px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                        }}>
                            <SheepVisual
                                centered={true}
                                isStatic={true}
                                scale={0.65}
                                visual={{
                                    color: selectedColor,
                                    accessory: selectedAccessory,
                                    pattern: selectedPattern,
                                    skinData: (mode === 'skin' && skins && selectedSkinId)
                                        ? skins.find(s => s.id === selectedSkinId)
                                        : null
                                }}
                            />
                        </div>
                    </div>
                )}

                {!isEditing && !isBatchMode && (
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '10px', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                        🎲 系統將為新小羊隨機分配一個可愛的外觀！
                        <br />
                        <small>(建立後可再點選頭像進行更換)</small>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto' }}>

                    {(!isBatchMode || isEditing) ? (
                        <>
                            {isEditing && (
                                <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', borderBottom: '1px solid #ddd', gap: '10px', marginBottom: '10px' }}>
                                        <button type="button" onClick={() => setMode('css')}
                                            style={{
                                                padding: '5px 10px', background: 'transparent', border: 'none',
                                                borderBottom: mode === 'css' ? '2px solid #66bb6a' : 'none',
                                                fontWeight: mode === 'css' ? 'bold' : 'normal', cursor: 'pointer'
                                            }}>🎨 自訂樣式</button>

                                        <button type="button" onClick={() => setMode('skin')}
                                            style={{
                                                padding: '5px 10px', background: 'transparent', border: 'none',
                                                borderBottom: mode === 'skin' ? '2px solid #66bb6a' : 'none',
                                                fontWeight: mode === 'skin' ? 'bold' : 'normal', cursor: 'pointer'
                                            }}>🖼️ 圖片造型</button>
                                    </div>

                                    {mode === 'css' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>毛色</label>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                                                    {COLORS.map(c => (
                                                        <div key={c.value} onClick={() => setSelectedColor(c.value)}
                                                            style={{
                                                                width: '30px', height: '30px', borderRadius: '50%', background: c.value,
                                                                border: selectedColor === c.value ? '3px solid #66bb6a' : '2px solid #ddd',
                                                                boxShadow: selectedColor === c.value ? '0 2px 8px rgba(102, 187, 106, 0.4)' : '0 1px 3px rgba(0,0,0,0.15)',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease'
                                                            }} title={c.name} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>配件</label>
                                                    <select style={{ width: '100%', padding: '5px' }} value={selectedAccessory} onChange={e => setSelectedAccessory(e.target.value)}>
                                                        {ACCESSORIES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>紋路</label>
                                                    <select style={{ width: '100%', padding: '5px' }} value={selectedPattern} onChange={e => setSelectedPattern(e.target.value)}>
                                                        {PATTERNS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {!isCreatingSkin ? (
                                                <>
                                                    <select value={selectedSkinId || ''} onChange={e => setSelectedSkinId(e.target.value)} style={{ width: '100%', padding: '6px' }}>
                                                        <option value="">-- 選擇造型 --</option>
                                                        {skins && skins.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    {isAdmin && (
                                                        <button type="button" onClick={() => setIsCreatingSkin(true)} style={{ background: '#eee', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>➕ 新增圖片造型</button>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px', fontWeight: '500' }}>名稱</label>
                                                        <input
                                                            type="text"
                                                            placeholder="例: 香蕉羊"
                                                            value={newSkinName}
                                                            onChange={e => { setNewSkinName(e.target.value); if (uploadError) setUploadError(''); }}
                                                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                                                        />
                                                    </div>

                                                    <div style={{ marginBottom: '8px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px', fontWeight: '500' }}>網址 (支援 GIF 動圖)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://..."
                                                            value={newSkinUrl}
                                                            onChange={e => { setNewSkinUrl(e.target.value); if (uploadError) setUploadError(''); }}
                                                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                                                        />
                                                    </div>

                                                    <div style={{ marginBottom: '12px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#555', marginBottom: '4px', fontWeight: '500' }}>或是上傳本地圖片:</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    if (file.size > 2 * 1024 * 1024) {
                                                                        setUploadError("❌ 圖片大小請小於 2MB");
                                                                        return;
                                                                    }
                                                                    setNewSkinFile(file);
                                                                    if (uploadError) setUploadError('');

                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setNewSkinUrl(reader.result);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            style={{ width: '100%', fontSize: '0.85rem', padding: '4px' }}
                                                        />
                                                        <small style={{ color: '#999', fontSize: '0.75rem' }}>支援 JPG, PNG, GIF (上限 2MB)</small>
                                                    </div>

                                                    {uploadError && (
                                                        <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>
                                                            {uploadError}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateSkin}
                                                            style={{
                                                                flex: 1,
                                                                background: '#4caf50',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '8px',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            📤 上傳檔案
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingSkin(false)}
                                                            style={{
                                                                flex: 1,
                                                                background: '#e0e0e0',
                                                                color: '#666',
                                                                border: 'none',
                                                                padding: '8px',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            取消
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEditing && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>名稱</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem' }}>靈程</label>
                                            <select value={spiritualMaturity} onChange={e => setSpiritualMaturity(e.target.value)}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                                <option value="">未設定</option>
                                                <option value="新朋友">新朋友</option>
                                                <option value="慕道友">慕道友</option>
                                                <option value="基督徒">基督徒</option>
                                            </select>
                                        </div>
                                        {spiritualMaturity && (
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.9rem' }}>階段</label>
                                                <select value={maturityStage} onChange={e => setMaturityStage(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                                    <option value="學習中">學習中</option>
                                                    <option value="穩定">穩定</option>
                                                    <option value="領袖">領袖</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <label style={{ fontSize: '0.9rem' }}>備註</label>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="記錄這隻小羊的故事..."
                                            style={{
                                                width: '100%', padding: '8px', border: '1px solid #ccc',
                                                borderRadius: '5px', resize: 'vertical', minHeight: '60px'
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>批量輸入</label>
                            <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>* 將會隨機分配每隻羊的外觀</label>
                            <textarea
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                                placeholder="王大明 新朋友 學習中..."
                                style={{ flex: 1, width: '100%', padding: '8px', border: '1px solid #ccc', resize: 'none' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px' }}>取消</button>
                        <button
                            type="submit"
                            disabled={isEditing && !hasVisualChanges}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: (isEditing && !hasVisualChanges) ? '#ccc' : '#66bb6a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                cursor: (isEditing && !hasVisualChanges) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isEditing ? '儲存變更' : (isBatchMode ? '批量新增' : '確認新增')}
                        </button>
                    </div>

                    {!isEditing && (
                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                            <span onClick={() => setIsBatchMode(!isBatchMode)} style={{ fontSize: '0.8rem', color: '#999', cursor: 'pointer', textDecoration: 'underline' }}>
                                {isBatchMode ? '切換回單一模式' : '切換至批量模式'}
                            </span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
