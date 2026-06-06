const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
let hp = 3, lvl = 0, bhp = 100, score = 0, combo = 0, maxCombo = 0, over = false, projs = [], bCount = 0, sTime = 60, shake = 0, sTimers = [], isWaitingToStart = true, hitTaken = false;
let activeShield = 'default';
let activeHelmet = 'recruit';
let parryMessages = [];
const S_OFF = 30, maxL = 5, P = {x: 150, y: 250, st: 'idle', tm: 0}, B = {x: 650, y: 230, w: 50, h: 80}, P_WIN = 25;

// Inventory data
let cleared = JSON.parse(localStorage.getItem('parry_cleared')) || [];
let badges = JSON.parse(localStorage.getItem('parry_badges')) || [];
let ownedShields = JSON.parse(localStorage.getItem('parry_shields')) || ['default'];
let ownedHelmets = JSON.parse(localStorage.getItem('parry_helmets')) || ['recruit'];

// Player color
const PLAYER_COLOR = '#66fcf1';
const PLAYER_GLOW = '#88ffff';

const L_DATA = {
    1: {hp: 100, spd: 5, col: '#ff4d4d', glow: '#ff8888', t: "ST1: BRUTE", dropShield: 'brute', dropHelmet: 'brute', startDelay: 45},
    2: {hp: 120, spd: 6, col: '#bf55ec', glow: '#d98eff', t: "ST2: TWIN", dropShield: 'chrono', dropHelmet: 'twin', startDelay: 50},
    3: {hp: 130, spd: 6.5, col: '#3498db', glow: '#6ec4ff', t: "ST3: TRIAD", dropShield: 'resonance', dropHelmet: 'triad', startDelay: 55},
    4: {hp: 150, spd: 7, col: '#f1c40f', glow: '#ffe066', t: "ST4: CHAOS", dropShield: 'chaos', dropHelmet: 'chaos', startDelay: 60},
    5: {hp: 200, spd: 8, col: '#e74c3c', glow: '#ff7777', t: "FINAL STAGE: ARCHMAGE", dropShield: 'mirror', dropHelmet: 'archmage', startDelay: 70}
};

// Shield stats
const SHIELD_STATS = {
    default: { name: "Default Core", ico: "🔘", desc: "Standard shield. Parry sends fireball back.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    brute: { name: "Brute's Bulwark", ico: "🔴", desc: "+25% parry window.", parryWindow: 0.25, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chrono: { name: "Chrono Deflector", ico: "🟣", desc: "Slows projectiles by 20%.", parryWindow: 0, slow: 0.20, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    resonance: { name: "Resonance Ward", ico: "🔵", desc: "10% chance to reflect fireball back when HIT (instead of taking damage).", parryWindow: 0, slow: 0, reflectOnHit: 0.10, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chaos: { name: "Chaos Core", ico: "🟡", desc: "15% chance to heal 1 heart on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0.15, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    mirror: { name: "Cosmic Mirror", ico: "💠", desc: "20% chance for extra replica + 10% heal on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0.20, extraHeal: 0.10, maxHpBonus: 0 },
    collector: { name: "Collector's Core", ico: "💎", desc: "2x drop chance (adds +100%, stacks up to 3x total). No duplicate drops.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 }
};

// Helmet stats
const HELMET_STATS = {
    recruit: { name: "Recruit's Sallet", ico: "🪖", desc: "+1 max HP.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 1 },
    brute: { name: "Brute's Horned Helm", ico: "🔴", desc: "+40% parry window.", parryWindow: 0.40, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    twin: { name: "Twin's Linked Visor", ico: "🟣", desc: "Slows projectiles by 35%.", parryWindow: 0, slow: 0.35, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    triad: { name: "Triad's Prism Helm", ico: "🔵", desc: "20% chance to reflect fireball back when HIT (instead of taking damage).", parryWindow: 0, slow: 0, reflectOnHit: 0.20, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chaos: { name: "Chaos Crown", ico: "🟡", desc: "25% chance to heal 1 heart on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0.25, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    archmage: { name: "Archmage's Star-Cap", ico: "💠", desc: "35% chance for extra replica + 20% heal on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0.35, extraHeal: 0.20, maxHpBonus: 0 },
    completionist: { name: "Completionist's Helmet", ico: "👑", desc: "2x drop chance (adds +100%, stacks up to 3x total). No duplicate drops.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 }
};

// Badge definitions for the Badge Book
const BADGE_DATA = {
    flawless: { name: "🛡️ UNTOUCHABLE", desc: "Beat any boss without taking damage", reward: "No reward (achievement only)" },
    combo: { name: "🔥 COMBO KING", desc: "Get a 5x Parry Combo", reward: "No reward (achievement only)" },
    reflex: { name: "⚡ FAST HANDS", desc: "Parry at lightning speed (within 10px of shield)", reward: "No reward (achievement only)" },
    champion: { name: "👑 CHAMPION", desc: "Defeat all 5 boss styles", reward: "No reward (achievement only)" },
    perfectionist: { name: "🎯 PERFECTIONIST", desc: "Get 10 PERFECT parries in one fight", reward: "PERFECT parries deal 15 damage (instead of 10)" },
    collector: { name: "📦 COLLECTOR", desc: "Unlock all shields AND all helmets", reward: "Unlocks 'Collector's Core' shield (2x drop chance, +100%, stacks to 3x)" },
    completionist: { name: "👑 COMPLETIONIST", desc: "Unlock all 6 other badges", reward: "Unlocks 'Completionist's Helmet' (2x drop chance, +100%, stacks to 3x max)" }
};

function getMaxHp() {
    const shield = SHIELD_STATS[activeShield] || SHIELD_STATS.default;
    const helmet = HELMET_STATS[activeHelmet] || HELMET_STATS.recruit;
    return 3 + shield.maxHpBonus + helmet.maxHpBonus;
}

function getActiveStats() {
    const shield = SHIELD_STATS[activeShield] || SHIELD_STATS.default;
    const helmet = HELMET_STATS[activeHelmet] || HELMET_STATS.recruit;
    let parryWindow = shield.parryWindow + helmet.parryWindow;
    let slow = shield.slow + helmet.slow;
    let reflectOnHit = shield.reflectOnHit + helmet.reflectOnHit;
    let healParry = shield.healParry + helmet.healParry;
    let extraReplica = shield.extraReplica + helmet.extraReplica;
    let extraHeal = shield.extraHeal + helmet.extraHeal;
    
    return { parryWindow, slow, reflectOnHit, healParry, extraReplica, extraHeal };
}

function getDropMultiplier() {
    let multiplier = 1;
    if (ownedShields.includes('collector')) multiplier++;
    if (ownedHelmets.includes('completionist')) multiplier++;
    return Math.min(multiplier, 3); // Max 3x
}

function updateMaxHp() {
    const maxHp = getMaxHp();
    if (hp > maxHp) hp = maxHp;
    let hearts = '';
    for (let i = 0; i < maxHp; i++) hearts += (i < hp) ? '❤️ ' : '🖤 ';
    document.getElementById('player-hp').innerHTML = `HP: ${hearts}`;
}

function addProjectile(speed, type = 'in', x = B.x, customDamage = 10, customColor = null) {
    const stats = getActiveStats();
    let finalSpeed = speed;
    if (type === 'in' && stats.slow > 0) finalSpeed = speed * (1 - stats.slow);
    let color = customColor;
    if (!color) {
        if (type === 'reflect') color = PLAYER_COLOR;
        else if (type === 'replica') color = PLAYER_GLOW;
        else color = '#ffb300';
    }
    projs.push({x, y: P.y, vx: -finalSpeed, sz: 10, active: true, type, dmg: customDamage, color: color});
}

function spawn() {
    const c = L_DATA[lvl];
    if (lvl === 1) addProjectile(c.spd + score * 0.2);
    else if (lvl === 2) { addProjectile(c.spd); bCount = 1; sTime = 30; } 
    else if (lvl === 3) { addProjectile(c.spd); bCount = 2; sTime = 25; } 
    else if (lvl === 4) { addProjectile(c.spd); sTimers = [Math.floor(Math.random() * 25) + 15, Math.floor(Math.random() * 35) + 45]; }
    else if (lvl === 5) { 
        let accumulatedDelay = 0; sTimers = [];
        for (let i = 0; i < 5; i++) {
            accumulatedDelay += Math.floor(Math.random() * 30) + 15; 
            sTimers.push(accumulatedDelay);
        }
    }
}

function selectStage(n) {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('item-modal').classList.add('hidden');
    over = false; 
    score = 0; 
    combo = 0; 
    maxCombo = 0; 
    P.st = 'idle'; 
    P.tm = 0; 
    shake = 0;
    lvl = n;
    const boss = L_DATA[lvl];
    bhp = boss.hp;
    projs = [];
    parryMessages = [];
    sTime = boss.startDelay || 60;
    bCount = 0;
    sTimers = [];
    isWaitingToStart = false;
    hitTaken = false;
    hp = getMaxHp();
    updateMaxHp();
    updateUI();
    document.getElementById('level-display').innerHTML = boss.t;
    document.getElementById('level-display').style.color = boss.col;
    const b = document.getElementById('boss-hp');
    b.style.backgroundColor = boss.col;
    b.style.boxShadow = `0 0 10px ${boss.col}`;
    b.style.width = '100%';
    updateBtnUI();
}

function updateUI() {
    document.getElementById('score').innerHTML = `Combo: ${combo} | Parries: ${score}`;
}

function updateBtnUI() {
    document.querySelectorAll('.stage-btn').forEach((b, i) => {
        if (i + 1 === lvl) b.classList.add('active');
        else b.classList.remove('active');
    });
    renderInventoryUI();
}

let pendingType = null, pendingId = null;

function clickSkin(id) {
    if (ownedShields.includes(id)) {
        pendingType = 'shield';
        pendingId = id;
        const details = SHIELD_STATS[id];
        document.getElementById('modal-icon').innerHTML = details.ico;
        document.getElementById('modal-title').innerHTML = details.name;
        document.getElementById('modal-desc').innerHTML = details.desc;
        document.getElementById('synergy-preview').innerHTML = '';
        document.getElementById('item-modal').classList.remove('hidden');
    }
}

function clickHelmet(id) {
    if (ownedHelmets.includes(id)) {
        pendingType = 'helmet';
        pendingId = id;
        const details = HELMET_STATS[id];
        document.getElementById('modal-icon').innerHTML = details.ico;
        document.getElementById('modal-title').innerHTML = details.name;
        document.getElementById('modal-desc').innerHTML = details.desc;
        document.getElementById('synergy-preview').innerHTML = '';
        document.getElementById('item-modal').classList.remove('hidden');
    }
}

function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    pendingType = null;
    pendingId = null;
}

function confirmEquip() {
    if (pendingType === 'shield') {
        activeShield = pendingId;
    } else if (pendingType === 'helmet') {
        activeHelmet = pendingId;
    }
    const maxHp = getMaxHp();
    if (hp > maxHp) hp = maxHp;
    updateMaxHp();
    renderInventoryUI();
    closeModal();
}

function checkLootDrops() {
    const boss = L_DATA[lvl];
    let msg = '';
    let baseChance = (lvl === 1 ? 0.2 : lvl === 2 ? 0.15 : lvl === 3 ? 0.10 : lvl === 4 ? 0.05 : 0.02);
    let dropMultiplier = getDropMultiplier();
    let finalChance = baseChance * dropMultiplier;
    
    // Shield drop
    if (boss.dropShield && !ownedShields.includes(boss.dropShield)) {
        if (Math.random() < finalChance) {
            ownedShields.push(boss.dropShield);
            msg += `🛡️ ${SHIELD_STATS[boss.dropShield].name} `;
        }
    }
    // Helmet drop
    if (boss.dropHelmet && !ownedHelmets.includes(boss.dropHelmet)) {
        if (Math.random() < finalChance) {
            ownedHelmets.push(boss.dropHelmet);
            msg += `🪖 ${HELMET_STATS[boss.dropHelmet].name} `;
        }
    }
    if (msg) {
        localStorage.setItem('parry_shields', JSON.stringify(ownedShields));
        localStorage.setItem('parry_helmets', JSON.stringify(ownedHelmets));
        document.getElementById('drop-alert').innerHTML = `🏆 DROP: ${msg}!`;
        renderInventoryUI();
    }
}

function renderInventoryUI() {
    // Shields
    const allShields = ['default', 'brute', 'chrono', 'resonance', 'chaos', 'mirror', 'collector'];
    for (let id of allShields) {
        const el = document.getElementById('skin-' + id);
        if (el) {
            if (ownedShields.includes(id)) {
                el.className = (activeShield === id) ? "skin-slot active" : "skin-slot unlocked";
            } else {
                el.className = "skin-slot locked";
            }
        }
    }
    // Helmets
    const allHelmets = ['recruit', 'brute', 'twin', 'triad', 'chaos', 'archmage', 'completionist'];
    for (let id of allHelmets) {
        const el = document.getElementById('helmet-' + id);
        if (el) {
            if (ownedHelmets.includes(id)) {
                el.className = (activeHelmet === id) ? "helmet-slot active" : "helmet-slot unlocked";
            } else {
                el.className = "helmet-slot locked";
            }
        }
    }
    // Badges
    const allBadges = ['flawless', 'combo', 'reflex', 'champion', 'perfectionist', 'collector', 'completionist'];
    for (let id of allBadges) {
        const el = document.getElementById('badge-' + id);
        if (el) {
            if (badges.includes(id)) el.className = "badge-slot unlocked";
            else el.className = "badge-slot locked";
        }
    }
}

function checkCompletionistBadge() {
    // Need all 6 other badges (everything except completionist itself)
    const requiredBadges = ['flawless', 'combo', 'reflex', 'champion', 'perfectionist', 'collector'];
    const hasAll = requiredBadges.every(badge => badges.includes(badge));
    
    if (hasAll && !badges.includes('completionist')) {
        unlockBadge('completionist');
    }
}

function unlockBadge(id) {
    if (!badges.includes(id)) {
        badges.push(id);
        localStorage.setItem('parry_badges', JSON.stringify(badges));
        renderInventoryUI();
        
        // Unlock Collector's Core shield when Collector badge is earned
        if (id === 'collector' && !ownedShields.includes('collector')) {
            ownedShields.push('collector');
            localStorage.setItem('parry_shields', JSON.stringify(ownedShields));
            renderInventoryUI();
            document.getElementById('drop-alert').innerHTML = "💎 COLLECTOR'S CORE UNLOCKED! 💎";
            setTimeout(() => {
                if (document.getElementById('drop-alert').innerHTML === "💎 COLLECTOR'S CORE UNLOCKED! 💎") 
                    document.getElementById('drop-alert').innerHTML = "";
            }, 2000);
        }
        
        // Unlock Completionist's Helmet when Completionist badge is earned
        if (id === 'completionist' && !ownedHelmets.includes('completionist')) {
            ownedHelmets.push('completionist');
            localStorage.setItem('parry_helmets', JSON.stringify(ownedHelmets));
            renderInventoryUI();
            document.getElementById('drop-alert').innerHTML = "👑 COMPLETIONIST'S HELMET UNLOCKED! 👑";
            setTimeout(() => {
                if (document.getElementById('drop-alert').innerHTML === "👑 COMPLETIONIST'S HELMET UNLOCKED! 👑") 
                    document.getElementById('drop-alert').innerHTML = "";
            }, 2000);
        }
        
        // After unlocking any badge, check if Completionist is now achievable
        checkCompletionistBadge();
    }
}

function reset() {
    hp = getMaxHp();
    score = 0; 
    combo = 0; 
    maxCombo = 0; 
    over = false; 
    P.st = 'idle'; 
    P.tm = 0; 
    shake = 0; 
    isWaitingToStart = true; 
    lvl = 0; 
    projs = []; 
    parryMessages = [];
    sTimers = [];
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('item-modal').classList.add('hidden');
    document.getElementById('level-display').innerHTML = "SELECT STAGE TO START";
    document.getElementById('level-display').style.color = "#66fcf1";
    document.getElementById('boss-hp').style.width = '0%';
    updateMaxHp();
    updateUI();
    updateBtnUI();
}

// Badge Book Functions
function openBadgeViewer() {
    const modal = document.getElementById('badge-modal');
    const badgeList = document.getElementById('badge-list');
    
    badgeList.innerHTML = '';
    
    for (const [id, data] of Object.entries(BADGE_DATA)) {
        const isUnlocked = badges.includes(id);
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge-card ${isUnlocked ? 'unlocked-badge' : 'locked-badge'}`;
        badgeDiv.innerHTML = `
            <div class="badge-icon">${data.name.split(' ')[0]}</div>
            <div class="badge-info">
                <div class="badge-name">${data.name}</div>
                <div class="badge-desc">📜 ${data.desc}</div>
                <div class="badge-reward">🎁 ${data.reward}</div>
            </div>
            <div class="badge-status">${isUnlocked ? '✅' : '🔒'}</div>
        `;
        badgeList.appendChild(badgeDiv);
    }
    
    modal.classList.remove('hidden');
}

function closeBadgeModal() {
    document.getElementById('badge-modal').classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!over && document.getElementById('item-modal').classList.contains('hidden') && document.getElementById('badge-modal').classList.contains('hidden')) {
            if (isWaitingToStart) { selectStage(1); return; }
            if (P.st === 'idle') {
                const stats = getActiveStats();
                P.st = 'parrying'; P.tm = 10;
                let target = null, minDist = 9999;
                projs.forEach(p => { if (p.active && p.type === 'in') { let d = p.x - (P.x + S_OFF); if (d > -5 && d < minDist) { minDist = d; target = p; } } });
                let validWindow = P_WIN + (stats.parryWindow * 40);
                if (target && minDist <= validWindow) {
                    // Determine parry quality based on distance to shield
                    let quality = '';
                    let qualityColor = '';
                    let isPerfect = false;
                    
                    if (minDist <= 4) {
                        quality = '⭐ GREAT!';
                        qualityColor = '#00ff66';
                    } else if (minDist <= 9) {
                        quality = '💯 PERFECT!';
                        qualityColor = '#ffd700';
                        isPerfect = true;
                    } else if (minDist <= 14) {
                        quality = '⭐ GREAT!';
                        qualityColor = '#00ff66';
                    } else {
                        quality = '✓ GOOD!';
                        qualityColor = '#66ccff';
                    }
                    
                    // Add floating message
                    parryMessages.push({
                        text: quality,
                        x: P.x + S_OFF,
                        y: P.y - 35,
                        life: 30,
                        color: qualityColor
                    });
                    
                    // Track PERFECT parries for Perfectionist badge
                    if (isPerfect) {
                        if (!window.perfectCount) window.perfectCount = 0;
                        window.perfectCount++;
                        if (window.perfectCount >= 10 && !badges.includes('perfectionist')) {
                            unlockBadge('perfectionist');
                        }
                    }
                    
                    // Successful parry - damage depends on Perfectionist badge
                    let damage = 10;
                    if (isPerfect && badges.includes('perfectionist')) {
                        damage = 15;
                    }
                    
                    target.vx = Math.abs(target.vx) * 1.2;
                    target.type = 'reflect';
                    target.dmg = damage;
                    target.color = PLAYER_COLOR;
                    
                    document.getElementById('drop-alert').innerHTML = "⚡ FIREBALL REFLECTED! ⚡";
                    setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "⚡ FIREBALL REFLECTED! ⚡") document.getElementById('drop-alert').innerHTML = ""; }, 300);
                    
                    score++; combo++; shake = 8; P.st = 'success'; P.tm = 0;
                    if (combo > maxCombo) maxCombo = combo;
                    if (combo >= 5) unlockBadge('combo');
                    if (minDist <= 10) unlockBadge('reflex');
                    
                    // Heal on parry (Chaos set)
                    if (stats.healParry > 0 && Math.random() < stats.healParry && hp < getMaxHp()) {
                        hp++;
                        updateMaxHp();
                        document.getElementById('drop-alert').innerHTML = "💚 HEALED! 💚";
                        setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "💚 HEALED! 💚") document.getElementById('drop-alert').innerHTML = ""; }, 500);
                    }
                    
                    // Extra replica on parry (Archmage set)
                    if (stats.extraReplica > 0 && Math.random() < stats.extraReplica) {
                        projs.push({x: P.x + S_OFF + 20, y: P.y, vx: 12, sz: 8, active: true, type: 'replica', dmg: 15, color: PLAYER_GLOW});
                        document.getElementById('drop-alert').innerHTML = "🔁 EXTRA REPLICA! 🔁";
                        setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "🔁 EXTRA REPLICA! 🔁") document.getElementById('drop-alert').innerHTML = ""; }, 500);
                    }
                    
                    if (stats.extraHeal > 0 && Math.random() < stats.extraHeal && hp < getMaxHp()) {
                        hp++;
                        updateMaxHp();
                    }
                    
                    updateUI();
                } else {
                    P.st = 'miss'; P.tm = 18;
                    combo = 0;
                    window.perfectCount = 0; // Reset PERFECT streak on miss
                    updateUI();
                }
            }
        }
    }
    if (e.code === 'KeyR' && over) reset();
});

function update() {
    if (over || isWaitingToStart) return;
    if (shake > 0) shake--;
    if (P.tm > 0) { P.tm--; if (P.tm === 0) P.st = 'idle'; }
    if (P.tm === 0 && P.st === 'success') P.st = 'idle';
    
    // Update parry messages (fade out)
    for (let i = 0; i < parryMessages.length; i++) {
        parryMessages[i].life--;
        parryMessages[i].y -= 1.2;
    }
    parryMessages = parryMessages.filter(m => m.life > 0);
    
    if (lvl === 2 && bCount === 1 && sTime === 1) { addProjectile(L_DATA[lvl].spd); bCount = 0; }
    if (lvl === 3 && bCount > 0 && sTime === 1) { addProjectile(L_DATA[lvl].spd); bCount--; if(bCount > 0) sTime = 25; }
    if (lvl === 4 && sTimers.length > 0) sTimers = sTimers.map(t => { if (t - 1 === 0) addProjectile(L_DATA[lvl].spd); return t - 1; }).filter(t => t > 0);
    if (lvl === 5 && sTimers.length > 0) sTimers = sTimers.map(t => { if (t - 1 === 0) addProjectile(L_DATA[lvl].spd); return t - 1; }).filter(t => t > 0);
    
    let act = bCount > 0 || projs.some(p => p.active) || sTimers.length > 0;
    if (!act) { 
        if (--sTime <= 0) spawn(); 
    } else if (sTime > 0) sTime--;
    
    for (let i = 0; i < projs.length; i++) {
        const p = projs[i];
        if (!p.active) continue;
        p.x += p.vx;
        
        // Hit player - check for reflect on hit!
        if (p.type === 'in' && p.x <= P.x + 10) {
            const stats = getActiveStats();
            let reflected = false;
            
            // Check if we reflect on hit (Resonance Ward or Triad Helm)
            if (stats.reflectOnHit > 0 && Math.random() < stats.reflectOnHit) {
                p.active = false;
                projs.push({
                    x: p.x + 15,
                    y: p.y,
                    vx: 12,
                    sz: 10,
                    active: true,
                    type: 'reflect',
                    dmg: 10,
                    color: PLAYER_COLOR
                });
                reflected = true;
                document.getElementById('drop-alert').innerHTML = "✨ REFLECTED ON HIT! ✨";
                setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "✨ REFLECTED ON HIT! ✨") document.getElementById('drop-alert').innerHTML = ""; }, 500);
            }
            
            if (!reflected) {
                p.active = false;
                hp--;
                updateMaxHp();
                combo = 0;
                window.perfectCount = 0;
                hitTaken = true;
                updateUI();
                if (hp <= 0) { end(false); return; }
            }
            continue;
        }
        // Hit boss
        if ((p.type === 'replica' || p.type === 'reflect') && p.x >= B.x - 20) {
            p.active = false;
            bhp -= p.dmg || 10;
            const boss = L_DATA[lvl];
            const percent = Math.max(0, (bhp / boss.hp) * 100);
            document.getElementById('boss-hp').style.width = `${percent}%`;
            if (bhp <= 0) { end(true); return; }
            continue;
        }
        if (p.x < -50 || p.x > canvas.width + 50) p.active = false;
    }
    projs = projs.filter(p => p.active);
}

function end(w) {
    over = true;
    const s = document.getElementById('game-over-screen'), t = document.getElementById('game-over-title'), b = document.getElementById('game-over-sub');
    s.classList.remove('hidden');
    t.innerText = w ? "VICTORY ACHIEVED!" : "GAME OVER";
    t.style.color = w ? "#00ffcc" : "#ff4d4d";
    b.innerText = w ? "You defeated this boss! New loot may appear!" : "Press R to retry.";
    if (w) {
        if (!cleared.includes(lvl)) { cleared.push(lvl); localStorage.setItem('parry_cleared', JSON.stringify(cleared)); }
        if (!hitTaken) unlockBadge('flawless');
        if (cleared.length >= maxL) unlockBadge('champion');
        checkLootDrops();
        
        // Check for Collector badge (all shields AND all helmets)
        const allShields = ['default', 'brute', 'chrono', 'resonance', 'chaos', 'mirror', 'collector'];
        const allHelmets = ['recruit', 'brute', 'twin', 'triad', 'chaos', 'archmage', 'completionist'];
        const hasAllShields = allShields.every(shield => ownedShields.includes(shield));
        const hasAllHelmets = allHelmets.every(helmet => ownedHelmets.includes(helmet));
        
        if (hasAllShields && hasAllHelmets && !badges.includes('collector')) {
            unlockBadge('collector');
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 270);
    ctx.lineTo(canvas.width, 270);
    ctx.stroke();
    
    let bCol = isWaitingToStart ? '#455a64' : L_DATA[lvl].col;
    ctx.fillStyle = bCol;
    ctx.shadowBlur = isWaitingToStart ? 0 : 15;
    ctx.shadowColor = bCol;
    ctx.beginPath();
    ctx.moveTo(B.x + B.w / 2, B.y);
    ctx.lineTo(B.x, B.y + B.h);
    ctx.lineTo(B.x + B.w, B.y + B.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(B.x + 12, B.y + 15, 26, 20);
    ctx.fillStyle = isWaitingToStart ? '#555555' : '#ff3333';
    ctx.fillRect(B.x + 15, B.y + 22, 7, 4);
    ctx.fillRect(B.x + 28, B.y + 22, 7, 4);
    
    ctx.save();
    let kc = PLAYER_COLOR, aa = '#45a29e';
    if (P.st === 'miss') { kc = '#555555'; aa = '#333333'; }
    else if (P.st === 'success') { kc = '#00ffcc'; aa = '#ffffff'; }
    ctx.fillStyle = '#451212';
    ctx.beginPath();
    ctx.moveTo(P.x - 10, P.y - 10);
    ctx.lineTo(P.x - 35 + Math.sin(Date.now() / 150) * 8, P.y + 20);
    ctx.lineTo(P.x - 10, P.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = kc;
    ctx.shadowBlur = 15;
    ctx.shadowColor = kc;
    ctx.fillRect(P.x - 15, P.y - 20, 30, 40);
    ctx.fillStyle = '#1f2833';
    ctx.fillRect(P.x - 5, P.y - 15, 20, 10);
    ctx.fillStyle = aa;
    ctx.fillRect(P.x, P.y - 12, 15, 3);
    ctx.beginPath();
    ctx.arc(P.x - 5, P.y - 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    const stats = getActiveStats();
    ctx.lineWidth = 5;
    if (P.st === 'parrying' || P.st === 'success') ctx.strokeStyle = '#ffffff';
    else if (P.st === 'miss') ctx.strokeStyle = '#ff3333';
    else ctx.strokeStyle = PLAYER_COLOR;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(P.x + S_OFF, P.y - 25);
    ctx.lineTo(P.x + S_OFF, P.y + 25);
    ctx.stroke();
    
    projs.forEach(p => {
        if (!p.active) return;
        ctx.save();
        ctx.fillStyle = p.color || (p.type === 'in' ? '#ffb300' : PLAYER_COLOR);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Draw parry quality messages
    parryMessages.forEach(msg => {
        const alpha = Math.min(1, msg.life / 30);
        ctx.font = `bold ${18 + (30 - msg.life) / 3}px monospace`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = msg.color;
        ctx.fillStyle = msg.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(msg.text, msg.x, msg.y);
        ctx.globalAlpha = 1;
    });
    
    if (isWaitingToStart) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("CHOOSE YOUR OPPONENT TO START", canvas.width / 2, canvas.height / 2 - 20);
    }
    ctx.restore();
}

// Badge Book event listeners
document.addEventListener('DOMContentLoaded', () => {
    const viewBtn = document.getElementById('view-badges-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', openBadgeViewer);
    }
    
    const closeBtn = document.getElementById('close-badge-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBadgeModal);
    }
    
    const modal = document.getElementById('badge-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBadgeModal();
        });
    }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

reset();
renderInventoryUI();
updateMaxHp();
window.perfectCount = 0;
gameLoop();