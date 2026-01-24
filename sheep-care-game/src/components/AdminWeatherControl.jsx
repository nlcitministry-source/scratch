import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminWeatherControl = () => {
    const { isAdmin, weather, setWeather } = useGame();
    const [isOpen, setIsOpen] = useState(false);

    if (!isAdmin) return null;

    const handleWeatherChange = (type) => {
        setWeather(prev => ({ ...prev, type }));
    };

    const toggleDayNight = () => {
        setWeather(prev => ({ ...prev, isDay: !prev.isDay }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: '200px', // Adjusted to avoid HUD-Right buttons
            right: '20px', // Moved to Right
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                {isOpen ? 'Close Weather Control' : '🌤️ Weather Control'}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            padding: '15px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            minWidth: '200px'
                        }}
                    >
                        {/* Day/Night Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                            <span>Mode: {weather.isDay ? 'Day ☀️' : 'Night 🌙'}</span>
                            <button
                                onClick={toggleDayNight}
                                style={{
                                    padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
                                    border: 'none', background: weather.isDay ? '#FFD54F' : '#5C6BC0', color: 'white'
                                }}
                            >
                                Toggle
                            </button>
                        </div>

                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', width: '100%' }} />

                        {/* Weather Types */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <WeatherBtn label="Sunny ☀️" type="sunny" active={weather.type === 'sunny'} onClick={() => handleWeatherChange('sunny')} />
                            <WeatherBtn label="Cloudy ☁️" type="cloudy" active={weather.type === 'cloudy'} onClick={() => handleWeatherChange('cloudy')} />
                            <WeatherBtn label="Rain 🌧️" type="rain" active={weather.type === 'rain'} onClick={() => handleWeatherChange('rain')} />
                            <WeatherBtn label="Store ⛈️" type="storm" active={weather.type === 'storm'} onClick={() => handleWeatherChange('storm')} />
                            <WeatherBtn label="Snow ❄️" type="snow" active={weather.type === 'snow'} onClick={() => handleWeatherChange('snow')} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const WeatherBtn = ({ label, type, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '8px',
            borderRadius: '8px',
            border: active ? '2px solid #64B5F6' : '1px solid rgba(255,255,255,0.2)',
            background: active ? 'rgba(33, 150, 243, 0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85rem'
        }}
    >
        {label}
    </button>
);
