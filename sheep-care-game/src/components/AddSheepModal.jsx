import React, { useState } from 'react';

export const AddSheepModal = ({ onConfirm, onCancel }) => {
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [name, setName] = useState('小羊');
    const [spiritualMaturity, setSpiritualMaturity] = useState('');
    const [maturityStage, setMaturityStage] = useState('學習中'); // Default stage
    const [batchInput, setBatchInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isBatchMode) {
            // Parse batch input
            // Format: "Name, Level, Stage" or "Name, Level"
            const lines = batchInput.split('\n').filter(line => line.trim());
            const sheepData = lines.map(line => {
                const parts = line.split(/[ \t,，]+/).map(p => p.trim());
                const sName = parts[0];
                const sLevel = parts[1] || '';
                const sStage = parts[2] || '';

                let finalMaturity = sLevel;
                if (sLevel && sStage) {
                    finalMaturity = `${sLevel} (${sStage})`;
                }

                return { name: sName, spiritualMaturity: finalMaturity };
            });
            if (sheepData.length > 0) {
                onConfirm(sheepData);
            }
        } else {
            // Single Mode
            let finalMaturity = spiritualMaturity;
            if (spiritualMaturity && maturityStage) {
                finalMaturity = `${spiritualMaturity} (${maturityStage})`;
            }
            onConfirm({ name, spiritualMaturity: finalMaturity });
        }
    };

    return (
        <div className="debug-editor-overlay" onClick={onCancel}>
            <div className="simple-editor" onClick={(e) => e.stopPropagation()} style={{ width: '350px', padding: '20px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="editor-header">
                    <h3>{isBatchMode ? '批量新增小羊 🐑' : '新增小羊 🐑'}</h3>
                    <button className="close-btn" onClick={onCancel}>✖</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflow: 'hidden' }}>

                    {!isBatchMode ? (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>名字</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                    required={!isBatchMode}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>靈程 (Level)</label>
                                <select
                                    value={spiritualMaturity}
                                    onChange={(e) => setSpiritualMaturity(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                >
                                    <option value="">-- 請選擇 --</option>
                                    <option value="新朋友">新朋友</option>
                                    <option value="慕道友">慕道友</option>
                                    <option value="基督徒">基督徒</option>
                                </select>
                            </div>

                            {spiritualMaturity && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>階段 (Stage)</label>
                                    <select
                                        value={maturityStage}
                                        onChange={(e) => setMaturityStage(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                    >
                                        <option value="學習中">學習中</option>
                                        <option value="穩定">穩定</option>
                                        <option value="領袖">領袖</option>
                                    </select>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                批量輸入 (每行一隻)
                            </label>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                                    格式: 名字 靈程 (階段)<br />
                                    (分隔: 空白, 逗號 皆可)<br />
                                    例如: <br />
                                    <code style={{ background: '#eee', padding: '2px', display: 'block' }}>
                                        王大明 新朋友 學習中<br />
                                        李小美 基督徒 領袖
                                    </code>
                                </div>
                            </div>
                            <textarea
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                                placeholder="在此貼上名單..."
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc',
                                    minHeight: '150px',
                                    resize: 'vertical'
                                }}
                                required={isBatchMode}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            style={{ flex: 1, padding: '10px', background: '#66bb6a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {isBatchMode ? '批量新增' : '確認新增'}
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setIsBatchMode(!isBatchMode)}
                            style={{
                                background: 'transparent',
                                border: '1px dashed #999',
                                color: '#666',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            {isBatchMode ? '切換回單一新增模式' : '📋 切換至批量新增模式'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
