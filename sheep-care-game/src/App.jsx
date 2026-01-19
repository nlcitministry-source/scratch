
import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';
import { Controls } from './components/Controls';
import { DebugEditor } from './components/DebugEditor';
import { Guide } from './components/Guide';
import { Login } from './components/Login';
import { SheepList } from './components/SheepList';
import './App.css';

function App() {
  const { currentUser, message, isLoading } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showList, setShowList] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // 3. Reset state when user changes
  useEffect(() => {
    setSelectedSheepId(null);
    setShowList(false);
    setShowGuide(false);
    setIsControlsCollapsed(false);
  }, [currentUser]);

  // 0. Global Loading (Prevent empty blue screen during sync)
  if (isLoading) {
    console.log("App Rendering: Loading State");
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: '#f0faff', color: '#555'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
        <h2>正在同步羊群資料... (v1.1)</h2>
        <p>Connecting to Cloud...</p>
      </div>
    );
  }

  // 1. Not Logged In -> Show Login Screen
  if (!currentUser) {
    return <Login />;
  }

  // 2. Logged In -> Show Game
  const handleSelectSheep = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  const handleSelectFromList = (sheep) => {
    // setShowList(false); // Changed: Keep list open in background to preserve scroll positions
    setSelectedSheepId(sheep.id);
  };

  return (
    <div className="game-container" key={currentUser}>
      {message && <div className="toast-message">{message}</div>}

      {/* Help Button */}
      <button
        className="icon-btn"
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 100,
          width: '40px', height: '40px', fontSize: '1.5rem', opacity: 1
        }}
        onClick={() => setShowGuide(true)}
      >
        📖
      </button>

      <Field onSelectSheep={handleSelectSheep} />

      <Controls
        onOpenList={() => setShowList(true)}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={() => setIsControlsCollapsed(!isControlsCollapsed)}
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
          onClose={() => {
            setSelectedSheepId(null);
            // setShowList(true); // Changed: Don't force list open, rely on existing state
          }}
        />
      )}

      {showGuide && (
        <Guide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

export default App;
