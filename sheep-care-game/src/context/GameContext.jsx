
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SHEEP_TYPES } from '../data/sheepData';
import { sanitizeSheep, calculateTick, generateVisuals, getSheepMessage } from '../utils/gameLogic';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const GameProvider = ({ children }) => {
    // const API_URL = import.meta.env.VITE_API_URL; // Deprecated
    const LIFF_ID = "2008919632-15fCJTqb";

    // --- Session Init (SessionStorage for Auto-Logout on Close) ---
    const [currentUser, setCurrentUser] = useState(null); // Line Name
    const [nickname, setNickname] = useState(null); // User Nickname
    const [lineId, setLineId] = useState(null); // Line User ID
    const [isLoading, setIsLoading] = useState(true);

    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const getLocalData = (key, fallback) => {
        // We only load data if we have a valid session user
        const storedUser = sessionStorage.getItem('sheep_current_session'); // store LineID now? Or name? Let's store LineID.
        if (storedUser) {
            const cache = sessionStorage.getItem(`sheep_game_data_${storedUser}`);
            if (cache) {
                try { return JSON.parse(cache)[key] || fallback; } catch (e) { }
            }
        }
        return fallback;
    };

    const [sheep, setSheep] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState(null);
    const [weather, setWeather] = useState({ type: 'sunny', isDay: true, temp: 25 });

    // ... (Location state omitted for brevity, logic unchanged) ...

    // User Location State (Persisted in LocalStorage - Device Preference)
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('sheep_user_location');
        return saved ? JSON.parse(saved) : { name: 'Taipei', lat: 25.0330, lon: 121.5654 };
    });

    // Save location changes
    useEffect(() => {
        localStorage.setItem('sheep_user_location', JSON.stringify(location));
    }, [location]);

    const updateUserLocation = async (cityName) => {
        const importWeather = await import('../utils/weatherService');
        const result = await importWeather.searchCity(cityName);
        if (result) {
            setLocation(result);
            showMessage(`所在地已更新為: ${result.name}`);
            return true;
        } else {
            showMessage("找不到該城市，請重試！");
            return false;
        }
    };

    // Weather Fetch Loop
    useEffect(() => {
        const fetchWeather = async () => {
            const importWeather = await import('../utils/weatherService');
            const w = await importWeather.getWeather(location.lat, location.lon);
            setWeather(w);
            setGlobalMessage(`當地天氣 (${location.name}): ${w.type === 'snow' ? '下雪中 ❄️' : (w.type === 'rain' ? '下雨中 🌧️' : (w.type === 'cloudy' ? '多雲 ☁️' : '晴朗 ☀️'))} (${w.temp}°C)`);
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000);
        return () => clearInterval(interval);
    }, [location]);

    const setGlobalMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 5000);
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    // --- Session Restoration (Fix for Refresh) ---
    useEffect(() => {
        const storedUserId = sessionStorage.getItem('sheep_current_session');
        if (storedUserId) {
            const cachedData = sessionStorage.getItem(`sheep_game_data_${storedUserId}`);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    console.log("Restoring session:", parsed);

                    setLineId(storedUserId);
                    setSheep(parsed.sheep || []);
                    setInventory(parsed.inventory || []);
                    setNickname(parsed.nickname || null);
                    setIsDataLoaded(true); // MARK: Local restore success

                    // Fallback name logic
                    if (parsed.name) setCurrentUser(parsed.name);
                    else if (storedUserId === 'admin') setCurrentUser('Admin');
                    else setCurrentUser('Unknown'); // Should trigger login if null, but we want to avoid that if possible

                    setIsLoading(false); // Stop loading screen if restored
                } catch (e) {
                    console.error("Failed to restore session", e);
                }
            }
        }
    }, []);

    // --- LIFF & Login Logic ---
    useEffect(() => {
        const initLiff = async () => {
            try {
                if (window.liff) {
                    await window.liff.init({ liffId: LIFF_ID });
                    if (window.liff.isLoggedIn()) {
                        const profile = await window.liff.getProfile();
                        handleLoginSuccess(profile);
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    console.error("LIFF SDK not found");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("LIFF Init Error", error);
                setIsLoading(false);
            }
        };
        initLiff();
    }, []);

    const loginWithLine = () => {
        // Localhost Bypass
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const mockProfile = {
                userId: 'admin', // Fixed ID for Admin
                displayName: 'Admin',
                pictureUrl: ''
            };
            handleLoginSuccess(mockProfile);
            return;
        }

        if (!window.liff) {
            showMessage("LIFF SDK 未載入");
            return;
        }
        if (!window.liff.isLoggedIn()) {
            window.liff.login();
        }
    };

    const handleLoginSuccess = async (profile) => {
        const { userId, displayName, pictureUrl } = profile;
        // userId, displayName are from LINE
        setLineId(userId);
        setCurrentUser(displayName);
        sessionStorage.setItem('sheep_current_session', userId); // Store LineID as session key

        showMessage(`設定羊群中... (Hi, ${displayName})`);

        // Sync with Supabase (Login/Register)
        try {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) results returned (No rows found)
                throw fetchError;
            }

            if (existingUser) {
                // Existing User
                const loaded = existingUser.game_data || {};
                const diff = applyLoadedData(loaded, userId);

                // Restore nickname from DB
                if (existingUser.nickname) setNickname(existingUser.nickname);
                else setNickname(null);

                setIsDataLoaded(true); // MARK: Cloud load success

                if (diff > 12) showMessage(`✨ ${getSheepMessage('login')} (離開 ${Math.round(diff)} 小時)`);
                else if (diff > 1) showMessage(`您離開了 ${Math.round(diff)} 小時，羊群狀態更新了...`);
                else showMessage(`歡迎回來，${existingUser.nickname || displayName}! 👋`);
            } else {
                // New User - Insert
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        name: displayName,
                        avatar: pictureUrl,
                        nickname: null,
                        game_data: {}
                    }]);

                if (insertError) throw insertError;

                showMessage("歡迎新加入的牧羊人！ 🎉");
                setSheep([]); setInventory([]);
                setNickname(null);
                setIsDataLoaded(true); // MARK: New User success
            }
        } catch (e) {
            alert(`⚠️ Connection Error: ${e.message}`);
            showMessage("⚠️ 連線失敗 (Cloud Sync)");
            console.error(e);
            // DO NOT set isDataLoaded(true) here
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await saveToCloud();
        if (window.liff && window.liff.isLoggedIn()) {
            window.liff.logout();
        }
        setCurrentUser(null);
        setNickname(null);
        setLineId(null);
        sessionStorage.removeItem('sheep_current_session');
        if (lineId) sessionStorage.removeItem(`sheep_game_data_${lineId}`);
        setSheep([]); setInventory([]);
        setIsDataLoaded(false); // Reset
        window.location.reload();
    };


    // Helper for applying loaded data + decay
    const applyLoadedData = (loadedData, targetUser) => {
        const now = Date.now();
        const lastSave = loadedData.lastSave || now;
        const diffHours = (now - lastSave) / (1000 * 60 * 60);

        // Deduplicate Logic: ensure all IDs are unique
        const seenIds = new Set();
        const decaySheep = (loadedData.sheep || [])
            .map(s => {
                if (seenIds.has(s.id)) {
                    // Collision found! generate new ID
                    const newId = `${s.id}_${Math.random().toString(36).substr(2, 5)}`;
                    return { ...s, id: newId };
                }
                seenIds.add(s.id);
                return s;
            })
            .filter(s => s && s.type && SHEEP_TYPES[s.type])
            .map(s => {
                if (s.status === 'dead') return s;

                // Decay Logic
                let ratePerHour = 0.541;
                if (s.status === 'sick') ratePerHour = 0.833;
                else if (s.status === 'injured') ratePerHour = 0.708;

                const decayAmount = diffHours * ratePerHour;

                let newHealth = Math.max(0, s.health - decayAmount);
                let newStatus = s.status;
                let newType = s.type;
                let newCare = s.careLevel;

                if (newHealth <= 0) {
                    newStatus = 'dead'; newHealth = 0;
                } else if (newHealth < 50 && s.status === 'healthy' && Math.random() < 0.5) newStatus = 'sick';

                return sanitizeSheep({ ...s, health: newHealth, status: newStatus, type: newType, careLevel: newCare });
            });

        setSheep(decaySheep);
        setInventory(loadedData.inventory || []);

        // Cache Locally
        if (targetUser) {
            sessionStorage.setItem(`sheep_game_data_${targetUser}`, JSON.stringify({
                sheep: decaySheep,
                inventory: loadedData.inventory || [],
                lastSave: now
            }));
        }

        return diffHours;
    };

    const saveToCloud = async (overrides = {}) => {
        if (!lineId) return;
        if (!isDataLoaded) {
            console.warn("Skipping save: Data not fully loaded.");
            return;
        }

        const currentData = {
            sheep,
            inventory,
            lastSave: Date.now()
        };

        // Determnie nickname to save
        const nicknameToSave = overrides.nickname !== undefined ? overrides.nickname : nickname;

        sessionStorage.setItem(`sheep_game_data_${lineId}`, JSON.stringify({
            ...currentData,
            nickname: nicknameToSave,
            name: currentUser
        }));

        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    id: lineId,
                    game_data: currentData,
                    nickname: nicknameToSave,
                    name: currentUser, // Ensure name is updated
                    last_login: new Date().toISOString()
                });

            if (error) throw error;
            console.log("Auto-save success via Supabase");
        } catch (e) { console.error("Auto-save failed", e); }
    };

    const forceLoadFromCloud = async () => {
        if (!lineId) {
            showMessage("⚠️ 無法連線：使用者未登入");
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').eq('id', lineId).single();
            if (error) throw error;
            if (data && data.game_data) {
                applyLoadedData(data.game_data, lineId);
                // Also update nickname if changed in DB
                if (data.nickname) setNickname(data.nickname);
                setIsDataLoaded(true);
                showMessage("✅ 雲端資料讀取成功！(已覆蓋本地進度)");
            } else {
                showMessage("⚠️ 雲端無資料可讀取");
            }
        } catch (e) {
            console.error(e);
            showMessage("❌ 讀取失敗：" + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-Save Logic
    useEffect(() => {
        if (!lineId) return;
        const handleUnload = () => { saveToCloud(); };
        window.addEventListener('beforeunload', handleUnload);
        const timeoutId = setTimeout(() => { saveToCloud(); }, 2000);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [sheep, inventory, lineId]);

    // Game Loop
    useEffect(() => {
        if (!lineId) return;
        const tick = setInterval(() => {
            setSheep(prev => prev.filter(s => s).map(s => {
                const updated = calculateTick(s);
                if (updated.status === 'dead' && s.status !== 'dead') {
                    showMessage(`🕊️ ${s.name} 不幸離世了...`);
                }
                return updated;
            }));
        }, 100);
        return () => clearInterval(tick);
    }, [lineId]);

    // Actions
    const adoptSheep = (data = {}) => {
        const { name = '小羊', spiritualMaturity = '' } = data;
        const newSheep = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name, type: 'LAMB',
            spiritualMaturity,
            careLevel: 0, health: 100, strength: 0, status: 'healthy',
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0,
            visual: generateVisuals(),
            x: Math.random() * 90 + 5, y: Math.random() * 90 + 5,
            angle: Math.random() * Math.PI * 2, direction: 1
        };
        setSheep(prev => [...prev, newSheep]);
    };

    const updateSheep = (id, updates) => {
        setSheep(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const isAdmin = lineId === 'admin';

    const prayForSheep = (id) => {
        const today = new Date().toDateString();
        setSheep(prev => prev.map(s => {
            if (s.id !== id) return s;
            if (s.status === 'dead') {
                const todayDate = new Date(today);
                const lastDate = s.lastPrayedDate ? new Date(s.lastPrayedDate) : null;
                let diffDays = -1;
                if (lastDate) {
                    diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                }
                const isContinuous = diffDays === 1 || diffDays === -1;

                // Admin Bypass: Allow unlimited resurrection progress per day if needed? 
                // User requirement said "Unlimited Prayers", usually implies the daily limit.
                // Let's allow Admin to spam resurrection too if they want
                if (!isAdmin && diffDays === 0) {
                    showMessage("今天已經為這隻小羊禱告過了，請明天再來！🙏");
                    return s;
                }

                let newProgress = (isContinuous || isAdmin) ? (s.resurrectionProgress || 0) + 1 : 1;

                if (newProgress >= 5) {
                    showMessage(`✨ 奇蹟發生了！${s.name} 復活了！`);
                    return {
                        ...s, status: 'healthy', health: 100, type: 'LAMB', careLevel: 0,
                        resurrectionProgress: 0, lastPrayedDate: today, prayedCount: 0
                    };
                } else {
                    const statusMsg = (!isAdmin && diffDays > 1) ? "禱告中斷了，重新開始..." : "迫切認領禱告進行中...";
                    showMessage(`🙏 ${statusMsg} (${newProgress}/5)`);
                    return { ...s, resurrectionProgress: newProgress, lastPrayedDate: today };
                }
            }

            let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
            if (!isAdmin && count >= 3) {
                showMessage("這隻小羊今天已經接受過 3 次禱告了，讓牠休息一下吧！🙏");
                return s;
            }
            const newHealth = Math.min(100, s.health + 6);
            const newStatus = (s.status !== 'healthy') ? 'healthy' : s.status;
            const newCare = s.careLevel + 10;
            // Type is handled in calculateTick based on health
            let newType = s.type;

            return {
                ...s, status: newStatus, health: newHealth, type: newType, careLevel: newCare,
                lastPrayedDate: today, prayedCount: count + 1
            };
        }));
    };

    const shepherdSheep = (id) => { };
    const deleteSheep = (id) => { setSheep(prev => prev.filter(s => s.id !== id)); };
    const registerUser = () => { }; // Deprecated
    const loginUser = () => { }; // Deprecated

    const updateNickname = (name) => {
        setNickname(name);
        saveToCloud({ nickname: name }); // Pass override to ensure immediate save
    };

    return (
        <GameContext.Provider value={{
            currentUser, lineId, isLoading, sheep, inventory, message, weather, location, nickname,
            adoptSheep, prayForSheep, shepherdSheep, updateSheep, deleteSheep, updateUserLocation,
            loginWithLine, logout, saveToCloud, updateNickname, forceLoadFromCloud, isAdmin
        }}>
            {children}
        </GameContext.Provider>
    );
};
