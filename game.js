const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
let hp = 3, lvl = 0, bhp = 100, score = 0, combo = 0, maxCombo = 0, over = false, projs = [], bCount = 0, sTime = 60, shake = 0, sTimers = [], isWaitingToStart = true, hitTaken = false;
let activeShield = 'default';
let activeHelmet = 'recruit';
let activeSword = 'none';
let parryMessages = [];
let reviveUsed = false;
let reviveMessage = '';
let reviveMessageTimer = 0;

// Sword system variables
let ownedSwords = JSON.parse(localStorage.getItem('parry_swords')) || ['none'];
let swordCooldown = 0;
let swordCooldownMax = 360;
let swordBuffDuration = 180;
let swordBuffActive = false;
let swordBuffRemaining = 0;
let activeSwordBuff = null;

// Level & Skill System
let playerLevel = JSON.parse(localStorage.getItem('parry_level')) || 1;
let playerXP = JSON.parse(localStorage.getItem('parry_xp')) || 0;
let skillPoints = JSON.parse(localStorage.getItem('parry_skill_points')) || 0;

// Skill Tree Data - Clean default values
let skillTree = JSON.parse(localStorage.getItem('parry_skill_tree')) || {
    // Offense
    sharpenedBlade: 0,
    doubleStrike: 0,
    criticalParry: 0,
    executioner: 0,
    masterReflexes: 0,
    // Defense
    toughSkin: 0,
    quickRecovery: 0,
    parryHeal: 0,
    ironWill: 0,
    reflectiveArmor: 0,
    // Utility
    luckyFinder: 0,
    fastLearner: 0,
    treasureHunter: 0,
    xpBooster: 0
};

const S_OFF = 30, maxL = 5, P = {x: 150, y: 250, st: 'idle', tm: 0}, B = {x: 650, y: 230, w: 50, h: 80}, P_WIN = 25;

// Inventory data
let cleared = JSON.parse(localStorage.getItem('parry_cleared')) || [];
let badges = JSON.parse(localStorage.getItem('parry_badges')) || [];
let ownedShields = JSON.parse(localStorage.getItem('parry_shields')) || ['default'];
let ownedHelmets = JSON.parse(localStorage.getItem('parry_helmets')) || ['recruit'];

const PLAYER_COLOR = '#66fcf1';
const PLAYER_GLOW = '#88ffff';

const L_DATA = {
    1: {hp: 100, spd: 5, col: '#ff4d4d', glow: '#ff8888', t: "ST1: BRUTE", dropShield: 'brute', dropHelmet: 'brute', dropSword: 'brute', startDelay: 45, baseChance: 0.20, xp: 10},
    2: {hp: 120, spd: 6, col: '#bf55ec', glow: '#d98eff', t: "ST2: TWIN", dropShield: 'chrono', dropHelmet: 'twin', dropSword: 'twin', startDelay: 50, baseChance: 0.15, xp: 20},
    3: {hp: 130, spd: 6.5, col: '#3498db', glow: '#6ec4ff', t: "ST3: TRIAD", dropShield: 'resonance', dropHelmet: 'triad', dropSword: 'triad', startDelay: 55, baseChance: 0.10, xp: 30},
    4: {hp: 150, spd: 7, col: '#f1c40f', glow: '#ffe066', t: "ST4: CHAOS", dropShield: 'chaos', dropHelmet: 'chaos', dropSword: 'chaos', startDelay: 60, baseChance: 0.05, xp: 40},
    5: {hp: 200, spd: 8, col: '#e74c3c', glow: '#ff7777', t: "FINAL STAGE: ARCHMAGE", dropShield: 'mirror', dropHelmet: 'archmage', dropSword: 'archmage', startDelay: 70, baseChance: 0.02, xp: 50}
};

const SWORD_DATA = {
    none: { name: "No Sword", ico: "⚔️", boss: 0, desc: "Unequip your sword. No ability.", cooldown: "" },
    brute: { name: "Brute Cleaver", ico: "🔴", boss: 1, buffParryWindow: 0.25, desc: "For 3 seconds: +25% parry window", cooldown: "6 second cooldown" },
    twin: { name: "Twin Fangs", ico: "🟣", boss: 2, buffSlow: 0.35, desc: "For 3 seconds: Slows projectiles by 35%", cooldown: "6 second cooldown" },
    triad: { name: "Triad Edge", ico: "🔵", boss: 3, buffReflectOnHit: 0.20, desc: "For 3 seconds: 20% reflect on hit chance", cooldown: "6 second cooldown" },
    chaos: { name: "Chaos Saber", ico: "🟡", boss: 4, buffHealParry: 0.25, desc: "For 3 seconds: 25% heal on parry chance", cooldown: "6 second cooldown" },
    archmage: { name: "Archmage Blade", ico: "💠", boss: 5, buffExtraReplica: 0.35, buffExtraHeal: 0.20, desc: "For 3 seconds: 35% extra replica + 20% heal on parry", cooldown: "6 second cooldown" }
};

const SHIELD_STATS = {
    default: { name: "Default Core", ico: "🔘", desc: "Standard shield. Parry sends fireball back.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    brute: { name: "Brute's Bulwark", ico: "🔴", desc: "+25% parry window.", parryWindow: 0.25, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chrono: { name: "Chrono Deflector", ico: "🟣", desc: "Slows projectiles by 20%.", parryWindow: 0, slow: 0.20, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    resonance: { name: "Resonance Ward", ico: "🔵", desc: "10% chance to reflect fireball back when HIT (instead of taking damage).", parryWindow: 0, slow: 0, reflectOnHit: 0.10, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chaos: { name: "Chaos Core", ico: "🟡", desc: "15% chance to heal 1 heart on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0.15, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    mirror: { name: "Cosmic Mirror", ico: "💠", desc: "20% chance for extra replica + 10% heal on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0.20, extraHeal: 0.10, maxHpBonus: 0 },
    novice: { name: "Novice Collector Core", ico: "📦", desc: "2x drop chance from bosses. No duplicate drops.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    advanced: { name: "Advanced Collector Core", ico: "💎", desc: "3x drop chance from bosses. No duplicate drops.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 }
};

const HELMET_STATS = {
    recruit: { name: "Recruit's Sallet", ico: "🪖", desc: "+1 max HP.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 1 },
    brute: { name: "Brute's Horned Helm", ico: "🔴", desc: "+40% parry window.", parryWindow: 0.40, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    twin: { name: "Twin's Linked Visor", ico: "🟣", desc: "Slows projectiles by 35%.", parryWindow: 0, slow: 0.35, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    triad: { name: "Triad's Prism Helm", ico: "🔵", desc: "20% chance to reflect fireball back when HIT (instead of taking damage).", parryWindow: 0, slow: 0, reflectOnHit: 0.20, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    chaos: { name: "Chaos Crown", ico: "🟡", desc: "25% chance to heal 1 heart on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0.25, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 },
    archmage: { name: "Archmage's Star-Cap", ico: "💠", desc: "35% chance for extra replica + 20% heal on parry.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0.35, extraHeal: 0.20, maxHpBonus: 0 },
    hardmode: { name: "Hard Mode Helm", ico: "💀", desc: "-2 max HP. For those who seek a challenge.", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: -2 },
    relentless: { name: "Relentless Helmet", ico: "🔥", desc: "Revives you to max HP upon death (once per run).", parryWindow: 0, slow: 0, reflectOnHit: 0, healParry: 0, extraReplica: 0, extraHeal: 0, maxHpBonus: 0 }
};

const BADGE_DATA = {
    flawless: { name: "🛡️ UNTOUCHABLE", desc: "Beat any boss without taking damage", reward: "No reward (achievement only)" },
    combo: { name: "🔥 COMBO KING", desc: "Get a 5x Parry Combo", reward: "No reward (achievement only)" },
    reflex: { name: "⚡ FAST HANDS", desc: "Parry at lightning speed (within 10px of shield)", reward: "No reward (achievement only)" },
    champion: { name: "👑 CHAMPION", desc: "Defeat all 5 boss styles", reward: "No reward (achievement only)" },
    perfectionist: { name: "🎯 PERFECTIONIST", desc: "Get 5 PERFECT parries in one fight", reward: "PERFECT parries deal 15 damage (instead of 10)" },
    novice: { name: "📦 NOVICE COLLECTOR", desc: "Collect any 5 boss drops (shields, helmets, or swords from ST1-ST5)", reward: "Unlocks Novice Collector Core 📦 (2x drop chance from bosses)" },
    advanced: { name: "💎 ADVANCED COLLECTOR", desc: "Collect all boss drops from ST1-ST5", reward: "Unlocks Advanced Collector Core 💎 (3x drop chance from bosses)" },
    relentless: { name: "🔥 RELENTLESS", desc: "Defeat the ARCHMAGE (ST5) with Default Shield, No Sword, and Hard Mode Helm", reward: "Unlocks Relentless Helmet (revives to max HP upon death, once per run)" },
    completionist: { name: "🏆 COMPLETIONIST", desc: "Unlock all other badges", reward: "Unobtainable for now" }
};

// Skill definitions
const SKILLS = {
    offense: [
        { id: 'sharpenedBlade', name: 'Sharpened\nBlade', icon: '🗡️', maxLevel: 5, desc: 'Each level adds +1 damage to reflected fireballs' },
        { id: 'doubleStrike', name: 'Double\nStrike', icon: '⚡', maxLevel: 3, desc: 'Each level adds +5% chance to spawn an extra replica' },
        { id: 'criticalParry', name: 'Critical\nParry', icon: '💥', maxLevel: 3, desc: 'Each level adds +10% critical damage' },
        { id: 'executioner', name: 'Executioner', icon: '🔪', maxLevel: 1, desc: 'Instantly kill boss when below 10% HP' },
        { id: 'masterReflexes', name: 'Master\nReflexes', icon: '👁️', maxLevel: 3, desc: 'Each level adds +5% parry window' }
    ],
    defense: [
        { id: 'toughSkin', name: 'Tough\nSkin', icon: '🛡️', maxLevel: 1, desc: '+2 max HP' },
        { id: 'quickRecovery', name: 'Quick\nRecovery', icon: '💚', maxLevel: 3, desc: 'Each level reduces damage taken by 5%' },
        { id: 'parryHeal', name: 'Parry\nHeal', icon: '❤️', maxLevel: 3, desc: 'Each level adds +2% heal chance on parry' },
        { id: 'ironWill', name: 'Iron\nWill', icon: '💪', maxLevel: 3, desc: 'Each level adds +3% chance to ignore damage' },
        { id: 'reflectiveArmor', name: 'Reflective\nArmor', icon: '🔄', maxLevel: 3, desc: 'Each level adds +3% reflect on hit chance' }
    ],
    utility: [
        { id: 'luckyFinder', name: 'Lucky\nFinder', icon: '🍀', maxLevel: 3, desc: 'Each level adds +2% drop chance' },
        { id: 'fastLearner', name: 'Fast\nLearner', icon: '📚', maxLevel: 3, desc: 'Each level adds +5% XP gain' },
        { id: 'treasureHunter', name: 'Treasure\nHunter', icon: '⭐', maxLevel: 3, desc: 'Each level adds +5% double drop chance' },
        { id: 'xpBooster', name: 'XP\nBooster', icon: '💰', maxLevel: 3, desc: 'Each level adds +10 XP per boss kill' }
    ]
};

function getXPNeeded() {
    return 100 + ((playerLevel - 1) * 50);
}

function addXP(amount) {
    let xpGain = amount;
    let fastLearnerBonus = 1 + (skillTree.fastLearner * 0.05);
    xpGain = Math.floor(xpGain * fastLearnerBonus);
    
    playerXP += xpGain;
    let xpNeeded = getXPNeeded();
    let leveledUp = false;
    
    while (playerXP >= xpNeeded) {
        playerXP -= xpNeeded;
        playerLevel++;
        skillPoints++;
        xpNeeded = getXPNeeded();
        leveledUp = true;
        document.getElementById('drop-alert').innerHTML = `⬆️ LEVEL UP! Now Level ${playerLevel}! +1 Skill Point! ⬆️`;
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("LEVEL UP")) 
                document.getElementById('drop-alert').innerHTML = "";
        }, 3000);
    }
    
    localStorage.setItem('parry_level', playerLevel);
    localStorage.setItem('parry_xp', playerXP);
    localStorage.setItem('parry_skill_points', skillPoints);
    
    updateLevelUI();
    updateSkillTreeUI();
    return leveledUp;
}

function updateLevelUI() {
    document.getElementById('player-level').innerText = playerLevel;
    document.getElementById('player-xp').innerText = playerXP;
    const xpNeeded = getXPNeeded();
    document.getElementById('player-xp-needed').innerText = xpNeeded;
    const percent = (playerXP / xpNeeded) * 100;
    document.getElementById('xp-progress-fill').style.width = `${percent}%`;
    document.getElementById('skill-points-display').innerText = skillPoints;
}

function getSkillEffect(skillId) {
    const level = skillTree[skillId];
    switch(skillId) {
        case 'sharpenedBlade': return level;
        case 'doubleStrike': return level * 5;
        case 'criticalParry': return level * 10;
        case 'masterReflexes': return level * 5;
        case 'quickRecovery': return level * 5;
        case 'parryHeal': return level * 2;
        case 'ironWill': return level * 3;
        case 'reflectiveArmor': return level * 3;
        case 'luckyFinder': return level * 2;
        case 'fastLearner': return level * 5;
        case 'treasureHunter': return level * 5;
        case 'xpBooster': return level * 10;
        case 'toughSkin': return level === 1 ? 2 : 0;
        case 'executioner': return level;
        default: return 0;
    }
}

function canUpgradeSkill(skillId, branch) {
    const skill = branch.find(s => s.id === skillId);
    if (!skill) return false;
    if (skillTree[skillId] >= skill.maxLevel) return false;
    if (skillPoints <= 0) return false;
    
    const index = branch.findIndex(s => s.id === skillId);
    if (index === 0) return true;
    const prevSkill = branch[index - 1];
    if (skillTree[prevSkill.id] === 0) return false;
    
    return true;
}

function upgradeSkill(skillId) {
    let branch = null;
    for (let b of Object.values(SKILLS)) {
        if (b.find(s => s.id === skillId)) {
            branch = b;
            break;
        }
    }
    if (!branch) return false;
    if (!canUpgradeSkill(skillId, branch)) return false;
    
    skillTree[skillId]++;
    skillPoints--;
    
    localStorage.setItem('parry_skill_tree', JSON.stringify(skillTree));
    localStorage.setItem('parry_skill_points', skillPoints);
    
    updateSkillTreeUI();
    updateLevelUI();
    return true;
}

function getSkillStatus(skillId, branch) {
    const skill = branch.find(s => s.id === skillId);
    if (!skill) return 'locked';
    if (skillTree[skillId] >= skill.maxLevel) return 'unlocked';
    if (canUpgradeSkill(skillId, branch)) return 'available';
    return 'locked';
}

function updateSkillTreeUI() {
    // Offense branch
    const offenseContainer = document.getElementById('offense-tree');
    if (offenseContainer) {
        offenseContainer.innerHTML = '';
        SKILLS.offense.forEach((skill, idx) => {
            const level = skillTree[skill.id];
            const status = getSkillStatus(skill.id, SKILLS.offense);
            const node = document.createElement('div');
            node.className = `skill-node ${status}`;
            node.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">${level}/${skill.maxLevel}</div>
                <div class="skill-cost">${status === 'available' ? '⬆️ 1 SP' : (status === 'unlocked' ? 'MAX' : '🔒')}</div>
            `;
            if (status !== 'locked') {
                node.onclick = () => showSkillConfirm(skill.id, SKILLS.offense);
            }
            offenseContainer.appendChild(node);
            if (idx < SKILLS.offense.length - 1) {
                const connector = document.createElement('div');
                connector.className = `skill-connector ${status === 'locked' && skillTree[SKILLS.offense[idx+1]?.id] === 0 ? 'locked' : ''}`;
                offenseContainer.appendChild(connector);
            }
        });
    }
    
    // Defense branch
    const defenseContainer = document.getElementById('defense-tree');
    if (defenseContainer) {
        defenseContainer.innerHTML = '';
        SKILLS.defense.forEach((skill, idx) => {
            const level = skillTree[skill.id];
            const status = getSkillStatus(skill.id, SKILLS.defense);
            const node = document.createElement('div');
            node.className = `skill-node ${status}`;
            node.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">${level}/${skill.maxLevel}</div>
                <div class="skill-cost">${status === 'available' ? '⬆️ 1 SP' : (status === 'unlocked' ? 'MAX' : '🔒')}</div>
            `;
            if (status !== 'locked') {
                node.onclick = () => showSkillConfirm(skill.id, SKILLS.defense);
            }
            defenseContainer.appendChild(node);
            if (idx < SKILLS.defense.length - 1) {
                const connector = document.createElement('div');
                connector.className = `skill-connector ${status === 'locked' && skillTree[SKILLS.defense[idx+1]?.id] === 0 ? 'locked' : ''}`;
                defenseContainer.appendChild(connector);
            }
        });
    }
    
    // Utility branch
    const utilityContainer = document.getElementById('utility-tree');
    if (utilityContainer) {
        utilityContainer.innerHTML = '';
        SKILLS.utility.forEach((skill, idx) => {
            const level = skillTree[skill.id];
            const status = getSkillStatus(skill.id, SKILLS.utility);
            const node = document.createElement('div');
            node.className = `skill-node ${status}`;
            node.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">${level}/${skill.maxLevel}</div>
                <div class="skill-cost">${status === 'available' ? '⬆️ 1 SP' : (status === 'unlocked' ? 'MAX' : '🔒')}</div>
            `;
            if (status !== 'locked') {
                node.onclick = () => showSkillConfirm(skill.id, SKILLS.utility);
            }
            utilityContainer.appendChild(node);
            if (idx < SKILLS.utility.length - 1) {
                const connector = document.createElement('div');
                connector.className = `skill-connector ${status === 'locked' && skillTree[SKILLS.utility[idx+1]?.id] === 0 ? 'locked' : ''}`;
                utilityContainer.appendChild(connector);
            }
        });
    }
}

let pendingSkillId = null;
let pendingBranch = null;

function showSkillConfirm(skillId, branch) {
    const skill = branch.find(s => s.id === skillId);
    if (!skill) return;
    
    const currentLevel = skillTree[skillId];
    const nextLevel = currentLevel + 1;
    const isMaxed = currentLevel >= skill.maxLevel;
    
    if (isMaxed) {
        document.getElementById('drop-alert').innerHTML = `⚠️ ${skill.name.replace('\n', ' ')} is already max level! ⚠️`;
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("already max level"))
                document.getElementById('drop-alert').innerHTML = "";
        }, 2000);
        return;
    }
    
    if (skillPoints <= 0) {
        document.getElementById('drop-alert').innerHTML = `⚠️ Not enough Skill Points! Need 1 SP ⚠️`;
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("Not enough Skill Points"))
                document.getElementById('drop-alert').innerHTML = "";
        }, 2000);
        return;
    }
    
    const index = branch.findIndex(s => s.id === skillId);
    let requirementText = "None (starting skill)";
    let canUpgrade = true;
    
    if (index > 0) {
        const prevSkill = branch[index - 1];
        const prevLevel = skillTree[prevSkill.id];
        if (prevLevel === 0) {
            canUpgrade = false;
            requirementText = `${prevSkill.name.replace('\n', ' ')} (required)`;
        } else {
            requirementText = `${prevSkill.name.replace('\n', ' ')} Lv.${prevLevel}`;
        }
    }
    
    if (!canUpgrade) {
        document.getElementById('drop-alert').innerHTML = `⚠️ Requires ${requirementText} first! ⚠️`;
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("Requires"))
                document.getElementById('drop-alert').innerHTML = "";
        }, 2000);
        return;
    }
    
    pendingSkillId = skillId;
    pendingBranch = branch;
    
    let effectText = skill.desc;
    if (skill.maxLevel > 1) {
        effectText = `${skill.desc}\nCurrent: +${getSkillEffect(skillId)} → Next: +${getSkillEffect(skillId) + (skill.id === 'sharpenedBlade' ? 1 : skill.id === 'doubleStrike' ? 5 : skill.id === 'criticalParry' ? 10 : skill.id === 'masterReflexes' ? 5 : skill.id === 'quickRecovery' ? 5 : skill.id === 'parryHeal' ? 2 : skill.id === 'ironWill' ? 3 : skill.id === 'reflectiveArmor' ? 3 : skill.id === 'luckyFinder' ? 2 : skill.id === 'fastLearner' ? 5 : skill.id === 'treasureHunter' ? 5 : skill.id === 'xpBooster' ? 10 : 0)}`;
    }
    
    document.getElementById('confirm-skill-icon').innerText = skill.icon;
    document.getElementById('confirm-skill-name').innerText = skill.name.replace('\n', ' ');
    document.getElementById('confirm-skill-current').innerText = `${currentLevel}/${skill.maxLevel}`;
    document.getElementById('confirm-skill-next').innerText = `${nextLevel}/${skill.maxLevel}`;
    document.getElementById('confirm-skill-effect').innerHTML = effectText.replace(/\n/g, '<br>');
    document.getElementById('confirm-skill-requirement').innerHTML = requirementText;
    
    document.getElementById('skill-confirm-modal').classList.remove('hidden');
}

function confirmUpgrade() {
    if (!pendingSkillId || !pendingBranch) return;
    
    const success = upgradeSkill(pendingSkillId);
    if (success) {
        const skill = pendingBranch.find(s => s.id === pendingSkillId);
        document.getElementById('drop-alert').innerHTML = `✅ ${skill.name.replace('\n', ' ')} upgraded! ✅`;
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("upgraded"))
                document.getElementById('drop-alert').innerHTML = "";
        }, 2000);
    }
    
    pendingSkillId = null;
    pendingBranch = null;
    document.getElementById('skill-confirm-modal').classList.add('hidden');
    updateSkillTreeUI();
    updateLevelUI();
}

function cancelUpgrade() {
    pendingSkillId = null;
    pendingBranch = null;
    document.getElementById('skill-confirm-modal').classList.add('hidden');
}

function resetAllSkills() {
    if (confirm("⚠️ WARNING: This will refund ALL your skill points. You can respend them on different skills. Your level and XP will NOT be affected. Are you sure?")) {
        // Calculate total skill points spent
        let totalSpent = 0;
        for (let skill in skillTree) {
            totalSpent += skillTree[skill];
        }
        
        // Add refunded points to current skill points
        skillPoints += totalSpent;
        
        // Reset all skills to 0
        skillTree = {
            sharpenedBlade: 0, doubleStrike: 0, criticalParry: 0, executioner: 0, masterReflexes: 0,
            toughSkin: 0, quickRecovery: 0, parryHeal: 0, ironWill: 0, reflectiveArmor: 0,
            luckyFinder: 0, fastLearner: 0, treasureHunter: 0, xpBooster: 0
        };
        
        // Save to localStorage
        localStorage.setItem('parry_skill_tree', JSON.stringify(skillTree));
        localStorage.setItem('parry_skill_points', skillPoints);
        
        // Update UI
        updateLevelUI();
        updateSkillTreeUI();
        
        document.getElementById('drop-alert').innerHTML = "🔄 Skills reset! You can now respend your skill points. 🔄";
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML.includes("reset"))
                document.getElementById('drop-alert').innerHTML = "";
        }, 3000);
    }
}

function getMaxHp() {
    const shield = SHIELD_STATS[activeShield] || SHIELD_STATS.default;
    const helmet = HELMET_STATS[activeHelmet] || HELMET_STATS.recruit;
    let bonus = shield.maxHpBonus + helmet.maxHpBonus;
    let baseMax = Math.max(1, 3 + bonus);
    const toughSkinBonus = getSkillEffect('toughSkin');
    return baseMax + toughSkinBonus;
}

function getActiveStatsWithSkills() {
    const shield = SHIELD_STATS[activeShield] || SHIELD_STATS.default;
    const helmet = HELMET_STATS[activeHelmet] || HELMET_STATS.recruit;
    
    let parryWindow = shield.parryWindow + helmet.parryWindow + (getSkillEffect('masterReflexes') / 100);
    let slow = shield.slow + helmet.slow;
    let reflectOnHit = shield.reflectOnHit + helmet.reflectOnHit + (getSkillEffect('reflectiveArmor') / 100);
    let healParry = shield.healParry + helmet.healParry + (getSkillEffect('parryHeal') / 100);
    let extraReplica = shield.extraReplica + helmet.extraReplica + (getSkillEffect('doubleStrike') / 100);
    let extraHeal = shield.extraHeal + helmet.extraHeal;
    
    if (swordBuffActive && activeSwordBuff) {
        if (activeSwordBuff.parryWindow) parryWindow += activeSwordBuff.parryWindow;
        if (activeSwordBuff.slow) slow += activeSwordBuff.slow;
        if (activeSwordBuff.reflectOnHit) reflectOnHit += activeSwordBuff.reflectOnHit;
        if (activeSwordBuff.healParry) healParry += activeSwordBuff.healParry;
        if (activeSwordBuff.extraReplica) extraReplica += activeSwordBuff.extraReplica;
        if (activeSwordBuff.extraHeal) extraHeal += activeSwordBuff.extraHeal;
    }
    
    return { parryWindow, slow, reflectOnHit, healParry, extraReplica, extraHeal };
}

function getDamageWithSkills(baseDamage) {
    let damage = baseDamage + getSkillEffect('sharpenedBlade');
    const critChance = 0.15;
    const critDamageBonus = getSkillEffect('criticalParry') / 100;
    if (Math.random() < critChance) {
        damage = Math.floor(damage * (1.5 + critDamageBonus));
    }
    return damage;
}

function getDropMultiplier() {
    if (activeShield === 'advanced') return 3;
    if (activeShield === 'novice') return 2;
    return 1;
}

function updateMaxHp() {
    const maxHp = getMaxHp();
    if (hp > maxHp) hp = maxHp;
    let hearts = '';
    for (let i = 0; i < maxHp; i++) hearts += (i < hp) ? '❤️ ' : '🖤 ';
    document.getElementById('player-hp').innerHTML = `HP: ${hearts}`;
    
    if (reviveMessageTimer > 0) {
        document.getElementById('player-hp').innerHTML += `<span style="color: #ff6600; margin-left: 10px;"> 🔥 ${reviveMessage} 🔥</span>`;
    }
}

function addProjectile(speed, type = 'in', x = B.x, customDamage = 10, customColor = null) {
    const stats = getActiveStatsWithSkills();
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

function isBossComplete(bossLevel) {
    const boss = L_DATA[bossLevel];
    const hasShield = ownedShields.includes(boss.dropShield);
    const hasHelmet = ownedHelmets.includes(boss.dropHelmet);
    const hasSword = ownedSwords.includes(boss.dropSword);
    return hasShield && hasHelmet && hasSword;
}

function checkLootDrops() {
    const boss = L_DATA[lvl];
    let drops = [];
    let dropMultiplier = getDropMultiplier();
    let luckyBonus = getSkillEffect('luckyFinder') / 100;
    let baseChance = boss.baseChance * dropMultiplier + luckyBonus;
    baseChance = Math.min(0.9, baseChance);
    
    if (boss.dropShield && !ownedShields.includes(boss.dropShield)) {
        if (Math.random() < baseChance) {
            ownedShields.push(boss.dropShield);
            drops.push(`🛡️ ${SHIELD_STATS[boss.dropShield].name}`);
        }
    }
    if (boss.dropHelmet && !ownedHelmets.includes(boss.dropHelmet)) {
        if (Math.random() < baseChance) {
            ownedHelmets.push(boss.dropHelmet);
            drops.push(`🪖 ${HELMET_STATS[boss.dropHelmet].name}`);
        }
    }
    if (boss.dropSword && !ownedSwords.includes(boss.dropSword)) {
        if (Math.random() < baseChance) {
            ownedSwords.push(boss.dropSword);
            drops.push(`⚔️ ${SWORD_DATA[boss.dropSword].name}`);
        }
    }
    
    let treasureBonus = getSkillEffect('treasureHunter') / 100;
    if (drops.length > 0 && treasureBonus > 0 && drops.length < 3) {
        if (Math.random() < treasureBonus) {
            let availableDrops = [];
            if (!ownedShields.includes(boss.dropShield)) availableDrops.push(`🛡️ ${SHIELD_STATS[boss.dropShield].name}`);
            if (!ownedHelmets.includes(boss.dropHelmet)) availableDrops.push(`🪖 ${HELMET_STATS[boss.dropHelmet].name}`);
            if (!ownedSwords.includes(boss.dropSword)) availableDrops.push(`⚔️ ${SWORD_DATA[boss.dropSword].name}`);
            if (availableDrops.length > 0) {
                const extraDrop = availableDrops[Math.floor(Math.random() * availableDrops.length)];
                drops.push(`⭐ ${extraDrop} (DOUBLE!)`);
            }
        }
    }
    
    if (drops.length === 3) {
        document.getElementById('drop-alert').innerHTML = `🏆⭐ EPIC DROP: ${drops[0]} + ${drops[1]} + ${drops[2]}! ⭐🏆`;
    } else if (drops.length === 2) {
        document.getElementById('drop-alert').innerHTML = `🏆 DOUBLE DROP: ${drops[0]} + ${drops[1]}! 🏆`;
    } else if (drops.length === 1) {
        document.getElementById('drop-alert').innerHTML = `🏆 DROP: ${drops[0]}! 🏆`;
    }
    
    if (drops.length > 0) {
        localStorage.setItem('parry_shields', JSON.stringify(ownedShields));
        localStorage.setItem('parry_helmets', JSON.stringify(ownedHelmets));
        localStorage.setItem('parry_swords', JSON.stringify(ownedSwords));
        renderInventoryUI();
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
    reviveUsed = false;
    reviveMessage = '';
    reviveMessageTimer = 0;
    swordCooldown = 0;
    swordBuffActive = false;
    swordBuffRemaining = 0;
    activeSwordBuff = null;
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
    if (!isWaitingToStart && !over) {
        document.getElementById('drop-alert').innerHTML = "⛔ Cannot change equipment during a fight! ⛔";
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === "⛔ Cannot change equipment during a fight! ⛔") 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1500);
        return;
    }
    
    if (ownedShields.includes(id)) {
        pendingType = 'shield';
        pendingId = id;
        const details = SHIELD_STATS[id];
        document.getElementById('modal-icon').innerHTML = details.ico;
        document.getElementById('modal-title').innerHTML = details.name;
        document.getElementById('modal-desc').innerHTML = details.desc;
        document.getElementById('modal-equip-btn').innerHTML = 'Equip Shield';
        document.getElementById('item-modal').classList.remove('hidden');
    }
}

function clickHelmet(id) {
    if (!isWaitingToStart && !over) {
        document.getElementById('drop-alert').innerHTML = "⛔ Cannot change equipment during a fight! ⛔";
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === "⛔ Cannot change equipment during a fight! ⛔") 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1500);
        return;
    }
    
    if (ownedHelmets.includes(id)) {
        pendingType = 'helmet';
        pendingId = id;
        const details = HELMET_STATS[id];
        document.getElementById('modal-icon').innerHTML = details.ico;
        document.getElementById('modal-title').innerHTML = details.name;
        document.getElementById('modal-desc').innerHTML = details.desc;
        document.getElementById('modal-equip-btn').innerHTML = 'Equip Helmet';
        document.getElementById('item-modal').classList.remove('hidden');
    }
}

function clickSword(id) {
    if (!isWaitingToStart && !over) {
        document.getElementById('drop-alert').innerHTML = "⛔ Cannot change equipment during a fight! ⛔";
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === "⛔ Cannot change equipment during a fight! ⛔") 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1500);
        return;
    }
    
    if (id === 'none') {
        if (activeSword === 'none') {
            activeSword = null;
        } else {
            activeSword = 'none';
        }
        localStorage.setItem('parry_active_sword', activeSword);
        renderSwordUI();
        return;
    }
    
    if (ownedSwords.includes(id)) {
        pendingType = 'sword';
        pendingId = id;
        const details = SWORD_DATA[id];
        document.getElementById('modal-icon').innerHTML = details.ico;
        document.getElementById('modal-title').innerHTML = details.name;
        document.getElementById('modal-desc').innerHTML = `${details.desc} | ${details.cooldown}`;
        document.getElementById('modal-equip-btn').innerHTML = 'Equip Sword';
        document.getElementById('item-modal').classList.remove('hidden');
    }
}

function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    pendingType = null;
    pendingId = null;
}

function confirmEquip() {
    if (!isWaitingToStart && !over) {
        document.getElementById('drop-alert').innerHTML = "⛔ Cannot change equipment during a fight! ⛔";
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === "⛔ Cannot change equipment during a fight! ⛔") 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1500);
        closeModal();
        return;
    }
    
    if (pendingType === 'shield') {
        activeShield = pendingId;
    } else if (pendingType === 'helmet') {
        activeHelmet = pendingId;
    } else if (pendingType === 'sword') {
        activeSword = pendingId;
        localStorage.setItem('parry_active_sword', activeSword);
    }
    const maxHp = getMaxHp();
    if (hp > maxHp) hp = maxHp;
    updateMaxHp();
    renderInventoryUI();
    closeModal();
}

function useSwordAbility() {
    if (!activeSword || activeSword === 'none') {
        document.getElementById('drop-alert').innerHTML = "❌ No sword equipped! Press F to use sword ability ❌";
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === "❌ No sword equipped! Press F to use sword ability ❌") 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1500);
        return false;
    }
    
    if (swordCooldown > 0) {
        const secondsLeft = Math.ceil(swordCooldown / 60);
        document.getElementById('drop-alert').innerHTML = `⏳ Sword on cooldown! (${secondsLeft}s) ⏳`;
        setTimeout(() => { 
            if (document.getElementById('drop-alert').innerHTML === `⏳ Sword on cooldown! (${secondsLeft}s) ⏳`) 
                document.getElementById('drop-alert').innerHTML = ""; 
        }, 1000);
        return false;
    }
    
    const sword = SWORD_DATA[activeSword];
    activeSwordBuff = {};
    if (sword.buffParryWindow) activeSwordBuff.parryWindow = sword.buffParryWindow;
    if (sword.buffSlow) activeSwordBuff.slow = sword.buffSlow;
    if (sword.buffReflectOnHit) activeSwordBuff.reflectOnHit = sword.buffReflectOnHit;
    if (sword.buffHealParry) activeSwordBuff.healParry = sword.buffHealParry;
    if (sword.buffExtraReplica) activeSwordBuff.extraReplica = sword.buffExtraReplica;
    if (sword.buffExtraHeal) activeSwordBuff.extraHeal = sword.buffExtraHeal;
    
    swordBuffActive = true;
    swordBuffRemaining = swordBuffDuration;
    swordCooldown = swordCooldownMax;
    
    let buffText = `⚔️ ${sword.name} activated for 3 seconds! ⚔️`;
    
    document.getElementById('drop-alert').innerHTML = buffText;
    setTimeout(() => { 
        if (document.getElementById('drop-alert').innerHTML === buffText) 
            document.getElementById('drop-alert').innerHTML = ""; 
    }, 2000);
    
    renderSwordUI();
    return true;
}

function renderInventoryUI() {
    const allShields = ['default', 'brute', 'chrono', 'resonance', 'chaos', 'mirror', 'novice', 'advanced'];
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
    const allHelmets = ['recruit', 'brute', 'twin', 'triad', 'chaos', 'archmage', 'hardmode', 'relentless'];
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
    renderSwordUI();
}

function renderSwordUI() {
    const allSwords = ['none', 'brute', 'twin', 'triad', 'chaos', 'archmage'];
    for (let id of allSwords) {
        const el = document.getElementById('sword-' + id);
        if (el) {
            if (id === 'none') {
                if (activeSword === 'none' || (!activeSword && id === 'none')) {
                    el.className = "sword-slot active";
                } else {
                    el.className = "sword-slot unlocked";
                }
            } else if (ownedSwords.includes(id)) {
                if (activeSword === id) {
                    el.className = "sword-slot active";
                    if (swordCooldown > 0) {
                        el.classList.add('cooldown');
                    } else {
                        el.classList.remove('cooldown');
                    }
                } else {
                    el.className = "sword-slot unlocked";
                }
            } else {
                el.className = "sword-slot locked";
            }
        }
    }
    
    const swordIndicator = document.getElementById('active-sword');
    const cooldownIndicator = document.getElementById('sword-cooldown-indicator');
    if (swordIndicator) {
        if (activeSword && activeSword !== 'none') {
            swordIndicator.innerHTML = `⚔️ ${SWORD_DATA[activeSword].ico} ${SWORD_DATA[activeSword].name}`;
            if (swordCooldown > 0) {
                const secondsLeft = Math.ceil(swordCooldown / 60);
                cooldownIndicator.innerHTML = `⏳ ${secondsLeft}s`;
            } else if (swordBuffActive) {
                const secondsLeft = Math.ceil(swordBuffRemaining / 60);
                cooldownIndicator.innerHTML = `✨ BUFF: ${secondsLeft}s ✨`;
            } else {
                cooldownIndicator.innerHTML = `✅ READY`;
            }
        } else {
            swordIndicator.innerHTML = `⚔️ No Sword Equipped`;
            cooldownIndicator.innerHTML = ``;
        }
    }
}

function openSkillModal() {
    updateSkillTreeUI();
    updateLevelUI();
    document.getElementById('skill-modal').classList.remove('hidden');
}

function closeSkillModal() {
    document.getElementById('skill-modal').classList.add('hidden');
}

function checkCollectorBadges() {
    const bossDrops = [...ownedShields, ...ownedHelmets, ...ownedSwords];
    const realDrops = bossDrops.filter(item => 
        !['default', 'recruit', 'novice', 'advanced', 'hardmode', 'relentless', 'none'].includes(item)
    );
    
    if (realDrops.length >= 5 && !badges.includes('novice')) {
        unlockBadge('novice');
    }
    
    const requiredShields = ['brute', 'chrono', 'resonance', 'chaos', 'mirror'];
    const requiredHelmets = ['brute', 'twin', 'triad', 'chaos', 'archmage'];
    const requiredSwords = ['brute', 'twin', 'triad', 'chaos', 'archmage'];
    
    const hasAllShields = requiredShields.every(shield => ownedShields.includes(shield));
    const hasAllHelmets = requiredHelmets.every(helmet => ownedHelmets.includes(helmet));
    const hasAllSwords = requiredSwords.every(sword => ownedSwords.includes(sword));
    
    if (hasAllShields && hasAllHelmets && hasAllSwords && !badges.includes('advanced')) {
        unlockBadge('advanced');
    }
}

function checkCompletionistBadge() {
    const requiredBadges = ['flawless', 'combo', 'reflex', 'champion', 'perfectionist', 'novice', 'advanced', 'relentless'];
    const hasAll = requiredBadges.every(badge => badges.includes(badge));
    
    if (hasAll && !badges.includes('completionist')) {
        console.log("Completionist badge would unlock here in future update");
    }
}

function attemptRevive() {
    if (activeHelmet === 'relentless' && !reviveUsed && !over) {
        reviveUsed = true;
        const maxHp = getMaxHp();
        hp = maxHp;
        
        reviveMessage = "RELENTLESS REVIVE!";
        reviveMessageTimer = 90;
        
        updateMaxHp();
        
        document.getElementById('drop-alert').innerHTML = "🔥 REVIVED BY RELENTLESS HELMET! 🔥";
        setTimeout(() => {
            if (document.getElementById('drop-alert').innerHTML === "🔥 REVIVED BY RELENTLESS HELMET! 🔥") 
                document.getElementById('drop-alert').innerHTML = "";
        }, 2000);
        return true;
    }
    return false;
}

function unlockBadge(id) {
    if (!badges.includes(id)) {
        badges.push(id);
        localStorage.setItem('parry_badges', JSON.stringify(badges));
        renderInventoryUI();
        
        if (id === 'novice' && !ownedShields.includes('novice')) {
            ownedShields.push('novice');
            localStorage.setItem('parry_shields', JSON.stringify(ownedShields));
            renderInventoryUI();
            document.getElementById('drop-alert').innerHTML = "📦 NOVICE COLLECTOR CORE UNLOCKED! 📦";
            setTimeout(() => {
                if (document.getElementById('drop-alert').innerHTML === "📦 NOVICE COLLECTOR CORE UNLOCKED! 📦") 
                    document.getElementById('drop-alert').innerHTML = "";
            }, 2000);
        }
        
        if (id === 'advanced' && !ownedShields.includes('advanced')) {
            ownedShields.push('advanced');
            localStorage.setItem('parry_shields', JSON.stringify(ownedShields));
            renderInventoryUI();
            document.getElementById('drop-alert').innerHTML = "💎 ADVANCED COLLECTOR CORE UNLOCKED! 💎";
            setTimeout(() => {
                if (document.getElementById('drop-alert').innerHTML === "💎 ADVANCED COLLECTOR CORE UNLOCKED! 💎") 
                    document.getElementById('drop-alert').innerHTML = "";
            }, 2000);
        }
        
        if (id === 'relentless' && !ownedHelmets.includes('relentless')) {
            ownedHelmets.push('relentless');
            localStorage.setItem('parry_helmets', JSON.stringify(ownedHelmets));
            renderInventoryUI();
            document.getElementById('drop-alert').innerHTML = "🔥 RELENTLESS HELMET UNLOCKED! 🔥";
            setTimeout(() => {
                if (document.getElementById('drop-alert').innerHTML === "🔥 RELENTLESS HELMET UNLOCKED! 🔥") 
                    document.getElementById('drop-alert').innerHTML = "";
            }, 2000);
        }
        
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
    reviveUsed = false;
    reviveMessage = '';
    reviveMessageTimer = 0;
    swordCooldown = 0;
    swordBuffActive = false;
    swordBuffRemaining = 0;
    activeSwordBuff = null;
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
    renderSwordUI();
    localStorage.setItem('parry_active_sword', activeSword);
}

function openBadgeViewer() {
    const modal = document.getElementById('badge-modal');
    const badgeList = document.getElementById('badge-list');
    
    badgeList.innerHTML = '';
    
    for (const [id, data] of Object.entries(BADGE_DATA)) {
        const isUnlocked = badges.includes(id);
        const isUnobtainable = (id === 'completionist');
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge-card ${isUnlocked ? 'unlocked-badge' : 'locked-badge'}`;
        if (isUnobtainable && !isUnlocked) {
            badgeDiv.style.opacity = '0.5';
        }
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

function checkExistingProgress() {
    if (!ownedHelmets.includes('hardmode')) {
        ownedHelmets.push('hardmode');
        localStorage.setItem('parry_helmets', JSON.stringify(ownedHelmets));
        renderInventoryUI();
    }
    
    const savedSword = localStorage.getItem('parry_active_sword');
    if (savedSword && savedSword !== 'null' && ownedSwords.includes(savedSword)) {
        activeSword = savedSword;
    } else {
        activeSword = 'none';
    }
    
    checkCollectorBadges();
    updateLevelUI();
    updateSkillTreeUI();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!over && document.getElementById('item-modal').classList.contains('hidden') && document.getElementById('badge-modal').classList.contains('hidden') && document.getElementById('skill-modal').classList.contains('hidden') && document.getElementById('skill-confirm-modal').classList.contains('hidden')) {
            if (isWaitingToStart) { selectStage(1); return; }
            if (P.st === 'idle') {
                const stats = getActiveStatsWithSkills();
                P.st = 'parrying'; P.tm = 10;
                let target = null, minDist = 9999;
                projs.forEach(p => { if (p.active && p.type === 'in') { let d = p.x - (P.x + S_OFF); if (d > -5 && d < minDist) { minDist = d; target = p; } } });
                let validWindow = P_WIN + (stats.parryWindow * 40);
                if (target && minDist <= validWindow) {
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
                    
                    parryMessages.push({
                        text: quality,
                        x: P.x + S_OFF,
                        y: P.y - 35,
                        life: 30,
                        color: qualityColor
                    });
                    
                    if (isPerfect) {
                        if (!window.perfectCount) window.perfectCount = 0;
                        window.perfectCount++;
                        if (window.perfectCount >= 5 && !badges.includes('perfectionist')) {
                            unlockBadge('perfectionist');
                        }
                        // NO XP FROM PERFECT PARRY
                    }
                    
                    let damage = 10;
                    if (isPerfect && badges.includes('perfectionist')) {
                        damage = 15;
                    }
                    damage = getDamageWithSkills(damage);
                    
                    target.vx = Math.abs(target.vx) * 1.2;
                    target.type = 'reflect';
                    target.dmg = damage;
                    target.color = PLAYER_COLOR;
                    
                    document.getElementById('drop-alert').innerHTML = "⚡ FIREBALL REFLECTED! ⚡";
                    setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "⚡ FIREBALL REFLECTED! ⚡") document.getElementById('drop-alert').innerHTML = ""; }, 300);
                    
                    score++; combo++; shake = 8; P.st = 'success'; P.tm = 0;
                    // NO XP FROM REGULAR PARRY
                    
                    if (combo > maxCombo) maxCombo = combo;
                    if (combo >= 5) unlockBadge('combo');
                    if (minDist <= 10) unlockBadge('reflex');
                    
                    if (stats.healParry > 0 && Math.random() < stats.healParry && hp < getMaxHp()) {
                        hp++;
                        updateMaxHp();
                        document.getElementById('drop-alert').innerHTML = "💚 HEALED! 💚";
                        setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "💚 HEALED! 💚") document.getElementById('drop-alert').innerHTML = ""; }, 500);
                    }
                    
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
                    window.perfectCount = 0;
                    updateUI();
                }
            }
        }
    }
    if (e.code === 'KeyF') {
        e.preventDefault();
        if (!over && !isWaitingToStart && document.getElementById('item-modal').classList.contains('hidden') && document.getElementById('badge-modal').classList.contains('hidden') && document.getElementById('skill-modal').classList.contains('hidden') && document.getElementById('skill-confirm-modal').classList.contains('hidden')) {
            useSwordAbility();
        }
    }
    if (e.code === 'KeyR' && over) reset();
});

function update() {
    if (over || isWaitingToStart) return;
    if (shake > 0) shake--;
    if (P.tm > 0) { P.tm--; if (P.tm === 0) P.st = 'idle'; }
    if (P.tm === 0 && P.st === 'success') P.st = 'idle';
    
    if (swordCooldown > 0) {
        swordCooldown--;
        if (swordCooldown === 0) {
            renderSwordUI();
        }
    }
    
    if (swordBuffActive) {
        swordBuffRemaining--;
        if (swordBuffRemaining <= 0) {
            swordBuffActive = false;
            activeSwordBuff = null;
            renderSwordUI();
        } else {
            renderSwordUI();
        }
    }
    
    if (reviveMessageTimer > 0) {
        reviveMessageTimer--;
        if (reviveMessageTimer === 0) {
            reviveMessage = '';
            updateMaxHp();
        }
    }
    
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
        
        if (p.type === 'in' && p.x <= P.x + 10) {
            const stats = getActiveStatsWithSkills();
            let reflected = false;
            let ironWillChance = getSkillEffect('ironWill') / 100;
            
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
            
            if (!reflected && ironWillChance > 0 && Math.random() < ironWillChance) {
                p.active = false;
                reflected = true;
                document.getElementById('drop-alert').innerHTML = "💪 IRON WILL! Damage ignored! 💪";
                setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "💪 IRON WILL! Damage ignored! 💪") document.getElementById('drop-alert').innerHTML = ""; }, 500);
            }
            
            if (!reflected) {
                let damageReduction = getSkillEffect('quickRecovery') / 100;
                let actualDamage = 1;
                if (damageReduction > 0 && Math.random() < damageReduction) {
                    actualDamage = 0;
                    document.getElementById('drop-alert').innerHTML = "💚 QUICK RECOVERY! Damage reduced! 💚";
                    setTimeout(() => { if (document.getElementById('drop-alert').innerHTML === "💚 QUICK RECOVERY! Damage reduced! 💚") document.getElementById('drop-alert').innerHTML = ""; }, 500);
                }
                
                if (actualDamage > 0) {
                    p.active = false;
                    hp--;
                    updateMaxHp();
                    combo = 0;
                    window.perfectCount = 0;
                    hitTaken = true;
                    updateUI();
                    if (hp <= 0) { 
                        if (attemptRevive()) {
                            updateUI();
                        } else {
                            end(false); 
                            return; 
                        }
                    }
                } else {
                    p.active = false;
                }
            }
            continue;
        }
        if ((p.type === 'replica' || p.type === 'reflect') && p.x >= B.x - 20) {
            p.active = false;
            let damage = p.dmg || 10;
            bhp -= damage;
            const boss = L_DATA[lvl];
            const percent = Math.max(0, (bhp / boss.hp) * 100);
            document.getElementById('boss-hp').style.width = `${percent}%`;
            
            if (skillTree.executioner > 0 && bhp > 0 && bhp <= boss.hp * 0.1) {
                bhp = 0;
                document.getElementById('drop-alert').innerHTML = "🔪 EXECUTIONER! Boss eliminated! 🔪";
                setTimeout(() => {
                    if (document.getElementById('drop-alert').innerHTML === "🔪 EXECUTIONER! Boss eliminated! 🔪")
                        document.getElementById('drop-alert').innerHTML = "";
                }, 2000);
                end(true);
                return;
            }
            
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
        
        let xpGain = L_DATA[lvl].xp;
        let xpBoosterBonus = getSkillEffect('xpBooster');
        xpGain += xpBoosterBonus;
        addXP(xpGain);
        
        checkLootDrops();
        checkCollectorBadges();
        
        if (lvl === 5 && activeShield === 'default' && activeSword === 'none' && activeHelmet === 'hardmode' && !badges.includes('relentless')) {
            unlockBadge('relentless');
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
    
    if (activeSword && activeSword !== 'none') {
        const swordColor = swordCooldown > 0 ? '#666666' : (swordBuffActive ? '#00ffcc' : '#c0c0c0');
        ctx.save();
        ctx.translate(P.x + 12, P.y - 8);
        ctx.rotate(-0.4);
        ctx.shadowBlur = swordBuffActive ? 15 : 3;
        ctx.shadowColor = swordBuffActive ? '#00ffcc' : '#ffffff';
        
        if (swordBuffActive) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffcc';
            for (let i = 0; i < 3; i++) {
                ctx.globalAlpha = 0.3 - i * 0.1;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(28, -2);
                ctx.lineTo(28, 2);
                ctx.closePath();
                ctx.fillStyle = '#00ffcc';
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(28, -2);
                ctx.lineTo(35, 0);
                ctx.lineTo(28, 2);
                ctx.closePath();
                ctx.fillStyle = '#00ffcc';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28, -2);
        ctx.lineTo(28, 2);
        ctx.closePath();
        ctx.fillStyle = swordColor;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(28, -2);
        ctx.lineTo(35, 0);
        ctx.lineTo(28, 2);
        ctx.closePath();
        ctx.fillStyle = swordBuffActive ? '#00ffcc' : '#e0e0e0';
        ctx.fill();
        
        ctx.fillStyle = swordBuffActive ? '#ffd700' : '#d4af37';
        ctx.fillRect(-2, -8, 6, 16);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-6, -3, 8, 6);
        
        ctx.beginPath();
        ctx.arc(-8, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = swordBuffActive ? '#ffd700' : '#d4af37';
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
    
    const stats = getActiveStatsWithSkills();
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

document.addEventListener('DOMContentLoaded', () => {
    const viewBadgesBtn = document.getElementById('view-badges-btn');
    if (viewBadgesBtn) {
        viewBadgesBtn.addEventListener('click', openBadgeViewer);
    }
    
    const viewSkillsBtn = document.getElementById('view-skills-btn');
    if (viewSkillsBtn) {
        viewSkillsBtn.addEventListener('click', openSkillModal);
    }
    
    const resetSkillsBtn = document.getElementById('reset-skills-btn');
    if (resetSkillsBtn) {
        resetSkillsBtn.addEventListener('click', resetAllSkills);
    }
    
    const closeBadgeBtn = document.getElementById('close-badge-modal');
    if (closeBadgeBtn) {
        closeBadgeBtn.addEventListener('click', closeBadgeModal);
    }
    
    const closeSkillBtn = document.getElementById('close-skill-modal');
    if (closeSkillBtn) {
        closeSkillBtn.addEventListener('click', closeSkillModal);
    }
    
    const badgeModal = document.getElementById('badge-modal');
    if (badgeModal) {
        badgeModal.addEventListener('click', (e) => {
            if (e.target === badgeModal) closeBadgeModal();
        });
    }
    
    const skillModal = document.getElementById('skill-modal');
    if (skillModal) {
        skillModal.addEventListener('click', (e) => {
            if (e.target === skillModal) closeSkillModal();
        });
    }
    
    const skillConfirmModal = document.getElementById('skill-confirm-modal');
    if (skillConfirmModal) {
        skillConfirmModal.addEventListener('click', (e) => {
            if (e.target === skillConfirmModal) cancelUpgrade();
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
checkExistingProgress();
gameLoop();