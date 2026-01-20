
import React from 'react';

export const Guide = ({ onClose }) => {
    return (
        <div className="debug-editor-overlay">
            <div className="simple-editor" style={{ width: '400px', textAlign: 'left' }}>
                <div className="editor-header">
                    <h3>📖 牧羊人手冊</h3>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', fontSize: '0.9rem', lineHeight: '1.5', color: '#000' }}>
                    <h4>1. 每日照顧與進化</h4>
                    <p>上帝限制了每日的影響力，讓成長循序漸進：</p>
                    <ul>
                        <li><strong>禱告 (Prayer):</strong> 每隻小羊每天最多 <strong>3 次</strong> (每次恢復 <strong>+6 負擔</strong>)。</li>
                        <li><strong>負擔 (Burden):</strong> 每次禱告恢復負擔，代表對靈魂的負擔與關愛。</li>
                        <li><strong>生命三階段 (負擔指數):</strong>
                            <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', margin: '5px 0', fontSize: '0.85rem' }}>
                                🍂 <strong>虛弱 (Weak):</strong> 負擔 &lt; 40，小羊看起來無精打采。<br />
                                🐑 <strong>健康 (Healthy):</strong> 負擔 40-79，精神飽滿的樣子。<br />
                                💪 <strong>強壯 (Strong):</strong> 負擔 &ge; 80，長出羊角，強壯有力！
                            </div>
                        </li>
                    </ul>

                    <h4>2. 離線與自然衰退</h4>
                    <p>即使不在線上，時間仍在流動：</p>
                    <ul>
                        <li><strong>離線機制:</strong> 負擔會自然流失 (每天約 <strong>13%</strong>)。</li>
                        <li><strong>狀態影響:</strong> 生病或受傷流失更快 (每天約 <strong>17-20%</strong>)。</li>
                    </ul>

                    <h4>3. 死亡與復活 (Miracle)</h4>
                    <p>死亡不是終點，信心能喚回生命：</p>
                    <ul>
                        <li><strong>墓碑:</strong> 小羊死亡後會化為墓碑，您可以修改墓誌銘與追憶。</li>
                        <li><strong>復活儀式:</strong> 連續 <strong>5 天</strong> 進行「迫切認領禱告」(每天1次)。</li>
                        <li><strong>奇蹟:</strong> 第 5 次禱告後，小羊將復活！(保留姓名與靈程，重置為健康小羊)。</li>
                        <li><strong>中斷歸零:</strong> 若中斷一天沒禱告，進度將歸零重來。</li>
                    </ul>

                    <h4>4. 靈程與資料管理</h4>
                    <ul>
                        <li><strong>靈程 (Maturity):</strong> 可設定小羊的屬靈階段 (新朋友/慕道友/基督徒...)。</li>
                        <li><strong>使用說明:</strong> 請使用 LINE 帳號登入，系統會自動備份您的羊群資料。</li>
                    </ul>

                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                        <em>"信心若沒有行為就是死的。"</em>
                    </p>
                </div>

                <div className="editor-actions">
                    <button className="save-btn" onClick={onClose}>我瞭解了</button>
                </div>
            </div>
        </div>
    );
};
