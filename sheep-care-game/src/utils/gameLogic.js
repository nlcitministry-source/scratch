
// --- Constants ---
const BOUNDS = { minX: 5, maxX: 95, minY: 0, maxY: 100 };
const GRAVEYARD_RADIUS = 25; // Fan shape from Top-Left (x=0, y=100)
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
    ],
    dead: [
        "救救我...我不想要消失... 😭",
        "好黑好冷...誰能聽見我？ 🌑",
        "不要遺忘我...求求你... 🙏",
        "只有你能喚醒我...拜託...",
        "我還不想就這樣結束... 💔",
        "聽得到我的聲音嗎...？",
        "請為我禱告...我好害怕...",
        "相信奇蹟...請不要放棄我...",
        "等待你的呼喚... 🕯️"
    ]
};

const MATURITY_MESSAGES = {
    "新朋友": {
        "學習中": [
            "這裡是什麼地方？", "有點害羞...", "可以帶我去認識大家嗎？", "你好...", "想找人說說話..."
        ],
        "穩定": [
            "這裡感覺很溫馨。", "我喜歡這裡的氛圍。", "今天也是美好的一天。", "認識新朋友真好。", "牧羊人對我很好。"
        ],
        "突破": [
            "我會帶新朋友一起來！", "這裡很棒，你也來看看！", "大家一起來參加！"
        ]
    },
    "慕道友": {
        "學習中": [
            "我想更多認識牧羊人。", "這句話是什麼意思呢？", "正在思考信仰的問題...", "想聽更多故事。", "有點疑惑..."
        ],
        "穩定": [
            "禱告讓我心裡平安。", "想要更穩定來這裡。", "牧羊人的聲音真好聽。", "覺得被安慰了。", "喜歡這裡的詩歌。"
        ],
        "突破": [
            "我也可以分享我的感動！", "帶了朋友一起來聽。", "這週要不要一起來？", "我被改變了！"
        ]
    },
    "基督徒": {
        "學習中": [
            "主啊，教導我...", "正在學習順服。", "想要突破生命的關卡。", "求主修剪我...", "願我更像祢。"
        ],
        "穩定": [
            "感謝主的恩典！", "凡事謝恩。", "喜樂的心乃是良藥。", "主是我的牧者。", "不住禱告。"
        ],
        "突破": [
            "我們一起為羊群禱告！", "去關心那隻迷途的小羊吧。", "主要使用我！", "看顧羊群是我的責任。", "願主的名得榮耀！"
        ]
    }
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

    // Ensure not spawning in graveyard or buffer zone (Radius + 20)
    const distToGrave = Math.sqrt(x * x + (100 - y) * (100 - y));
    if (s.status !== 'dead' && distToGrave < GRAVEYARD_RADIUS + 20) {
        // Shift out
        x += 20;
        y -= 20;
    }

    // Fix Visual
    const safeVisual = visual || generateVisuals();

    return { ...s, x, y, angle, visual: safeVisual };
};

/**
 * Processes a single game tick for one sheep.
 * Handles movement, wall bouncing, health decay, and random messages.
 */
export const calculateTick = (s) => {
    // Allow dead sheep to process message logic, but not movement/health
    // if (s.status === 'dead') return s; // REMOVED to allow messages

    let { x, y, state, angle, direction, message, messageTimer } = s;

    // 1. Movement Logic
    if (s.status === 'dead') {
        state = 'idle';
        // Graveyard Logic: Fan shape from Top-Left (x=0, y=100)
        const dist = Math.sqrt(x * x + (100 - y) * (100 - y));

        if (dist > GRAVEYARD_RADIUS) {
            // Teleport inside
            const r = Math.random() * (GRAVEYARD_RADIUS - 5);
            const theta = Math.random() * (Math.PI / 2); // 0 to 90 degrees
            // Map to top-left quadrant relative to (0,100)
            // X = r * sin(theta) (0 to +)
            // Y = 100 - r * cos(theta) (100 down to 100-r)
            x = r * Math.sin(theta);
            y = 100 - r * Math.cos(theta);

            angle = Math.PI / 2; // Face forward/down, static
        } else {
            // Already in graveyard? Force static precise lock (don't drift)
            // Do not update x, y, angle
        }
    } else if (state === 'walking') {
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

            // Graveyard Collision Check (Fan Shape) with 20 unit buffer
            const distToCorner = Math.sqrt(x * x + (100 - y) * (100 - y));
            if (distToCorner < GRAVEYARD_RADIUS + 20) {
                // Bounce back (Normal vector is direction from corner to sheep)
                // Simply reverse for now or push away from corner
                const angleFromCorner = Math.atan2(100 - y, 0 - x); // Vector to corner
                // We want to go opposite
                angle = Math.atan2(y - 100, x - 0);

                x += Math.cos(angle) * 3.0; // Push out
                y += Math.sin(angle) * 3.0;
            }

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
    // Tick is 100ms (10/s), so ~0.000023 HP/tick is the MAX allowed speed.
    // sick: 0.000023 (Max ~20%/day), injured: 0.00002, healthy: 0.000015 (Normal ~13%/day)
    // protected: ~6% per day -> ~0.000007 HP/tick

    const todayStr = new Date().toDateString();
    const isProtected = s.lastPrayedDate === todayStr;

    let decayRate = 0.000015; // Default Healthy
    if (s.status === 'sick') decayRate = 0.000023;
    else if (isProtected) decayRate = 0.000007; // Protected
    else if (s.status === 'injured') decayRate = 0.00002;
    // Don't decay if dead
    let newHealth = s.status === 'dead' ? 0 : Math.max(0, s.health - decayRate);
    let newStatus = s.status;
    let newCare = s.careLevel; // Kept for backend compatibility but not used for evolution

    // Enforce Type based on Health
    // < 80: LAMB (Weak or Healthy), >= 80: STRONG
    let newType = (newHealth >= 80) ? 'STRONG' : 'LAMB';

    if (newHealth <= 0 && s.status !== 'dead') {
        newStatus = 'dead';
        newHealth = 0;
    } else if (newHealth < 40 && s.status === 'healthy' && Math.random() < 0.005) {
        newStatus = 'sick';
    } else if (newHealth >= 40 && s.status === 'sick') {
        // Auto-recover from sickness if health is restored (e.g. by Admin or other means)
        newStatus = 'healthy';
    }

    // 3. Message Logic
    let timer = messageTimer > 0 ? messageTimer - 0.1 : 0;
    let msg = timer > 0 ? message : null;

    // Dynamic speak chance
    const speakChance = newStatus === 'dead' ? 0.003 : (newHealth < 30 ? 0.02 : (newHealth < 60 ? 0.008 : 0.001));

    if (timer <= 0 && Math.random() < speakChance) {
        timer = 5;
        if (newStatus === 'dead') msg = getRandomItem(SHEEP_MESSAGES.dead);
        else if (newHealth < 30) msg = getRandomItem(SHEEP_MESSAGES.critical);
        else if (newHealth < 60) msg = getRandomItem(SHEEP_MESSAGES.neglected);
        else if (Math.random() < 0.4) {
            // Maturity based messaging
            let specificMsg = null;
            const matString = s.spiritualMaturity || '';
            const match = matString.match(/^(.+?)(?:\s*\((.+)\))?$/);
            if (match) {
                const level = match[1];
                const stage = match[2]; // No default
                if (stage && MATURITY_MESSAGES[level] && MATURITY_MESSAGES[level][stage]) {
                    specificMsg = getRandomItem(MATURITY_MESSAGES[level][stage]);
                }
                // If only level is known (old data or simple input), try to pick from any stage or default
                if (!specificMsg && MATURITY_MESSAGES[level]) {
                    // Try '學習中' or random stage
                    const stages = Object.values(MATURITY_MESSAGES[level]);
                    const randomStage = getRandomItem(stages);
                    specificMsg = getRandomItem(randomStage);
                }
            }

            msg = specificMsg || getRandomItem(SHEEP_MESSAGES.happy);
        }
    }

    return {
        ...s, x, y, angle, state, direction,
        health: newHealth, status: newStatus,
        type: newType, careLevel: newCare,
        message: msg, messageTimer: timer
    };
};

// Random access
export const getSheepMessage = (type) => getRandomItem(SHEEP_MESSAGES[type]);

// Stable access (changes every 5 minutes)
// Stable access (changes every 5 minutes)
export const getStableSheepMessage = (s, type) => {
    const list = SHEEP_MESSAGES[type];
    if (!list || list.length === 0) return "...";

    // Bucket time by 5 minutes
    const timeBucket = Math.floor(Date.now() / 300000);

    // Handle String IDs (Hash them) or Number IDs
    let idVal = 0;
    const idStr = String(s.id);
    for (let i = 0; i < idStr.length; i++) {
        idVal = ((idVal << 5) - idVal) + idStr.charCodeAt(i);
        idVal |= 0; // Convert to 32bit integer
    }

    const index = Math.abs((idVal + timeBucket) % list.length);
    return list[index];
};
