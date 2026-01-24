// --- Constants ---
const BOUNDS = { minX: 10, maxX: 90, minY: 1, maxY: 90 };
const GRAVEYARD_RADIUS = 33; // Fan shape from Top-Left (x=0, y=100)

// Configuration for game balance
// Configuration for game balance
const SHEEP_CONFIG = {
    SPEED: { NORMAL: 1.2, SICK: 0.6, PUSH_BACK: 3.0 },
    CHANCE: {
        STOP_NORMAL: 0.2, STOP_SICK: 0.4, // Stop more often
        WALK_NORMAL: 0.08, WALK_SICK: 0.05 // Start walking less often
    },
    DECAY: {
        // Per Tick (500ms)
        TICK: {
            HEALTHY: 0.000075, // ~13%/day
            SICK: 0.000115,    // ~20%/day
            INJURED: 0.0001,   // ~17%/day
            PROTECTED: 0.000035 // ~6%/day
        },
        // Per Hour (Derived approx for offline calc: TickRate * 2 * 3600)
        // 0.000075 * 7200 = 0.54
        HOUR: {
            HEALTHY: 0.54,
            SICK: 0.828,
            INJURED: 0.72,
            PROTECTED: 0.252
        }
    }
};

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

export const parseMaturity = (matString) => {
    if (!matString) return { level: '', stage: '' };
    const match = matString.match(/^(.+?)(?:\s*\((.+)\))?$/);
    if (match) {
        return { level: match[1], stage: match[2] || '' };
    }
    return { level: matString, stage: '' };
};

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
    if (typeof x !== 'number' || isNaN(x)) x = Math.random() * (BOUNDS.maxX - BOUNDS.minX) + BOUNDS.minX;
    if (typeof y !== 'number' || isNaN(y)) y = Math.random() * (BOUNDS.maxY - BOUNDS.minY) + BOUNDS.minY;
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
 * Centralized logic for determining Status and Type based on Health.
 * Used by Game Loop, Offline Calculation, and Debug Editor.
 */
export const calculateSheepState = (currentHealth, currentStatus) => {
    let newHealth = Math.max(0, currentHealth);
    let newStatus = currentStatus;

    if (newHealth <= 0 && currentStatus !== 'dead') {
        newStatus = 'dead';
        newHealth = 0;
    } else if (newHealth < 40 && currentStatus === 'healthy') {
        // Deterministic Sick Rule
        newStatus = 'sick';
    } else if (newHealth >= 40 && currentStatus === 'sick') {
        // Auto-recover
        newStatus = 'healthy';
    }

    // Enforce Type
    const newType = (newHealth >= 80) ? 'STRONG' : 'LAMB';

    return { health: newHealth, status: newStatus, type: newType };
};

/**
 * Calculates decay for a sheep over a period of time (offline).
 */
export const calculateOfflineDecay = (s, diffHours) => {
    if (s.status === 'dead') return s;

    let ratePerHour = SHEEP_CONFIG.DECAY.HOUR.HEALTHY;

    // Prayer Protection Check
    const todayStr = new Date().toDateString();
    const isProtected = s.lastPrayedDate === todayStr;

    if (s.status === 'sick') ratePerHour = SHEEP_CONFIG.DECAY.HOUR.SICK;
    else if (isProtected) ratePerHour = SHEEP_CONFIG.DECAY.HOUR.PROTECTED;
    else if (s.status === 'injured') ratePerHour = SHEEP_CONFIG.DECAY.HOUR.INJURED;

    const decayAmount = diffHours * ratePerHour;
    let rawHealth = s.status === 'dead' ? 0 : (s.health - decayAmount);

    const { health, status, type } = calculateSheepState(rawHealth, s.status);

    return sanitizeSheep({ ...s, health, status, type });
};

export const calculateTick = (s, allSheep = []) => {
    // Allow dead sheep to process message logic
    // if (s.status === 'dead') return s;

    let { x, y, state, angle, direction, message, messageTimer } = s;
    const oldX = x;
    const oldY = y;

    // 1. Movement Logic
    if (s.status === 'dead') {
        state = 'idle';
        // Graveyard Logic: Fan shape from Top-Left (x=0, y=100)
        const distSq = x * x + (100 - y) * (100 - y);
        const graveRadiusSq = GRAVEYARD_RADIUS * GRAVEYARD_RADIUS;

        if (distSq > graveRadiusSq) {
            // Teleport inside
            const r = Math.random() * (GRAVEYARD_RADIUS - 5);
            const theta = Math.random() * (Math.PI / 2); // 0 to 90 degrees
            x = r * Math.sin(theta);
            y = 100 - r * Math.cos(theta);

            angle = Math.PI / 2; // Face forward/down, static
        }
    } else if (state === 'walking') {
        // Stop Chance
        let stopChance = SHEEP_CONFIG.CHANCE.STOP_NORMAL;
        if (s.status === 'sick') stopChance = SHEEP_CONFIG.CHANCE.STOP_SICK;

        if (Math.random() < stopChance) {
            // Stop! Chance to Sleep? (30%)
            state = (Math.random() < 0.3) ? 'sleep' : 'idle';
        } else {
            // Redundant initialization removed - sanitizeSheep handles this

            // Speed
            let speed = SHEEP_CONFIG.SPEED.NORMAL;
            if (s.status === 'sick') speed = SHEEP_CONFIG.SPEED.SICK;

            // Random turn
            angle += (Math.random() - 0.5) * 1.0;
            x += Math.cos(angle) * speed;
            y += Math.sin(angle) * speed;
        }
    } else if (state === 'sleep') {
        // Wake Up Chance (5% per tick -> ~2.5s avg sleep duration if tick=500ms? No, 1/0.05 = 20 ticks = 10s)
        if (Math.random() < 0.02) state = 'idle'; // Sleep longer
    } else {
        // IDLE State
        // Start Walk Chance
        let walkChance = SHEEP_CONFIG.CHANCE.WALK_NORMAL;
        if (s.status === 'sick') walkChance = SHEEP_CONFIG.CHANCE.WALK_SICK;

        if (Math.random() < walkChance) state = 'walking';
    }

    // --- Global Constraints (Apply to ALL live sheep, even idle) ---
    // Forces sheep out of graveyard and bounds, regardless of state
    if (s.status !== 'dead') {
        const SAFE_RADIUS = 58; // 33 + 25
        const SAFE_RADIUS_SQ = SAFE_RADIUS * SAFE_RADIUS;
        const distSqToCorner = x * x + (100 - y) * (100 - y);

        if (distSqToCorner < SAFE_RADIUS_SQ) {
            // Bounce/Push back!
            const angleFromCorner = Math.atan2(y - 100, x - 0);
            angle = angleFromCorner; // Face away

            // Strong Push
            const pushSpeed = SHEEP_CONFIG.SPEED.PUSH_BACK * 1.5;
            x += Math.cos(angle) * pushSpeed;
            y += Math.sin(angle) * pushSpeed;
        }

        // --- SIGN AVOIDANCE ---
        // Sign is roughly at x=21, y=75
        const signX = 21;
        const signY = 75;
        const distSqToSign = (x - signX) ** 2 + (y - signY) ** 2;
        const signRadiusSq = 15 * 15; // 225

        if (distSqToSign < signRadiusSq) {
            const angleFromSign = Math.atan2(y - signY, x - signX);
            const push = SHEEP_CONFIG.SPEED.PUSH_BACK; // 4.0 speed
            x += Math.cos(angleFromSign) * push;
            y += Math.sin(angleFromSign) * push;

            // Wake up if sleeping near sign (so they move away)
            if (state === 'sleep') state = 'walking';
        }

        // --- FLOCK SEPARATION ---
        if (state !== 'sleep' && allSheep && allSheep.length > 0) {
            // Performance: Only check simple distance
            const MIN_SEPARATION = 8; // % units. Approx body width.
            const MIN_SEP_SQ = MIN_SEPARATION * MIN_SEPARATION;

            for (let other of allSheep) {
                if (other.id === s.id) continue;
                if (other.status === 'dead') continue; // Don't avoid graves strictly here

                const dx = x - other.x;
                const dy = y - other.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < MIN_SEP_SQ && distSq > 0.001) {
                    const dist = Math.sqrt(distSq); // Sqrt only when collision detected
                    const pushForce = (MIN_SEPARATION - dist) * 0.5; // Stronger push
                    const ax = dx / dist;
                    const ay = dy / dist;

                    x += ax * pushForce;
                    y += ay * pushForce;
                }
            }
        }

        // Bounds Check (Always Enforce)
        if (x < BOUNDS.minX || x > BOUNDS.maxX) {
            angle = Math.PI - angle;
            x = clamp(x, BOUNDS.minX, BOUNDS.maxX);
        }
        if (y < BOUNDS.minY || y > BOUNDS.maxY) {
            angle = -angle;
            y = clamp(y, BOUNDS.minY, BOUNDS.maxY);
        }
    }

    direction = Math.cos(angle) > 0 ? 1 : -1;

    // Movement Analysis for Animation Direction
    const dx = x - oldX;
    const dy = y - oldY;

    // TURN TO FACE MOVEMENT (No Moonwalking)
    const distMovedSq = dx * dx + dy * dy;
    if (distMovedSq > 0.0025) { // 0.05 * 0.05
        // Update angle to face the actual direction of movement
        angle = Math.atan2(dy, dx);
    }

    // Always walking forward now
    const isReversing = false;

    // Update direction based on new angle
    direction = Math.cos(angle) > 0 ? 1 : -1;

    // 2. Health Logic
    // Target: Max 20% per day (24h). 20 HP / 86400s = ~0.00023 HP/s
    // Tick is 500ms (2/s), so ~0.000115 HP/tick is the MAX allowed speed.
    // sick: 0.000115 (Max ~20%/day), injured: 0.0001, healthy: 0.000075 (Normal ~13%/day)
    // protected: ~6% per day -> ~0.000035 HP/tick

    const todayStr = new Date().toDateString();
    const isProtected = s.lastPrayedDate === todayStr;

    let decayRate = SHEEP_CONFIG.DECAY.TICK.HEALTHY;
    if (s.status === 'sick') decayRate = SHEEP_CONFIG.DECAY.TICK.SICK;
    else if (isProtected) decayRate = SHEEP_CONFIG.DECAY.TICK.PROTECTED;
    else if (s.status === 'injured') decayRate = SHEEP_CONFIG.DECAY.TICK.INJURED;

    // Decay
    let rawHealth = s.status === 'dead' ? 0 : (s.health - decayRate);

    // Use Helper
    const { health: newHealth, status: newStatus, type: newType } = calculateSheepState(rawHealth, s.status);

    let newCare = s.careLevel;

    // 3. Message Logic
    let timer = messageTimer > 0 ? messageTimer - 0.5 : 0; // Decrement by 0.5s (tick is 0.5s)
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
            const { level, stage } = parseMaturity(s.spiritualMaturity);

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

            msg = specificMsg || getRandomItem(SHEEP_MESSAGES.happy);
        }
    }

    return {
        ...s, x, y, angle, state, direction, isReversing,
        health: newHealth, status: newStatus,
        type: newType, careLevel: newCare,
        message: msg, messageTimer: timer
    };
};

// Random access
export const getSheepMessage = (type) => getRandomItem(SHEEP_MESSAGES[type]);

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
