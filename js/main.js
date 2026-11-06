const I18N = { 'zh-Hant': { diffLabel: '難度選擇 / Difficulty:', startBtn: '開始遊戲 / START GAME', continueBtn: '繼續遊戲 / CONTINUE', codexBtn: '玩法與圖鑑 / HOW TO PLAY', loadCodeBtn: '輸入存檔代碼 / LOAD CODE', codexTitle: '遊戲玩法與敵方圖鑑', howToPlayHeader: '🎮 操作與玩法', howToPlayDesc: '使用 WASD / 方向鍵或滑鼠/觸控移動。擊敗敵人掉落經驗晶體，累積升級點數以選擇疊加強力武器與屬性！每 60 秒將遭遇強大首領。', enemyCodexHeader: '👾 敵方圖鑑', closeModal: '關閉 / CLOSE', loadCodeTitle: '輸入存檔代碼', confirmLoad: '載入 / LOAD', cancelBtn: '取消 / CANCEL', pauseTitle: '遊戲暫停', resumeBtn: '繼續遊戲 / RESUME', exportCodeBtn: '複製存檔代碼 / EXPORT SAVE CODE', restartBtn: '重新開始 / RESTART', quitBtn: '退出至主選單 / QUIT', quitTitle: '確認退出遊戲？', quitDesc: '未儲存的進度將會遺失（系統會自動幫您保留臨時存檔）。確定要返回主選單嗎？', confirmQuit: '確認退出 / QUIT', autosaved: '已自動儲存', scoreLabel: '分數:', timeLabel: '時間:', levelLabel: '等級:', levelUpTitle: '升級選擇！LEVEL UP!', finalScore: '最終分數:', finalTime: '生存時間:', finalKills: '擊殺敵機:', playAgain: '再次挑戰 / PLAY AGAIN' }, 'en': { diffLabel: 'Difficulty:', startBtn: 'START GAME', continueBtn: 'CONTINUE GAME', codexBtn: 'HOW TO PLAY', loadCodeBtn: 'LOAD SAVE CODE', codexTitle: 'How To Play & Enemy Codex', howToPlayHeader: '🎮 Controls & Gameplay', howToPlayDesc: 'Use WASD / Arrow Keys or Mouse/Touch to move. Defeat enemies to collect XP crystals and choose stackable upgrades upon leveling up! Face epic bosses every 60 seconds.', enemyCodexHeader: '👾 Enemy Codex', closeModal: 'CLOSE', loadCodeTitle: 'Enter Save Code', confirmLoad: 'LOAD', cancelBtn: 'CANCEL', pauseTitle: 'Game Paused', resumeBtn: 'RESUME', exportCodeBtn: 'EXPORT SAVE CODE', restartBtn: 'RESTART', quitBtn: 'QUIT TO MENU', quitTitle: 'Confirm Quit?', quitDesc: 'Your run progress is auto-saved. Are you sure you want to return to the main menu?', confirmQuit: 'QUIT', autosaved: 'Auto-saved', scoreLabel: 'Score:', timeLabel: 'Time:', levelLabel: 'Lvl:', levelUpTitle: 'LEVEL UP! CHOOSE UPGRADE', finalScore: 'Final Score:', finalTime: 'Survival Time:', finalKills: 'Enemies Defeated:', playAgain: 'PLAY AGAIN' } };

let currentLang = 'zh-Hant';

function setLanguage(lang) { currentLang = lang; document.querySelectorAll('.lang-btn').forEach(btn => { btn.classList.toggle('active', btn.getAttribute('data-lang') === lang); }); document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (I18N[lang][key]) { el.innerText = I18N[lang][key]; } }); }

let audioCtx = null; function initAudio() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } }

function playSound(type) { if (!audioCtx) return; try { const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;

    if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'levelup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(500, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'crystal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
} catch (e) {}

}

const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } window.addEventListener('resize', resizeCanvas); resizeCanvas();

let isGameRunning = false; let isPaused = false; let selectedDifficulty = 'normal'; let gameTime = 0; let score = 0; let totalKills = 0; let autoSaveTimer = 0;

let player; let bullets = []; let enemyBullets = []; let enemies = []; let particles = []; let crystals = [];

const keys = {}; window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === 'Escape' && isGameRunning) { togglePause(); } }); window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let mousePos = { x: canvas.width / 2, y: canvas.height / 2 }; let isMouseDown = false; window.addEventListener('mousemove', e => { mousePos.x = e.clientX; mousePos.y = e.clientY; }); window.addEventListener('mousedown', () => isMouseDown = true); window.addEventListener('mouseup', () => isMouseDown = false);

window.addEventListener('touchmove', e => { if (e.touches.length > 0) { mousePos.x = e.touches[0].clientX; mousePos.y = e.touches[0].clientY; isMouseDown = true; } }, {passive: true}); window.addEventListener('touchend', () => isMouseDown = false);

class Player { constructor() { this.x = canvas.width / 2; this.y = canvas.height / 2; this.radius = 18; this.speed = 4.5; this.hp = 100; this.maxHp = 100; this.level = 1; this.exp = 0; this.nextExp = 50;

    this.damage = 10;
    this.fireRate = 12;
    this.fireTimer = 0;
    this.bulletSpeed = 10;
    this.multishot = 1;
    this.bulletSize = 1;
    this.magnetRadius = 120;
    this.drones = 0;
    this.blades = 0;
    this.bladeAngle = 0;
}

update() {
    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    if (isMouseDown) {
        const mdx = mousePos.x - this.x;
        const mdy = mousePos.y - this.y;
        const dist = Math.hypot(mdx, mdy);
        if (dist > 5) {
            dx = mdx / dist;
            dy = mdy / dist;
        }
    }

    this.x += dx * this.speed;
    this.y += dy * this.speed;

    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

    this.fireTimer++;
    if (this.fireTimer >= this.fireRate) {
        this.fireTimer = 0;
        this.shoot();
    }

    if (this.blades > 0) {
        this.bladeAngle += 0.05;
    }

    crystals.forEach(c => {
        const dist = Math.hypot(this.x - c.x, this.y - c.y);
        if (dist < this.magnetRadius) {
            const angle = Math.atan2(this.y - c.y, this.x - c.x);
            c.x += Math.cos(angle) * 7;
            c.y += Math.sin(angle) * 7;
            if (dist < this.radius + c.radius) {
                c.collected = true;
                this.addExp(c.value);
                playSound('crystal');
            }
        }
    });
    crystals = crystals.filter(c => !c.collected);
}

shoot() {
    let target = null;
    let minDist = Infinity;
    enemies.forEach(e => {
        const dist = Math.hypot(e.x - this.x, e.y - this.y);
        if (dist < minDist) {
            minDist = dist;
            target = e;
        }
    });

    let angle = target ? Math.atan2(target.y - this.y, target.x - this.x) : Math.random() * Math.PI * 2;

    for (let i = 0; i < this.multishot; i++) {
        let offsetAngle = angle + (i - (this.multishot - 1) / 2) * 0.15;
        bullets.push(new Bullet(this.x, this.y, offsetAngle, this.bulletSpeed, this.damage, this.bulletSize));
    }
    playSound('laser');
}

addExp(val) {
    this.exp += val;
    if (this.exp >= this.nextExp) {
        this.exp -= this.nextExp;
        this.level++;
        this.nextExp = Math.floor(this.nextExp * 1.35);
        triggerLevelUp();
    }
    updateHUD();
}

draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    const aimAngle = isMouseDown ? Math.atan2(mousePos.y - this.y, mousePos.x - this.x) : 0;
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(aimAngle) * (this.radius + 8), Math.sin(aimAngle) * (this.radius + 8));
    ctx.stroke();

    if (this.blades > 0) {
        for (let i = 0; i < this.blades; i++) {
            const bAngle = this.bladeAngle + (i * Math.PI * 2 / this.blades);
            const bx = Math.cos(bAngle) * 50;
            const by = Math.sin(bAngle) * 50;
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (this.drones > 0) {
        for (let i = 0; i < this.drones; i++) {
            const dAngle = (gameTime * 0.03) + (i * Math.PI * 2 / this.drones);
            const dx = Math.cos(dAngle) * 80;
            const dy = Math.sin(dAngle) * 80;
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.beginPath();
            ctx.arc(dx, dy, 6, 0, Math.PI * 2);
            ctx.fill();

            if (Math.random() < 0.05 && enemies.length > 0) {
                let target = enemies[Math.floor(Math.random() * enemies.length)];
                let dShotAngle = Math.atan2(target.y - (this.y + dy), target.x - (this.x + dx));
                bullets.push(new Bullet(this.x + dx, this.y + dy, dShotAngle, 12, this.damage * 0.5, 0.8));
            }
        }
    }

    ctx.restore();
}

}

class Bullet { constructor(x, y, angle, speed, damage, sizeMultiplier = 1) { this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.damage = damage; this.radius = 4 * sizeMultiplier; this.active = true; }

update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.active = false;
    }
}

draw() {
    ctx.save();
    ctx.fillStyle = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

}

class EnemyBullet { constructor(x, y, angle, speed, damage) { this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.damage = damage; this.radius = 5; this.active = true; }

update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
        this.active = false;
    }
}

draw() {
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

}

class Enemy { constructor(type = 'chaser') { this.type = type; this.spawnOutside(); this.setupStats(); }

spawnOutside() {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { this.x = Math.random() * canvas.width; this.y = -40; }
    else if (side === 1) { this.x = canvas.width + 40; this.y = Math.random() * canvas.height; }
    else if (side === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 40; }
    else { this.x = -40; this.y = Math.random() * canvas.height; }
}

setupStats() {
    let diffMultiplier = selectedDifficulty === 'easy' ? 0.7 : selectedDifficulty === 'hard' ? 1.4 : 1.0;
    
    switch(this.type) {
        case 'chaser':
            this.radius = 14;
            this.speed = 2.2 * diffMultiplier;
            this.hp = 25;
            this.maxHp = 25;
            this.color = '#ff5500';
            this.expValue = 10;
            break;
        case 'tank':
            this.radius = 26;
            this.speed = 1.1 * diffMultiplier;
            this.hp = 90;
            this.maxHp = 90;
            this.color = '#aa00ff';
            this.expValue = 30;
            break;
        case 'speeder':
            this.radius = 10;
            this.speed = 4.2 * diffMultiplier;
            this.hp = 15;
            this.maxHp = 15;
            this.color = '#ffaa00';
            this.expValue = 15;
            break;
        case 'splitter':
            this.radius = 20;
            this.speed = 1.6 * diffMultiplier;
            this.hp = 45;
            this.maxHp = 45;
            this.color = '#9900ff';
            this.expValue = 25;
            break;
        case 'sniper':
            this.radius = 15;
            this.speed = 1.5 * diffMultiplier;
            this.hp = 30;
            this.maxHp = 30;
            this.color = '#00ffaa';
            this.expValue = 20;
            this.shootTimer = 0;
            break;
        case 'boss':
            this.radius = 45;
            this.speed = 1.2 * diffMultiplier;
            this.hp = 600 * diffMultiplier;
            this.maxHp = 600 * diffMultiplier;
            this.color = '#ff0033';
            this.expValue = 250;
            this.shootTimer = 0;
            break;
    }
}

update() {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    
    if (this.type === 'sniper') {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > 250) {
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
        this.shootTimer++;
        if (this.shootTimer >= 100) {
            this.shootTimer = 0;
            enemyBullets.push(new EnemyBullet(this.x, this.y, angle, 6, 15));
        }
    } else if (this.type === 'boss') {
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.shootTimer++;
        if (this.shootTimer >= 60) {
            this.shootTimer = 0;
            for (let i = 0; i < 4; i++) {
                let bAngle = angle + (i * Math.PI / 2);
                enemyBullets.push(new EnemyBullet(this.x, this.y, bAngle, 5, 20));
            }
        }
    } else {
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.lineWidth = 3;

    if (this.type === 'tank') {
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else if (this.type === 'boss') {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

}

class Crystal { constructor(x, y, value) { this.x = x; this.y = y; this.value = value; this.radius = 5; this.collected = false; } draw() { ctx.save(); ctx.fillStyle = '#00ffaa'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ffaa'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }

class Particle { constructor(x, y, color) { this.x = x; this.y = y; const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 4 + 1; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.color = color; this.life = 1.0; this.decay = Math.random() * 0.03 + 0.02; } update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; } draw() { ctx.save(); ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 3, 3); ctx.restore(); } }

const UPGRADE_POOL = [ { id: 'drone', title: '戰術無人機 (Tactical Drone)', desc: '增加一台自動環繞並射擊的無人機 (可疊加)' }, { id: 'blade', title: '等離子旋轉光刃 (Plasma Blade)', desc: '增加一把環繞主角護體的光刃 (可疊加)' }, { id: 'multishot', title: '多重雷射 (Multishot)', desc: '每發子彈數量 +1' }, { id: 'damage', title: '雷射威力 (Damage Boost)', desc: '武器傷害提升 25%' }, { id: 'firerate', title: '快速發射 (Rapid Fire)', desc: '攻擊速度提升 15%' }, { id: 'speed', title: '動能推進 (Engine Boost)', desc: '移動速度提升 15%' }, { id: 'magnet', title: '磁場擴張 (Magnet Field)', desc: '晶體拾取範圍大幅擴大' }, { id: 'heal', title: '奈米急救包 (Nano Repair)', desc: '立即恢復 50 點生命值' } ];

function triggerLevelUp() { isPaused = true; playSound('levelup'); const modal = document.getElementById('upgrade-modal'); const list = document.getElementById('upgrade-card-list'); list.innerHTML = '';

let shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
let choices = shuffled.slice(0, 3);

choices.forEach(up => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<h3>${up.title}</h3><p>${up.desc}</p>`;
    card.onclick = () => {
        applyUpgrade(up.id);
        modal.style.display = 'none';
        isPaused = false;
    };
    list.appendChild(card);
});

modal.style.display = 'flex';

}

function applyUpgrade(id) { if (id === 'drone') player.drones++; if (id === 'blade') player.blades++; if (id === 'multishot') player.multishot++; if (id === 'damage') player.damage *= 1.25; if (id === 'firerate') player.fireRate = Math.max(3, player.fireRate * 0.85); if (id === 'speed') player.speed *= 1.15; if (id === 'magnet') player.magnetRadius += 60; if (id === 'heal') player.hp = Math.min(player.maxHp, player.hp + 50); }

let spawnTimer = 0; let bossSpawnTimer = 0;

function updateGame() { if (!isGameRunning || isPaused) return;

gameTime++;
autoSaveTimer++;
if (autoSaveTimer >= 600) {
    autoSaveTimer = 0;
    saveGameProgress();
}

player.update();

spawnTimer++;
let spawnInterval = Math.max(15, 60 - Math.floor(gameTime / 300));
if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    let r = Math.random();
    let type = 'chaser';
    if (gameTime > 300 && r < 0.25) type = 'tank';
    else if (gameTime > 600 && r < 0.45) type = 'speeder';
    else if (gameTime > 900 && r < 0.65) type = 'splitter';
    else if (gameTime > 1200 && r < 0.8) type = 'sniper';
    enemies.push(new Enemy(type));
}

bossSpawnTimer++;
if (bossSpawnTimer >= 3600) {
    bossSpawnTimer = 0;
    enemies.push(new Enemy('boss'));
}

bullets.forEach(b => b.update());
bullets = bullets.filter(b => b.active);

enemyBullets.forEach(eb => eb.update());
enemyBullets = enemyBullets.filter(eb => eb.active);

enemies.forEach(e => e.update());

particles.forEach(p => p.update());
particles = particles.filter(p => p.life > 0);

for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
        let e = enemies[j];
        let dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
            e.hp -= b.damage;
            b.active = false;
            for (let k = 0; k < 3; k++) particles.push(new Particle(b.x, b.y, '#00f3ff'));

            if (e.hp <= 0) {
                crystals.push(new Crystal(e.x, e.y, e.expValue));
                score += e.expValue * 10;
                totalKills++;
                playSound('explosion');

                if (e.type === 'splitter') {
                    for (let s = 0; s < 2; s++) {
                        let sub = new Enemy('speeder');
                        sub.x = e.x + (Math.random() - 0.5) * 20;
                        sub.y = e.y + (Math.random() - 0.5) * 20;
                        enemies.push(sub);
                    }
                }

                for (let k = 0; k < 10; k++) particles.push(new Particle(e.x, e.y, e.color));
                enemies.splice(j, 1);
            }
            break;
        }
    }
}
bullets = bullets.filter(b => b.active);

if (player.blades > 0) {
    for (let i = 0; i < player.blades; i++) {
        let bAngle = player.bladeAngle + (i * Math.PI * 2 / player.blades);
        let bx = player.x + Math.cos(bAngle) * 50;
        let by = player.y + Math.sin(bAngle) * 50;

        enemies.forEach((e, j) => {
            let dist = Math.hypot(bx - e.x, by - e.y);
            if (dist < 7 + e.radius) {
                e.hp -= 1.5;
                if (e.hp <= 0) {
                    crystals.push(new Crystal(e.x, e.y, e.expValue));
                    score += e.expValue * 10;
                    totalKills++;
                    playSound('explosion');
                    enemies.splice(j, 1);
                }
            }
        });
    }
}

for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let eb = enemyBullets[i];
    let dist = Math.hypot(player.x - eb.x, player.y - eb.y);
    if (dist < player.radius + eb.radius) {
        player.hp -= eb.damage;
        eb.active = false;
        if (player.hp <= 0) gameOver();
    }
}
enemyBullets = enemyBullets.filter(eb => eb.active);

enemies.forEach(e => {
    let dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist < player.radius + e.radius) {
        player.hp -= 0.6;
        if (player.hp <= 0) gameOver();
    }
});

updateHUD();

}

function renderGame() { ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
ctx.lineWidth = 1;
let gridSize = 60;
let offsetX = (gameTime * 0.5) % gridSize;
let offsetY = (gameTime * 0.5) % gridSize;
for (let x = offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
}
for (let y = offsetY; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
}

crystals.forEach(c => c.draw());
particles.forEach(p => p.draw());
bullets.forEach(b => b.draw());
enemyBullets.forEach(eb => eb.draw());
enemies.forEach(e => e.draw());
player.draw();

}

function gameLoop() { updateGame(); renderGame(); requestAnimationFrame(gameLoop); }

function updateHUD() { document.getElementById('hud-score').innerText = score; document.getElementById('hud-level').innerText = player.level; document.getElementById('hud-hp').innerText = Math.max(0, Math.floor(player.hp)); document.getElementById('hud-max-hp').innerText = player.maxHp;

let mins = Math.floor(gameTime / 3600);
let secs = Math.floor((gameTime % 3600) / 60);
document.getElementById('hud-time').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

let expPct = (player.exp / player.nextExp) * 100;
document.getElementById('exp-bar').style.width = `${expPct}%`;

let hpPct = (player.hp / player.maxHp) * 100;
document.getElementById('hp-bar').style.width = `${hpPct}%`;

}

function saveGameProgress() { if (!isGameRunning) return; const saveData = { score, gameTime, totalKills, player: { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, level: player.level, exp: player.exp, nextExp: player.nextExp, damage: player.damage, fireRate: player.fireRate, speed: player.speed, multishot: player.multishot, bulletSize: player.bulletSize, magnetRadius: player.magnetRadius, drones: player.drones, blades: player.blades }, selectedDifficulty }; localStorage.setItem('space_shoot_autosave', JSON.stringify(saveData));

const badge = document.getElementById('autosave-indicator');
badge.classList.add('show');
setTimeout(() => badge.classList.remove('show'), 2000);

}

function checkAutoSave() { const saved = localStorage.getItem('space_shoot_autosave'); if (saved) { document.getElementById('continue-btn').style.display = 'block'; } }

function exportSaveCode() { const saveData = { score, gameTime, totalKills, player: { hp: player.hp, maxHp: player.maxHp, level: player.level, exp: player.exp, nextExp: player.nextExp, damage: player.damage, fireRate: player.fireRate, speed: player.speed, multishot: player.multishot, bulletSize: player.bulletSize, magnetRadius: player.magnetRadius, drones: player.drones, blades: player.blades }, selectedDifficulty }; const code = btoa(JSON.stringify(saveData)); navigator.clipboard.writeText(code).then(() => { alert(currentLang === 'zh-Hant' ? '存檔代碼已複製到剪貼簿！' : 'Save code copied to clipboard!'); }); }

function loadFromCode(code) { try { const data = JSON.parse(atob(code)); score = data.score; gameTime = data.gameTime; totalKills = data.totalKills; selectedDifficulty = data.selectedDifficulty;

    player = new Player();
    Object.assign(player, data.player);

    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('load-modal').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    isGameRunning = true;
    isPaused = false;
} catch (e) {
    alert(currentLang === 'zh-Hant' ? '無效的存檔代碼！' : 'Invalid save code!');
}

}

function startGame(continueExisting = false) { initAudio(); document.getElementById('start-menu').style.display = 'none'; document.getElementById('hud').style.display = 'flex'; document.getElementById('gameover-modal').style.display = 'none';

if (continueExisting && localStorage.getItem('space_shoot_autosave')) {
    try {
        const data = JSON.parse(localStorage.getItem('space_shoot_autosave'));
        score = data.score;
        gameTime = data.gameTime;
        totalKills = data.totalKills;
        selectedDifficulty = data.selectedDifficulty;
        player = new Player();
        Object.assign(player, data.player);
    } catch (e) {
        player = new Player();
        resetNewGame();
    }
} else {
    resetNewGame();
}

isGameRunning = true;
isPaused = false;

}

function resetNewGame() { score = 0; gameTime = 0; totalKills = 0; spawnTimer = 0; bossSpawnTimer = 0; bullets = []; enemyBullets = []; enemies = []; particles = []; crystals = []; player = new Player(); }

function togglePause() { isPaused = !isPaused; document.getElementById('pause-modal').style.display = isPaused ? 'flex' : 'none'; }

function gameOver() { isGameRunning = false; localStorage.removeItem('space_shoot_autosave'); document.getElementById('final-score').innerText = score; let mins = Math.floor(gameTime / 3600); let secs = Math.floor((gameTime % 3600) / 60); document.getElementById('final-time').innerText = ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}; document.getElementById('final-kills').innerText = totalKills; document.getElementById('gameover-modal').style.display = 'flex'; }

document.querySelectorAll('.diff-btn').forEach(btn => { btn.onclick = () => { document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedDifficulty = btn.getAttribute('data-diff'); }; });

document.querySelectorAll('.lang-btn').forEach(btn => { btn.onclick = () => setLanguage(btn.getAttribute('data-lang')); });

document.getElementById('start-btn').onclick = () => startGame(false); document.getElementById('continue-btn').onclick = () => startGame(true);

document.getElementById('codex-btn').onclick = () => document.getElementById('codex-modal').style.display = 'flex'; document.getElementById('close-codex-btn').onclick = () => document.getElementById('codex-modal').style.display = 'none';

document.getElementById('load-code-btn').onclick = () => document.getElementById('load-modal').style.display = 'flex'; document.getElementById('cancel-load-btn').onclick = () => document.getElementById('load-modal').style.display = 'none'; document.getElementById('confirm-load-btn').onclick = () => { const code = document.getElementById('save-code-input').value.trim(); if (code) loadFromCode(code); };

document.getElementById('pause-trigger-btn').onclick = togglePause; document.getElementById('resume-btn').onclick = togglePause; document.getElementById('export-code-btn').onclick = exportSaveCode; document.getElementById('restart-btn').onclick = () => { document.getElementById('pause-modal').style.display = 'none'; startGame(false); };

document.getElementById('quit-to-menu-btn').onclick = () => { document.getElementById('pause-modal').style.display = 'none'; document.getElementById('quit-modal').style.display = 'flex'; };

document.getElementById('cancel-quit-btn').onclick = () => document.getElementById('quit-modal').style.display = 'none'; document.getElementById('confirm-quit-btn').onclick = () => { document.getElementById('quit-modal').style.display = 'none'; document.getElementById('hud').style.display = 'none'; document.getElementById('start-menu').style.display = 'flex'; isGameRunning = false; checkAutoSave(); };

document.getElementById('gameover-restart-btn').onclick = () => { document.getElementById('gameover-modal').style.display = 'none'; startGame(false); };

checkAutoSave(); setLanguage('zh-Hant'); requestAnimationFrame(gameLoop);
