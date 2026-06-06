const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
let hp = 3, lvl = 0, bhp = 100, score = 0, combo = 0, maxCombo = 0, over = false, projs = [], bCount = 0, sTime = 60, shake = 0, sTimers = [], isWaitingToStart = true, hitTaken = false, activeSkin = 'default', resUsed = false;
let selectedSkinPending = 'default';
const S_OFF = 30, maxL = 4, P = {x: 150, y: 250, st: 'idle', tm: 0}, B = {x: 650, y: 230, w: 50, h: 80}, P_WIN = 25;
const L_DATA = {
    1: {hp: 100, spd: 5, col: '#ff4d4d', t: "ST1: BRUTE (Standard)"},
    2: {hp: 120, spd: 6, col: '#bf55ec', t: "ST2: TWIN (Double Shot)"},
    3: {hp: 130, spd: 6.5, col: '#3498db', t: "ST3: TRIAD (Triple Shot)"},
    4: {hp: 150, spd: 7, col: '#f1c40f', t: "ST4: CHAOS (Random Triple)"}
};
const SKIN_DETAILS = {
    default: { title: "Default Shield", ico: "🔘", desc: "Balanced performance standard shield. No special stat modifications." },
    brute: { title: "Brute's Bulwark", ico: "🔴", desc: "Forged plate expansions widen your parry window radius by 25% for easy deflections." },
    chrono: { title: "Chrono Deflector", ico: "🟣", desc: "Chronomancy warp space coordinates to slow down incoming fireballs by 20%." },
    resonance: { title: "Resonance Ward", ico: "🔵", desc: "Failsafe sound harmonic lines allow 1 early click per stage without resetting combo streaks." },
    chaos: { title: "Chaos Core", ico: "🟡", desc: "Reality-bending singularity gives each successful parry hit a 15% chance to heal 1 heart." }
};
let cleared = JSON.parse(localStorage.getItem('parry_cleared')) || [], badges = JSON.parse(localStorage.getItem('parry_badges')) || [], skins = JSON.parse(localStorage.getItem('parry_skins')) || ['default'];

function addP(s, t = 'in', x = B.x) { if (activeSkin === 'chrono' && t === 'in') s *= 0.8; projs.push({x, y: P.y, s, vx: -s, sz: 10, act: true, t}); }

function spawn() {
    const c = L_DATA[lvl]; if (lvl === 1) addP(c.spd + score * 0.2);
    else if (lvl === 2) { addP(c.spd); bCount = 1; sTime = 30; } 
    else if (lvl === 3) { addP(c.spd); bCount = 2; sTime = 25; } 
    else if (lvl === 4) { addP(c.spd); sTimers = [Math.floor(Math.random() * 25) + 15, Math.floor(Math.random() * 35) + 45]; }
}

function sLvl(n) {
    lvl = n; bhp = L_DATA[lvl].hp; projs = []; sTime = 90; bCount = 0; sTimers = []; hp = 3; isWaitingToStart = false; hitTaken = false; resUsed = false;
    document.getElementById('level-display').innerText = L_DATA[lvl].t; document.getElementById('level-display').style.color = L_DATA[lvl].col;
    const b = document.getElementById('boss-hp'); b.style.backgroundColor = L_DATA[lvl].col; b.style.boxShadow = `0 0 10px ${L_DATA[lvl].col}`; b.style.width = '100%';
    document.getElementById('player-hp').innerText = `HP: ❤️❤️❤️`; document.getElementById('drop-alert').innerText = ''; updateBtnUI();
}

function selectStage(n) { document.getElementById('game-over-screen').classList.add('hidden'); document.getElementById('item-modal').classList.add('hidden'); over = false; score = 0; combo = 0; maxCombo = 0; P.st = 'idle'; P.tm = 0; shake = 0; updateUI(); sLvl(n); }

function updateBtnUI() { document.querySelectorAll('.stage-btn').forEach((b, i) => { if (i + 1 === lvl) b.classList.add('active'); else b.classList.remove('active'); }); renderInventoryUI(); }

function clickSkin(id) {
    if (skins.includes(id)) {
        selectedSkinPending = id;
        const details = SKIN_DETAILS[id];
        document.getElementById('modal-icon').innerText = details.ico;
        document.getElementById('modal-title').innerText = details.title;
        document.getElementById('modal-desc').innerText = details.desc;
        document.getElementById('item-modal').classList.remove('hidden');
    }
}
function closeModal() { document.getElementById('item-modal').classList.add('hidden'); }
function confirmEquip() { activeSkin = selectedSkinPending; renderInventoryUI(); closeModal(); }

function checkLootDrops() {
    let txt = '', r = Math.random() * 100;
    if (lvl === 1 && r <= 10 && !skins.includes('brute')) { skins.push('brute'); txt = '🏆 DROP: Brute Bulwark Unlocked!'; }
    if (lvl === 2 && r <= 4 && !skins.includes('chrono')) { skins.push('chrono'); txt = '🏆 DROP: Chrono Deflector Unlocked!'; }
    if (lvl === 3 && r <= 2 && !skins.includes('resonance')) { skins.push('resonance'); txt = '🏆 DROP: Resonance Ward Unlocked!'; }
    if (lvl === 4 && r <= 1 && !skins.includes('chaos')) { skins.push('chaos'); txt = '🏆 DROP: Chaos Core Unlocked!'; }
    if (txt) { localStorage.setItem('parry_skins', JSON.stringify(skins)); document.getElementById('drop-alert').innerText = txt; }
}

function renderInventoryUI() {
    ['default', 'brute', 'chrono', 'resonance', 'chaos'].forEach(id => { const s = document.getElementById('skin-' + id); if (skins.includes(id)) s.className = (activeSkin === id) ? "skin-slot active" : "skin-slot unlocked"; else s.className = "skin-slot locked"; });
    ['flawless', 'combo', 'reflex', 'champion'].forEach(id => { const b = document.getElementById('badge-' + id); if (badges.includes(id)) b.className = "badge-slot unlocked"; else b.className = "badge-slot locked"; });
}

function unlockBadge(id) { if (!badges.includes(id)) { badges.push(id); localStorage.setItem('parry_badges', JSON.stringify(badges)); renderInventoryUI(); } }

function updateUI() { document.getElementById('score').innerText = `Combo: ${combo} | Parries: ${score}`; }
function reset() {
    hp = 3; score = 0; combo = 0; maxCombo = 0; over = false; P.st = 'idle'; P.tm = 0; shake = 0; isWaitingToStart = true; lvl = 0; projs = []; sTimers = [];
    document.getElementById('game-over-screen').classList.add('hidden'); document.getElementById('item-modal').classList.add('hidden'); document.getElementById('level-display').innerText = "SELECT STAGE TO START";
    document.getElementById('level-display').style.color = "#66fcf1"; document.getElementById('boss-hp').style.width = '0%'; document.getElementById('player-hp').innerText = `HP: ❤️❤️❤️`;
    updateUI(); updateBtnUI();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); }
    if (e.code === 'Space' && !over && document.getElementById('item-modal').classList.contains('hidden')) {
        if (isWaitingToStart) { selectStage(1); return; }
        if (P.st === 'idle') {
            P.st = 'parrying'; P.tm = 10; let target = null, minDist = 9999;
            projs.forEach(p => { if (p.act && p.t === 'in') { let d = p.x - (P.x + S_OFF); if (d > -5 && d < minDist) { minDist = d; target = p; } } });
            let validWindow = (activeSkin === 'brute') ? P_WIN * 1.25 : P_WIN;
            if (target && minDist <= validWindow) {
                target.vx = 12; target.t = 'ref'; score++; combo++; shake = 8; P.st = 'success'; P.tm = 0; if (combo > maxCombo) maxCombo = combo;
                if (combo >= 5) unlockBadge('combo'); if (minDist >= validWindow - 2) unlockBadge('reflex');
                if (activeSkin === 'chaos' && Math.random() <= 0.15 && hp < 3) { hp++; document.getElementById('player-hp').innerText = `HP: ${'❤️'.repeat(hp)}`; }
                updateUI();
            } else { P.st = 'miss'; P.tm = 18; if (activeSkin === 'resonance' && !resUsed) resUsed = true; else combo = 0; updateUI(); }
        }
    }
    if (e.code === 'KeyR' && over) reset();
});

function update() {
    if (over || isWaitingToStart) return;
    if (shake > 0) shake--; if (P.tm > 0) { P.tm--; if (P.tm === 0) P.st = 'idle'; } if (P.tm === 0 && P.st === 'success') P.st = 'idle';
    if (lvl === 2 && bCount === 1 && sTime === 1) { addP(L_DATA[lvl].spd); bCount = 0; }
    if (lvl === 3 && bCount > 0 && sTime === 1) { addP(L_DATA[lvl].spd); bCount--; if(bCount > 0) sTime = 25; }
    if (lvl === 4 && sTimers.length > 0) sTimers = sTimers.map(t => { if (t - 1 === 0) addP(L_DATA[lvl].spd); return t - 1; });
    let act = bCount > 0 || projs.some(p => p.act) || sTimers.some(t => t > 0); if (!act) { if (--sTime <= 0) spawn(); } else if (sTime > 0) sTime--;
    projs.forEach(p => {
        if (!p.act) return; p.x += p.vx;
        if (p.t === 'in' && p.x <= P.x + 10) {
            p.act = false; hp--; shake = 15; combo = 0; hitTaken = true; updateUI(); document.getElementById('player-hp').innerText = `HP: ${'❤️'.repeat(Math.max(0, hp))}`;
            if (hp <= 0) { end(false); return; } if (!projs.some(pr => pr.act) && bCount === 0 && !sTimers.some(t => t > 0)) sNext();
        }
        if (p.t === 'ref' && p.x >= B.x) {
            p.act = false; bhp -= 20; document.getElementById('boss-hp').style.width = `${Math.max(0, (bhp / L_DATA[lvl].hp) * 100)}%`;
            if (bhp <= 0) {
                if (!cleared.includes(lvl)) { cleared.push(lvl); localStorage.setItem('parry_cleared', JSON.stringify(cleared)); }
                if (!hitTaken) unlockBadge('flawless'); if (cleared.length >= maxL) unlockBadge('champion');
                checkLootDrops(); end(true); return;
            }
            if (!projs.some(pr => pr.act) && bCount === 0 && !sTimers.some(t => t > 0)) sNext();
        }
    });
}

function sNext() { projs = []; sTimers = []; sTime = lvl === 4 ? 85 : (lvl === 2 || lvl === 3) ? 75 : 50; }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 270); ctx.lineTo(canvas.width, 270); ctx.stroke();
    
    // ENEMY WIZARD BOSS WITH NEW SINISTER EYES RENDERED
    let bCol = isWaitingToStart ? '#455a64' : L_DATA[lvl].col; ctx.fillStyle = bCol; ctx.shadowBlur = isWaitingToStart ? 0 : 15; ctx.shadowColor = bCol;
    ctx.beginPath(); ctx.moveTo(B.x + B.w / 2, B.y); ctx.lineTo(B.x, B.y + B.h); ctx.lineTo(B.x + B.w, B.y + B.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0c10'; ctx.fillRect(B.x + 12, B.y + 15, 26, 20); // Dark inner hood vacuum void
    ctx.fillStyle = isWaitingToStart ? '#555555' : '#ff3333'; 
    ctx.fillRect(B.x + 15, B.y + 22, 7, 4); // Left rectangular evil eye
    ctx.fillRect(B.x + 28, B.y + 22, 7, 4); // Right rectangular evil eye
    ctx.fillStyle = bCol; ctx.fillRect(B.x - 15, B.y + 35 + Math.sin(Date.now() / 200) * 5, 12, 12);
    
    // PLAYER CHARACTER KNIGHT WITH 20% WIDER VISOR EYE
    ctx.save(); let kc = '#66fcf1', aa = '#45a29e'; if (P.st === 'miss') { kc = '#555555'; aa = '#333333'; } else if (P.st === 'success') { kc = '#00ffcc'; aa = '#ffffff'; }
    ctx.fillStyle = '#451212'; ctx.beginPath(); ctx.moveTo(P.x - 10, P.y - 10); ctx.lineTo(P.x - 35 + Math.sin(Date.now() / 150) * 8, P.y + 20); ctx.lineTo(P.x - 10, P.y + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = kc; ctx.shadowBlur = 15; ctx.shadowColor = kc; ctx.fillRect(P.x - 15, P.y - 20, 30, 40);
    ctx.fillStyle = '#1f2833'; ctx.fillRect(P.x - 5, P.y - 15, 20, 10); 
    ctx.fillStyle = aa; 
    ctx.fillRect(P.x, P.y - 12, 15, 3); // Wider glowing mask visor slit window line (+20% thickness/length)
    ctx.beginPath(); ctx.arc(P.x - 5, P.y - 22, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.lineWidth = 5;
    
    if (P.st === 'parrying' || P.st === 'success') ctx.strokeStyle = '#ffffff'; else if (P.st === 'miss') ctx.strokeStyle = '#ff3333';
    else { ctx.strokeStyle = activeSkin === 'brute' ? '#ff4d4d' : activeSkin === 'chrono' ? '#bf55ec' : activeSkin === 'resonance' ? '#3498db' : activeSkin === 'chaos' ? '#f1c40f' : '#45a29e'; }
    ctx.shadowColor = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(P.x + S_OFF, P.y - 25); ctx.lineTo(P.x + S_OFF, P.y + 25); ctx.stroke();
    projs.forEach(p => { if (!p.act) return; ctx.save(); ctx.fillStyle = p.t === 'ref' ? '#00ffcc' : '#ffb300'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = p.t === 'ref' ? 20 : 15; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    if (isWaitingToStart) { ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("CHOOSE YOUR OPPONENT TO START", canvas.width / 2, canvas.height / 2 - 20); } 
    else if (sTime > 35 && !projs.some(p => p.act) && bCount === 0 && !sTimers.some(t => t > 0)) { ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(L_DATA[lvl].t, canvas.width / 2, canvas.height / 2 - 20); }
    ctx.restore();
}

function end(w) { over = true; const s = document.getElementById('game-over-screen'), t = document.getElementById('game-over-title'), b = document.getElementById('game-over-sub'); s.classList.remove('hidden'); t.innerText = w ? "VICTORY ACHIEVED!" : "GAME OVER"; t.style.color = w ? "#00ffcc" : "#ff4d4d"; t.style.textShadow = `0 0 20px ${t.style.color}`; b.innerText = w ? `You defeated this boss pattern! Select another fight or press R to clear.` : "Press R to retry."; }

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
reset(); renderInventoryUI(); gameLoop();
