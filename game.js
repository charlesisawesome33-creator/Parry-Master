const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
let hp = 3, lvl = 0, bhp = 100, score = 0, over = false, projs = [], bCount = 0, sTime = 60, shake = 0, sTimers = [], isWaitingToStart = true;
const P_WIN = 25, S_OFF = 30, maxL = 4, P = {x: 150, y: 250, st: 'idle', tm: 0}, B = {x: 650, y: 230, w: 50, h: 80};
const L_DATA = {
    1: {hp: 100, spd: 5, col: '#ff4d4d', t: "ST1: BRUTE (Standard)"},
    2: {hp: 120, spd: 6, col: '#bf55ec', t: "ST2: TWIN (Double Shot)"},
    3: {hp: 130, spd: 6.5, col: '#3498db', t: "ST3: TRIAD (Triple Shot)"},
    4: {hp: 150, spd: 7, col: '#f1c40f', t: "ST4: CHAOS (Random Triple)"}
};
function addP(s, t = 'in', x = B.x) { projs.push({x, y: P.y, s, vx: -s, sz: 10, act: true, t}); }
function spawn() {
    const c = L_DATA[lvl];
    if (lvl === 1) addP(c.spd + score * 0.2);
    else if (lvl === 2) { addP(c.spd); bCount = 1; sTime = 30; } 
    else if (lvl === 3) { addP(c.spd); bCount = 2; sTime = 25; } 
    else if (lvl === 4) { 
        addP(c.spd); 
        sTimers = [Math.floor(Math.random() * 25) + 15, Math.floor(Math.random() * 35) + 45]; 
    }
}
function sLvl(n) {
    lvl = n; bhp = L_DATA[lvl].hp; projs = []; sTime = 90; bCount = 0; sTimers = []; hp = 3; isWaitingToStart = false;
    const d = document.getElementById('level-display'), b = document.getElementById('boss-hp');
    d.innerText = L_DATA[lvl].t; d.style.color = L_DATA[lvl].col;
    b.style.backgroundColor = L_DATA[lvl].col; b.style.boxShadow = `0 0 10px ${L_DATA[lvl].col}`; b.style.width = '100%';
    document.getElementById('player-hp').innerText = `HP: ❤️❤️❤️`;
    updateBtnUI();
}
function selectStage(stageNum) {
    document.getElementById('game-over-screen').classList.add('hidden');
    over = false; score = 0; P.st = 'idle'; P.tm = 0; shake = 0;
    document.getElementById('score').innerText = `Parries: 0`;
    sLvl(stageNum);
}
function updateBtnUI() {
    const btns = document.querySelectorAll('.stage-btn');
    btns.forEach((btn, idx) => {
        if (idx + 1 === lvl) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}
function reset() {
    hp = 3; score = 0; over = false; P.st = 'idle'; P.tm = 0; shake = 0; isWaitingToStart = true; lvl = 0; projs = []; sTimers = [];
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('level-display').innerText = "SELECT STAGE TO START";
    document.getElementById('level-display').style.color = "#66fcf1";
    document.getElementById('boss-hp').style.width = '0%';
    document.getElementById('player-hp').innerText = `HP: ❤️❤️❤️`;
    document.getElementById('score').innerText = `Parries: 0`;
    updateBtnUI();
}
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !over) {
        if (isWaitingToStart) { selectStage(1); return; }
        if (P.st === 'idle') {
            P.st = 'parrying'; P.tm = 10;
            let target = null, minDist = 9999;
            projs.forEach(p => {
                if (p.act && p.t === 'in') {
                    let d = p.x - (P.x + S_OFF);
                    if (d > -5 && d < minDist) { minDist = d; target = p; }
                }
            });
            if (target && minDist <= P_WIN) {
                target.vx = 12; target.t = 'ref'; score++; shake = 8; P.st = 'success'; P.tm = 0;
                document.getElementById('score').innerText = `Parries: ${score}`;
            } else { P.st = 'miss'; P.tm = 18; }
        }
    }
    if (e.code === 'KeyR' && over) reset();
});
function update() {
    if (over || isWaitingToStart) return;
    if (shake > 0) shake--;
    if (P.tm > 0) { P.tm--; if (P.tm === 0) P.st = 'idle'; }
    if (P.tm === 0 && P.st === 'success') P.st = 'idle';
    
    if (lvl === 2 && bCount === 1 && sTime === 1) { addP(L_DATA[lvl].spd); bCount = 0; }
    if (lvl === 3 && bCount > 0 && sTime === 1) { addP(L_DATA[lvl].spd); bCount--; if(bCount > 0) sTime = 25; }
    if (lvl === 4 && sTimers.length > 0) {
        sTimers = sTimers.map(t => { if (t - 1 === 0) addP(L_DATA[lvl].spd); return t - 1; });
    }

    let activePattern = bCount > 0 || projs.some(p => p.act) || sTimers.some(t => t > 0);
    if (!activePattern) {
        if (--sTime <= 0) spawn();
    } else if (sTime > 0) {
        sTime--;
    }
    
    projs.forEach(p => {
        if (!p.act) return;
        p.x += p.vx;
        if (p.t === 'in' && p.x <= P.x + 10) {
            p.act = false; hp--; shake = 15;
            document.getElementById('player-hp').innerText = `HP: ${'❤️'.repeat(Math.max(0, hp))}`;
            if (hp <= 0) { end(false); return; }
            if (!projs.some(pr => pr.act) && bCount === 0 && !sTimers.some(t => t > 0)) sNext();
        }
        if (p.t === 'ref' && p.x >= B.x) {
            p.act = false; bhp -= 20;
            document.getElementById('boss-hp').style.width = `${Math.max(0, (bhp / L_DATA[lvl].hp) * 100)}%`;
            if (bhp <= 0) { if (lvl < maxL) sLvl(lvl + 1); else end(true); return; }
            if (!projs.some(pr => pr.act) && bCount === 0 && !sTimers.some(t => t > 0)) sNext();
        }
    });
}
function sNext() {
    projs = []; sTimers = [];
    sTime = lvl === 4 ? 85 : (lvl === 2 || lvl === 3) ? 75 : 50;
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 270); ctx.lineTo(canvas.width, 270); ctx.stroke();
    
    // BOSS
    let bCol = isWaitingToStart ? '#455a64' : L_DATA[lvl].col;
    ctx.fillStyle = bCol; ctx.shadowBlur = isWaitingToStart ? 0 : 15; ctx.shadowColor = bCol;
    ctx.beginPath(); ctx.moveTo(B.x + B.w / 2, B.y); ctx.lineTo(B.x, B.y + B.h); ctx.lineTo(B.x + B.w, B.y + B.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0c10'; ctx.fillRect(B.x + 12, B.y + 15, 26, 20);
    ctx.fillStyle = isWaitingToStart ? '#555555' : '#ff3333'; ctx.fillRect(B.x + 16, B.y + 22, 6, 4); ctx.fillRect(B.x + 28, B.y + 22, 6, 4);
    ctx.fillStyle = bCol; ctx.fillRect(B.x - 15, B.y + 35 + Math.sin(Date.now() / 200) * 5, 12, 12);

    // PLAYER
    ctx.save(); let kc = '#66fcf1', aa = '#45a29e';
    if (P.st === 'miss') { kc = '#555555'; aa = '#333333'; } else if (P.st === 'success') { kc = '#00ffcc'; aa = '#ffffff'; }
    ctx.fillStyle = '#451212'; ctx.beginPath(); ctx.moveTo(P.x - 10, P.y - 10); ctx.lineTo(P.x - 35 + Math.sin(Date.now() / 150) * 8, P.y + 20); ctx.lineTo(P.x - 10, P.y + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = kc; ctx.shadowBlur = 15; ctx.shadowColor = kc; ctx.fillRect(P.x - 15, P.y - 20, 30, 40);
    ctx.fillStyle = '#1f2833'; ctx.fillRect(P.x - 5, P.y - 15, 20, 10);
    ctx.fillStyle = aa; ctx.fillRect(P.x + 2, P.y - 12, 13, 3);
    ctx.beginPath(); ctx.arc(P.x - 5, P.y - 22, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // SHIELD
    ctx.lineWidth = 5; ctx.strokeStyle = (P.st === 'parrying' || P.st === 'success') ? '#ffffff' : P.st === 'miss' ? '#ff3333' : '#45a29e';
    ctx.shadowColor = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(P.x + S_OFF, P.y - 25); ctx.lineTo(P.x + S_OFF, P.y + 25); ctx.stroke();

    // ORBS
    projs.forEach(p => {
        if (!p.act) return; ctx.save();
        ctx.fillStyle = p.t === 'ref' ? '#00ffcc' : '#ffb300';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = p.t === 'ref' ? 20 : 15;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    if (isWaitingToStart) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("CHOOSE YOUR OPPONENT TO START", canvas.width / 2, canvas.height / 2 - 20);
    } else if (sTime > 35 && !projs.some(p => p.act) && bCount === 0 && !sTimers.some(t => t > 0)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(L_DATA[lvl].t, canvas.width / 2, canvas.height / 2 - 20);
    }
    ctx.restore();
}
function end(w) {
    over = true; const s = document.getElementById('game-over-screen'), t = document.getElementById('game-over-title'), b = document.getElementById('game-over-sub');
    s.classList.remove('hidden'); t.innerText = w ? "VICTORY ACHIEVED!" : "GAME OVER";
    t.style.color = w ? "#00ffcc" : "#ff4d4d"; t.style.textShadow = `0 0 20px ${t.style.color}`;
    b.innerText = w ? `Mastered all styles! Score: ${score}. Press R to loop.` : "Press R to retry.";
}
function loop() { update(); draw(); requestAnimationFrame(loop); }
reset(); loop();
