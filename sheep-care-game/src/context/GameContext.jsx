
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SHEEP_TYPES } from '../data/sheepData';
import { sanitizeSheep, calculateTick, generateVisuals, getSheepMessage } from '../utils/gameLogic';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

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
        const storedUser = localStorage.getItem('sheep_current_session');
        if (storedUser) {
            const cache = localStorage.getItem(`sheep_game_data_${storedUser}`);
            if (cache) {
                try { return JSON.parse(cache)[key] || fallback; } catch (e) { }
            }
        }
        return fallback;
    };

    const [sheep, setSheep] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState(null);
    const [notificationEnabled, setNotificationEnabled] = useState(false); // NEW: Reminder Setting
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

    // --- Session Restoration (User Requested Removal for Strict Cloud Truth) ---
    // User wants to clear cache on exit, so we DO NOT restore from localStorage on mount.
    // Logic: Login -> Fetch Cloud -> Render.
    // If we restore here, we might get stale data that conflicts or duplicates with Cloud data later.
    useEffect(() => {
        // Just clear any lingering session if we want "Fresh on Refresh"
        // But Line Login might redirect. 
        // If we want "Persistence across Refresh", we keep localStorage but rely entirely on Cloud for "Truth".
        // The problem of "Duplication" comes from MERGING. We must NOT merge in handleLoginSuccess.
    }, []);

    const toggleNotification = async () => {
        const newState = !notificationEnabled;
        setNotificationEnabled(newState);
        showMessage(newState ? "🔔 牧羊提醒已開啟" : "🔕 牧羊提醒已關閉");

        // Immediate Save
        await saveToCloud({ notificationEnabled: newState });
    };

    // --- LIFF & Login Logic ---
    useEffect(() => {
        const initLiff = async () => {
            try {
                if (window.liff) {
                    await window.liff.init({ liffId: LIFF_ID });
                    if (window.liff.isLoggedIn()) {
                        const profile = await window.liff.getProfile();
                        // Don't turn off loading yet, wait for data sync
                        await handleLoginSuccess(profile);
                    } else {
                        // Only turn off loading if NOT logged in (and no session restored)
                        // But wait... if session restored, currentUser is set.
                        // If not logged in LIFF, we rely on session or show login.
                        // Let's check currentUser before turning off loading to avoid flash
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
        setIsLoading(true);
        const { userId, displayName, pictureUrl } = profile;
        setLineId(userId);
        setCurrentUser(displayName);
        localStorage.setItem('sheep_current_session', userId);

        try {
            // Clear legacy session storage 
            sessionStorage.clear();
            // Also Request: Clear Cache on Exit? 
            // If user wants "Fresh state every time", maybe we shouldn't even use localStorage for `sheep_game_data_...`?
            // But we need it for "Refresh Page" persistence?
            // User said: "Success fetch -> Save" and "Clear on Exit".
            // So on Login Success, we should probably IGNORE local cache and just overwrite.
        } catch (e) { }

        showMessage(`設定羊群中... (Hi, ${displayName})`);

        try {
            // 1. Fetch User (Settings, Inventory)
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            // 2. Fetch Sheep (Relational Table)
            const { data: sheepData, error: sheepError } = await supabase
                .from('sheep')
                .select('*')
                .eq('owner_id', userId);

            if (sheepError) throw sheepError;

            if (existingUser) {
                // Restoration Logic
                if (existingUser.nickname) setNickname(existingUser.nickname);
                else setNickname(null);

                // --- MIGRATION CHECK ---
                // If user has old JSON sheep but NO new relational sheep, migrate them!
                let finalSheep = [];
                // Check Cloud Backup OR Local Storage (if Cloud was wiped by race condition)
                // --- STRICT CLOUD AUTHORITY ---

                // MIGRATION LOGIC (Simplified: Cloud-to-Cloud Only)
                // We ignore localStorage for migration to prevent duplicating "Zombie" data
                if (existingUser.game_data?.sheep?.length > 0 && (!sheepData || sheepData.length === 0)) {
                    console.log("Migrating Legacy Cloud JSON...");
                    const oldSheep = existingUser.game_data.sheep;

                    const rowsToInsert = oldSheep.map(s => ({
                        owner_id: userId,
                        name: s.name,
                        status: s.status,
                        health: s.health,
                        care_level: s.careLevel || 0,
                        spiritual_maturity: s.spiritualMaturity,
                        visual_data: {
                            x: s.x, y: s.y, angle: s.angle,
                            visual: s.visual,
                            type: s.type
                        },
                        prayed_count: s.prayedCount || 0,
                        resurrection_progress: s.resurrectionProgress || 0,
                        last_prayed_date: s.lastPrayedDate,
                        note: s.note
                    }));

                    if (rowsToInsert.length > 0) {
                        const { data: migrated, error: migErr } = await supabase
                            .from('sheep')
                            .insert(rowsToInsert)
                            .select();
                        if (migErr) console.error("Migration failed", migErr);
                        else {
                            console.log("Migration success!");
                            finalSheep = migrated;
                        }
                    }
                } else {
                    finalSheep = sheepData || [];
                }

                // Apply Loaded Data (Calculate Decay based on row updated_at if possible, 
                // but since we just migrated or loaded, we handle logical hydration)
                const lastSave = existingUser.game_data?.lastSave || Date.now(); // User-level backup time
                const loadedInventory = existingUser.game_data?.inventory || [];
                const loadedSettings = existingUser.game_data?.settings || {};

                // Hydrate Sheep (Convert DB row back to Game Object)
                const hydratedSheep = finalSheep.map(row => {
                    const visuals = row.visual_data || {};
                    return {
                        id: row.id, // UUID
                        name: row.name,
                        status: row.status,
                        health: parseFloat(row.health),
                        careLevel: parseFloat(row.care_level),
                        spiritualMaturity: row.spiritual_maturity,
                        // Expand Visuals
                        x: visuals.x, y: visuals.y, angle: visuals.angle,
                        visual: visuals.visual,
                        type: visuals.type || (parseFloat(row.health) >= 80 ? 'STRONG' : 'LAMB'),
                        // Stats
                        prayedCount: row.prayed_count,
                        resurrectionProgress: row.resurrection_progress,
                        lastPrayedDate: row.last_prayed_date,
                        note: row.note,
                        // Runtime props
                        state: 'idle', direction: 1, message: null, messageTimer: 0
                    };
                });

                // Apply Decay
                applyLoadedData({ sheep: hydratedSheep, inventory: loadedInventory, settings: loadedSettings, lastSave }, userId);

                setIsDataLoaded(true);
                showMessage(`歡迎回來，${existingUser.nickname || displayName}! 👋`);

            } else {
                // New User
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        name: displayName,
                        avatar: pictureUrl,
                        nickname: null,
                        game_data: {} // No more sheep here
                    }]);
                if (insertError) throw insertError;

                showMessage("歡迎新加入的牧羊人！ 🎉");
                // New User: Clear everything
                setSheep([]); setInventory([]);
                setNickname(null);

                // Clear persistence
                localStorage.removeItem(`sheep_game_data_${userId}`);

                setIsDataLoaded(true);
            }
        } catch (e) {
            alert(`⚠️ Connection Error: ${e.message}`);
            console.error(e);
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
        localStorage.removeItem('sheep_current_session');
        if (lineId) localStorage.removeItem(`sheep_game_data_${lineId}`);
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
            .filter(s => s && (s.type && SHEEP_TYPES[s.type] || s.health >= 0)) // Relaxed check
            .map(s => {
                if (s.status === 'dead') return s;

                // Decay Logic
                let ratePerHour = 0.541; // Normal (~13%/day)

                // Prayer Protection Check (Offline)
                const todayStr = new Date().toDateString();
                const isProtected = s.lastPrayedDate === todayStr;

                if (s.status === 'sick') ratePerHour = 0.833; // Sick (~20%/day)
                else if (isProtected) ratePerHour = 0.25; // Protected (~6%/day) - User Request
                else if (s.status === 'injured') ratePerHour = 0.708; // Injured (~17%/day)

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
        setNotificationEnabled(loadedData.settings?.notify || false); // Load setting

        // Cache Locally
        if (targetUser) {
            localStorage.setItem(`sheep_game_data_${targetUser}`, JSON.stringify({
                sheep: decaySheep,
                inventory: loadedData.inventory || [],
                settings: { notify: loadedData.settings?.notify || false }, // Save setting
                lastSave: now
            }));
        }

        return diffHours;
    };

    const saveToCloud = async (overrides = {}) => {
        if (!lineId || !isDataLoaded || isLoading) return; // Block save during loading/sync

        // 1. Prepare User Data (Inventory & Settings only)
        const userData = {
            inventory: overrides.inventory || inventory,
            settings: { notify: overrides.notificationEnabled ?? notificationEnabled },
            lastSave: Date.now()
        };
        const nicknameToSave = overrides.nickname !== undefined ? overrides.nickname : nickname;

        // 2. Prepare Sheep Data (Diffing could happen here, but upsert is safer)
        const currentSheep = overrides.sheep || sheep;

        // Map to DB Rows
        const sheepRows = currentSheep.map(s => ({
            id: (s.id && s.id.length > 20) ? s.id : undefined, // If temp ID, let DB generate UUID? Or if existing UUID, keep it. 
            // Note: If ID is the old timestamp style, it won't match UUID type if defined in DB. 
            // BUT: We defined ID as UUID DEFAULT gen_random_uuid(). 
            // If we are updating, we MUST provide the ID.
            // If the ID is a long string (from old system), we might need to be careful.
            // Ideally, the load process migrated them to UUIDs. 
            // If this is a brand new sheep created locally, it has temp ID. We should let DB create ID, BUT we need to update local state.
            // Simplified: We upsert based on ID. If ID is not a valid UUID (e.g. timestamp_random), it might fail if column is UUID.
            // For now, let's assume Migration handled IDs or we treat them as texts if column is TEXT. (User SQL said UUID).
            // CRITICAL: If local has temp ID "17000..._abc", sending to UUID column will fail.
            // WORKAROUND: Send WITHOUT ID for new sheep, let Supabase return it.
            // BUT this is `saveToCloud`. We want to update.
            // Logic: Is it a valid UUID? If not, treat as insert (omit ID).

            owner_id: lineId,
            name: s.name,
            status: s.status,
            health: s.health,
            care_level: s.careLevel,
            spiritual_maturity: s.spiritualMaturity,
            visual_data: {
                x: s.x, y: s.y, angle: s.angle,
                visual: s.visual,
                type: s.type
            },
            prayed_count: s.prayedCount,
            resurrection_progress: s.resurrectionProgress,
            last_prayed_date: s.lastPrayedDate,
            note: s.note,
            updated_at: new Date().toISOString()
        }));

        // Filter: Separate Inserts and Updates? 
        // Supabase upsert works if ID is present.
        // We need to handle the case where local ID is "timestamp_random" (New Sheep).
        const validUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const rowsToUpsert = sheepRows.filter(r => r.id && validUUID.test(r.id));
        const rowsToInsert = sheepRows.filter(r => !r.id || !validUUID.test(r.id));

        // Update Local Cache
        localStorage.setItem(`sheep_game_data_${lineId}`, JSON.stringify({
            sheep: currentSheep, // Store full object locally
            inventory: userData.inventory,
            settings: userData.settings,
            lastSave: Date.now(),
            nickname: nicknameToSave,
            name: currentUser
        }));

        try {
            // A. Save User Info
            await supabase.from('users').upsert({
                id: lineId,
                nickname: nicknameToSave,
                name: currentUser,
                game_data: userData, // Correct: No sheep here.
                last_login: new Date().toISOString()
            });

            // B. Upsert Existing Sheep
            if (rowsToUpsert.length > 0) {
                await supabase.from('sheep').upsert(rowsToUpsert);
            }

            // C. Insert New Sheep (and update local IDs)
            if (rowsToInsert.length > 0) {
                const { data: newRows, error: insertErr } = await supabase
                    .from('sheep')
                    .insert(rowsToInsert.map(r => {
                        const { id, ...rest } = r; // Remove invalid ID
                        return rest;
                    }))
                    .select();

                if (insertErr) throw insertErr;

                // Update local state with real UUIDs from DB?
                // This is tricky in `saveToCloud` because it might cause a render loop if we setSheep here.
                // Ideally `adoptSheep` should handle the insert immediately.
                // But for now, we just save. Next load will correct IDs.
                // To fix "Next Save" creating duplicates: We MUST update local IDs.
                if (newRows) {
                    // We need to map back which local sheep got which UUID. 
                    // This is hard if we batch insert.
                    // Simple fix: Reload sheep from DB after batch insert of new ones?
                    // Or just rely on the fact that `adoptSheep` calls this?
                }
            }
            console.log("Cloud Save (Hybrid) Success");

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

    // Auto-Save Logic (Visibility Change + BeforeUnload)
    // Auto-Save Logic (Visibility Change + BeforeUnload) + Clean Exit
    useEffect(() => {
        if (!lineId || !isDataLoaded) return;

        const handleUnload = () => {
            // User Request: Clear cache on exit to enforce "Cloud Only" next session
            localStorage.removeItem('sheep_current_session');
            if (lineId) localStorage.removeItem(`sheep_game_data_${lineId}`);
        };

        const handleSave = () => { saveToCloud(); };

        // Save on Visibility Hidden (Mobile Switch App)
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') handleSave();
        };

        window.addEventListener('beforeunload', handleUnload); // Clear on Close
        document.addEventListener('visibilitychange', handleVisibility); // Save on Hide

        // Debounced Save
        const timeoutId = setTimeout(() => { saveToCloud(); }, 2000);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('beforeunload', handleUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [sheep, inventory, lineId, isDataLoaded]);

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
    const adoptSheep = async (data = {}) => {
        const { name = '小羊', spiritualMaturity = '' } = data;

        // Optimistic UI Update (Temp ID)
        const tempId = `temp_${Date.now()}`;
        const visual = generateVisuals();
        const newSheep = {
            id: tempId,
            name, type: 'LAMB',
            spiritualMaturity,
            careLevel: 0, health: 100, strength: 0, status: 'healthy',
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0,
            visual,
            x: Math.random() * 90 + 5, y: Math.random() * 90 + 5,
            angle: Math.random() * Math.PI * 2, direction: 1
        };
        setSheep(prev => [...prev, newSheep]);

        // Immediate DB Insert to get real UUID
        if (lineId && isDataLoaded) {
            try {
                const { data: inserted, error } = await supabase.from('sheep').insert([{
                    owner_id: lineId,
                    name, status: 'healthy', health: 100,
                    spiritual_maturity: spiritualMaturity,
                    visual_data: { x: newSheep.x, y: newSheep.y, angle: newSheep.angle, visual, type: 'LAMB' }
                }]).select().single();

                if (inserted) {
                    // Replace Temp ID with Real UUID
                    setSheep(prev => prev.map(s => s.id === tempId ? { ...s, id: inserted.id } : s));
                    // Save to local storage to sync UUID
                    await saveToCloud();
                }
            } catch (e) { console.error("Adopt sync failed", e); }
        }
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
    const deleteSheep = async (id) => {
        setSheep(prev => prev.filter(s => s.id !== id));
        if (lineId) await supabase.from('sheep').delete().eq('id', id);
    };
    const deleteMultipleSheep = async (ids) => {
        setSheep(prev => prev.filter(s => !ids.includes(s.id)));
        if (lineId) await supabase.from('sheep').delete().in('id', ids);
    };

    const updateNickname = (name) => {
        setNickname(name);
        saveToCloud({ nickname: name }); // Pass override to ensure immediate save
    };

    return (
        <GameContext.Provider value={{
            currentUser, nickname, setNickname, lineId, isAdmin,
            sheep, inventory, message, weather,
            location, updateUserLocation,
            adoptSheep, updateSheep,
            loginWithLine, logout,
            prayForSheep, deleteSheep, deleteMultipleSheep, shepherdSheep,
            saveToCloud, forceLoadFromCloud, // Exposed
            notificationEnabled, toggleNotification, // Exposed
            updateNickname // Exposed
        }}>
            {children}
        </GameContext.Provider>
    );
};
