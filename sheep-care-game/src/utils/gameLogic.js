
// --- Constants ---
const BOUNDS = { minX: 5, maxX: 95, minY: 0, maxY: 100 };
const SHEEP_MESSAGES = {
    login: [
        "你終於回來了！好開心！✨",
        "一直在等你呢～ ❤️",
        "看到你真好！",
        "今天也要一起加油喔！",
        "羊群因為你而充滿活力！"
    ],
    neglected: [
        "肚子咕嚕咕嚕叫～ 🥕",
        "想要摸摸頭～",
        "可以陪我玩嗎？",
        "有點餓了呢...",
        "期待你的照顧！✨",
        "我在這裡等你喔！",
        "想要吃好吃的草～",
        "肚子扁扁的...",
        "無聊到長草了🌱",
        "主人在哪裡？👀"
    ],
    critical: [
        "不太舒服... 💦",
        "需要休息一下...",
        "幫幫我... 💊",
        "想要抱抱...",
        "有一點點累...",
        "我好像發燒了... 🌡️",
        "眼前一片黑... 🌑",
        "頭好暈喔... 💫",
        "有沒有藥藥？",
        "好冷喔... ❄️",
        "不要丟下我... fa-standing"
    ],
    happy: [
        "最喜歡你了！ ❤️",
        "今天天氣真好～ ☀️",
        "咩～ (開心)",
        "你真是個好牧羊人！",
        "又是美好的一天！"
    ]
};

// --- Helpers ---
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateVisuals = () => {
    const colors = ['#ffffff', '#fff5e6', '#f0f8ff', '#fff0f5', '#e6e6fa', '#f5f5f5'];
    const accessories = ['none', 'none', 'none', 'tie_red', 'tie_blue', 'flower', 'scarf_green'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const accessory = accessories[Math.floor(Math.random() * accessories.length)];
    return { color, accessory };
};

// --- Core Logic ---

/**
 * Ensures a sheep object has valid coordinates and visual properties.
 */
export const sanitizeSheep = (s) => {
    let { x, y, angle, visual } = s;

    // Fix Coordinates
    if (typeof x !== 'number' || isNaN(x)) x = Math.random() * 90 + 5;
    if (typeof y !== 'number' || isNaN(y)) y = Math.random() * 50;
    if (typeof angle !== 'number' || isNaN(angle)) angle = Math.random() * Math.PI * 2;

    // Fix Visual
    const safeVisual = visual || generateVisuals();

    return { ...s, x, y, angle, visual: safeVisual };
};

/**
 * Processes a single game tick for one sheep.
 * Handles movement, wall bouncing, health decay, and random messages.
 */
export const calculateTick = (s) => {
    if (s.status === 'dead') return s;

    let { x, y, state, angle, direction, message, messageTimer } = s;

    // 1. Movement Logic
    if (state === 'walking') {
        if (Math.random() < 0.05) state = 'idle';
        else {
            // Robust initialization (Double check even if sterilized on load)
            if (typeof y !== 'number' || isNaN(y)) y = Math.random() * 50;
            if (typeof angle !== 'number' || isNaN(angle)) angle = Math.random() * Math.PI * 2;
            if (typeof x !== 'number' || isNaN(x)) x = Math.random() * 90 + 5;

            // Random turn
            angle += (Math.random() - 0.5) * 0.5;
            x += Math.cos(angle) * 1.5;
            y += Math.sin(angle) * 1.5;

            // Bounds Check
            if (x < BOUNDS.minX || x > BOUNDS.maxX) {
                angle = Math.PI - angle;
                x = clamp(x, BOUNDS.minX, BOUNDS.maxX);
            }
            if (y < BOUNDS.minY || y > BOUNDS.maxY) {
                angle = -angle;
                y = clamp(y, BOUNDS.minY, BOUNDS.maxY);
            }
        }
    } else {
        if (Math.random() < 0.05) state = 'walking';
    }
    direction = Math.cos(angle) > 0 ? 1 : -1;

    // 2. Health Logic
    // Target: Max 20% per day (24h). 20 HP / 86400s = ~0.00023 HP/s
    // Tick is 100ms (10/s), so ~0.000023 HP/tick
    const decayRate = s.status === 'sick' ? 0.0002 : ((s.status === 'injured') ? 0.00005 : 0.00002);
    const newHealth = Math.max(0, s.health - decayRate);
    let newStatus = s.status;

    if (newHealth <= 0) {
        newStatus = 'dead';
        // Only return message if just died? context handles toast, we handle bubble
    } else if (newHealth < 50 && s.status === 'healthy' && Math.random() < 0.005) {
        newStatus = 'sick';
    }

    // 3. Message Logic
    let timer = messageTimer > 0 ? messageTimer - 0.1 : 0;
    let msg = timer > 0 ? message : null;

    // Dynamic speak chance: Weak sheep speak more often to remind shepherd
    // Critical (HP<30): ~2% per tick (High priority)
    // Weak (HP<60): ~0.8% per tick (Medium)
    // Healthy: ~0.1% per tick (Low - Random ambient)
    const speakChance = newHealth < 30 ? 0.02 : (newHealth < 60 ? 0.008 : 0.001);

    if (timer <= 0 && Math.random() < speakChance) {
        timer = 5;
        if (newHealth < 30) msg = getRandomItem(SHEEP_MESSAGES.critical);
        else if (newHealth < 60) msg = getRandomItem(SHEEP_MESSAGES.neglected);
        else if (Math.random() < 0.3) msg = getRandomItem(SHEEP_MESSAGES.happy);
    }

    return {
        ...s, x, y, angle, state, direction,
        health: newHealth, status: newStatus,
        message: msg, messageTimer: timer
    };
};

// Random access
export const getSheepMessage = (type) => getRandomItem(SHEEP_MESSAGES[type]);

// Stable access (changes every 5 minutes)
export const getStableSheepMessage = (s, type) => {
    const list = SHEEP_MESSAGES[type];
    if (!list || list.length === 0) return "...";
    // Bucket time by 5 minutes (300000ms)
    const timeBucket = Math.floor(Date.now() / 300000);
    // Use sheep ID + time as seed
    const index = (Math.floor(s.id) + timeBucket) % list.length;
    return list[index];
};
