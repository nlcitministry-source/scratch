import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';
import { Controls } from './components/Controls';
import { DebugEditor } from './components/DebugEditor';
import { Guide } from './components/Guide';
import { Login } from './components/Login';
import { NicknameSetup } from './components/NicknameSetup';
import { SheepList } from './components/SheepList';
import { SettingsModal } from './components/SettingsModal';
import { SkinManager } from './components/SkinManager';
import { UserProfile } from './components/UserProfile';
import { AdminWeatherControl } from './components/AdminWeatherControl';
import './App.css';

function App() {
  const { currentUser, message, isLoading, nickname, notificationEnabled, toggleNotification, sheep, isAdmin } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkinManager, setShowSkinManager] = useState(false);

  // Reset state when user changes
  useEffect(() => {
    setSelectedSheepId(null);
    setShowList(false);
    setShowGuide(false);
    setShowSettings(false);
    setShowSkinManager(false);
  }, [currentUser]);

  // 0. Global Loading
  if (isLoading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)',
        color: '#555',
        position: 'fixed', top: 0, left: 0, zIndex: 9999
      }}>
        <div className="spinner" style={{
          fontSize: '3rem', marginBottom: '20px',
          animation: 'spin 1.5s linear infinite'
        }}>⏳</div>
        <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <h2 style={{ marginBottom: '10px', color: '#444' }}>正在同步羊群資料...</h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>正在從雲端牧場接回您的小羊</p>
      </div>
    );
  }

  // 1. Not Logged In
  if (!currentUser) {
    return <Login />;
  }

  // 1.5. No Nickname
  if (!nickname) {
    return <NicknameSetup />;
  }

  // 2. Main Game
  const handleSelectSheep = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  const handleSelectFromList = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  return (
    <div className="game-container" key={currentUser}>
      {message && <div key={message} className="toast-message">{message}</div>}

      {/* --- Unified Top Left Widget --- */}
      <UserProfile />
      <AdminWeatherControl />

      {/* --- HUD: Top Right System Buttons --- */}
      <div className="hud-right">
        {/* Bell */}
        <button
          className="hud-btn"
          style={{ background: notificationEnabled ? '#fff' : '#eee' }}
          onClick={toggleNotification}
          title={notificationEnabled ? "關閉提醒" : "開啟提醒"}
        >
          {notificationEnabled ? '🔔' : '🔕'}
        </button>

        {/* Guide */}
        <button
          className="hud-btn"
          onClick={() => setShowGuide(true)}
        >
          📖
        </button>

        {/* Display Settings (Sheep Count) */}
        <button
          className="hud-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>

        {/* Admin Skin Manager Button */}
        {isAdmin && (
          <button
            className="hud-btn"
            style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}
            onClick={() => setShowSkinManager(true)}
            title="皮膚管理"
          >
            🎨
          </button>
        )}
      </div>

      <Field onSelectSheep={handleSelectSheep} />

      <Controls
        onOpenList={() => setShowList(true)}
      />

      {/* Modals */}
      {showList && (
        <SheepList
          onSelect={handleSelectFromList}
          onClose={() => setShowList(false)}
        />
      )}

      {selectedSheepId && (
        <DebugEditor
          selectedSheepId={selectedSheepId}
          onClose={() => setSelectedSheepId(null)}
        />
      )}

      {showGuide && (
        <Guide onClose={() => setShowGuide(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showSkinManager && (
        <SkinManager onClose={() => setShowSkinManager(false)} />
      )}
    </div>
  );
}

export default App;
