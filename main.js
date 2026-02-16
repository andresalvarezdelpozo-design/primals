// Estado del juego
const game = {
    year: 2024,
    player: {
        name: 'Bebé Desconocido',
        age: 0,
        money: 0,
        level: 1,
        job: 'Sin profesión',
        stats: {
            health: 100,
            happiness: 100,
            intelligence: 50,
            strength: 50,
            appearance: 50
        }
    },
    primals: [null, null, null], // [izquierda, derecha, establo]
    history: [{ year: 2024, age: 0, text: 'Has nacido. Bienvenido a 2024.', type: 'event', tags: ['neutral', 'Nacimiento'] }]
};

// Referencias DOM
const dom = {
    playerName: document.getElementById('playerName'),
    playerMeta: document.getElementById('playerMeta'),
    playerMoney: document.getElementById('playerMoney'),
    playerAvatar: document.getElementById('playerAvatar'),
    avatarPlaceholder: document.getElementById('avatarPlaceholder'),
    playerLevel: document.getElementById('playerLevel'),
    stats: {
        health: document.getElementById('statHealth'),
        happiness: document.getElementById('statHappiness'),
        intelligence: document.getElementById('statIntelligence'),
        strength: document.getElementById('statStrength'),
        appearance: document.getElementById('statAppearance')
    },
    diary: document.getElementById('diary'),
    btnYear: document.getElementById('btn-year'),
    shopBtn: document.getElementById('shop-btn'),
    avatarWrap: document.getElementById('avatar-wrap'),
    overlay: document.getElementById('overlay'),
    panels: {
        primal: document.getElementById('primalPanel'),
        player: document.getElementById('playerPanel'),
        shop: document.getElementById('shopPanel')
    },
    primalLeft: document.getElementById('primal-left'),
    primalRight: document.getElementById('primal-right'),
    primalBottom: document.getElementById('primal-bottom')
};

// Inicializar
function init() {
    loadGame();
    setupEventListeners();
    updateUI();
    setupBackground();
}

// Event listeners
function setupEventListeners() {
    // Botón año
    dom.btnYear.addEventListener('click', nextYear);
    
    // Botón tienda
    dom.shopBtn.addEventListener('click', () => openPanel('shop'));
    
    // Avatar (perfil)
    dom.avatarWrap.addEventListener('click', () => openPanel('player'));
    
    // Primals
    dom.primalLeft.addEventListener('click', () => openPrimalPanel(0));
    dom.primalRight.addEventListener('click', () => openPrimalPanel(1));
    dom.primalBottom.addEventListener('click', () => openPrimalPanel(2));
    
    // Cerrar paneles
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', closeAllPanels);
    });
    dom.overlay.addEventListener('click', closeAllPanels);
    
    // Footer buttons
    document.querySelectorAll('.btn-footer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const panel = e.currentTarget.dataset.panel;
            openPanel(panel === 'life' ? 'player' : panel);
        });
    });
}

// Pasar año
function nextYear() {
    game.year++;
    game.player.age++;
    
    // Efectos edad
    if (game.player.age > 40) {
        game.player.stats.health -= 1;
        game.player.stats.strength -= 0.5;
    }
    if (game.player.age > 60) {
        game.player.stats.health -= 2;
    }
    
    // Clamp stats
    for (let stat in game.player.stats) {
        game.player.stats[stat] = Math.max(0, Math.min(100, game.player.stats[stat]));
    }
    
    // Evento random
    const events = [
        { text: 'Nada especial este año.', type: 'neutral' },
        { text: 'Aprendiste algo nuevo.', type: 'good' },
        { text: 'Conociste a alguien interesante.', type: 'neutral' },
        { text: 'Tuviste un buen día.', type: 'good' },
        { text: 'Te resfriaste.', type: 'bad' }
    ];
    const evt = events[Math.floor(Math.random() * events.length)];
    
    addHistory(evt.text, 'event', [evt.type]);
    
    saveGame();
    updateUI();
}

// Añadir al historial
function addHistory(text, type, tags) {
    game.history.unshift({
        year: game.year,
        age: game.player.age,
        text,
        type,
        tags,
        timestamp: Date.now()
    });
    
    // Limitar a 50
    if (game.history.length > 50) {
        game.history = game.history.slice(0, 50);
    }
}

// Actualizar UI
function updateUI() {
    const p = game.player;
    
    // Info básica
    dom.playerName.textContent = p.name.toUpperCase();
    dom.playerMeta.textContent = `${p.age} años • ${p.job}`;
    dom.playerMoney.textContent = `◉ ${p.money.toLocaleString()} CRÉDITOS`;
    dom.playerLevel.textContent = p.level;
    
    // Avatar
    const phase = getLifePhase(p.age);
    dom.playerAvatar.className = `avatar-main age-${phase}`;
    dom.avatarPlaceholder.textContent = getPhaseEmoji(phase);
    
    // Stats
    dom.stats.health.textContent = Math.floor(p.stats.health);
    dom.stats.happiness.textContent = Math.floor(p.stats.happiness);
    dom.stats.intelligence.textContent = Math.floor(p.stats.intelligence);
    dom.stats.strength.textContent = Math.floor(p.stats.strength);
    dom.stats.appearance.textContent = Math.floor(p.stats.appearance);
    
    // Warnings
    dom.stats.health.parentElement.classList.toggle('stat-warning', p.stats.health < 30);
    dom.stats.happiness.parentElement.classList.toggle('stat-warning', p.stats.happiness < 20);
    
    // Primals
    updatePrimalsUI();
    
    // Historial
    updateDiary();
}

// Actualizar primals en UI
function updatePrimalsUI() {
    const slots = [dom.primalLeft, dom.primalRight, dom.primalBottom];
    const labels = ['1', '2', 'ESTABLO'];
    
    game.primals.forEach((primal, i) => {
        const slot = slots[i];
        if (!slot) return;
        
        if (primal) {
            const color = getPrimalColor(primal.type);
            const orbClass = `primal-${primal.type.toLowerCase()}`;
            
            slot.innerHTML = `
                <div class="primal-orb ${orbClass} sealed" style="--orb-color: ${color};">
                    <div class="primal-orb-placeholder">${primal.name[0]}</div>
                </div>
                <div class="primal-stats-float">
                    <span style="color: #ff6b35;">❤️${Math.floor(primal.health)}</span>
                    <span style="color: #ffaa00;">⚡${Math.floor(primal.energy)}</span>
                </div>
            `;
            slot.classList.remove('empty');
        } else {
            slot.innerHTML = `
                <div class="primal-orb primal-empty">
                    <div class="primal-orb-placeholder">${labels[i]}</div>
                </div>
                <div class="primal-stats-float"><span style="color: #666;">${i === 2 ? 'ESTABLO' : 'VACÍO'}</span></div>
            `;
            slot.classList.add('empty');
        }
    });
}

// Actualizar diario
function updateDiary() {
    dom.diary.innerHTML = '';
    
    game.history.slice(0, 20).forEach(entry => {
        const div = document.createElement('div');
        div.className = `diary-entry entry-${entry.type}`;
        
        const tagClass = `tag-${entry.tags[0] || 'neutral'}`;
        const tagText = entry.tags[1] || '';
        
        div.innerHTML = `
            <span class="entry-year">+${entry.age}</span>
            <span class="entry-text">${entry.text}</span>
            ${tagText ? `<span class="entry-tag ${tagClass}">${tagText}</span>` : ''}
        `;
        dom.diary.appendChild(div);
    });
}

// Abrir paneles
function openPanel(type) {
    closeAllPanels();
    
    const panel = dom.panels[type];
    if (panel) {
        panel.classList.add('open');
        dom.overlay.classList.add('active');
        
        // Render contenido específico
        if (type === 'player') renderPlayerPanel();
        if (type === 'shop') renderShopPanel();
    }
}

// Abrir panel primal
function openPrimalPanel(index) {
    const primal = game.primals[index];
    if (!primal) {
        // Mostrar opción de captura si no tiene primal
        renderEmptyPrimalPanel(index);
    } else {
        renderPrimalPanel(primal, index);
    }
    dom.panels.primal.classList.add('open');
    dom.overlay.classList.add('active');
}

// Render panel jugador
function renderPlayerPanel() {
    const content = document.getElementById('playerPanelContent');
    const p = game.player;
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div class="player-big-avatar age-${getLifePhase(p.age)}" style="--orb-color: #00ff88;">
                <div class="player-big-avatar-placeholder">${getPhaseEmoji(getLifePhase(p.age))}</div>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: white;">${p.name}</div>
            <div style="font-size: 14px; color: #8b949e;">Nivel ${p.level} • ${getPhaseLabel(getLifePhase(p.age))}</div>
        </div>
        
        ${renderStatBar('❤️', 'Salud', p.stats.health, '#ff4444')}
        ${renderStatBar('😊', 'Felicidad', p.stats.happiness, '#ffaa00')}
        ${renderStatBar('🧠', 'Inteligencia', p.stats.intelligence, '#00d4ff')}
        ${renderStatBar('💪', 'Fuerza', p.stats.strength, '#ff8800')}
        ${renderStatBar('✨', 'Apariencia', p.stats.appearance, '#ff66ff')}
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px;">
            <div style="color: #8b949e; font-size: 12px; margin-bottom: 5px;">DINERO</div>
            <div style="color: #00ff88; font-size: 20px; font-weight: 800;">◉ ${p.money.toLocaleString()}</div>
        </div>
    `;
}

function renderStatBar(icon, label, value, color) {
    return `
        <div class="stat-detail">
            <div class="detail-icon" style="background: ${color};">${icon}</div>
            <div class="detail-bar-bg">
                <div class="detail-bar-fill" style="width: ${value}%; background: ${color};"></div>
            </div>
            <div class="detail-value">${Math.floor(value)}%</div>
        </div>
    `;
}

// Render panel tienda
function renderShopPanel() {
    const content = document.getElementById('shopPanelContent');
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
            <div style="font-size: 18px; color: #ffd700;">Mercado de Primals</div>
            <div style="font-size: 14px; color: #8b949e; margin-top: 5px;">◉ ${game.player.money.toLocaleString()}</div>
        </div>
        <div class="action-grid" style="grid-template-columns: 1fr;">
            <button class="action-btn" style="flex-direction: row; justify-content: space-between; padding: 15px;" onclick="buyItem('seal_basic', 800)">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">🔺</span>
                    <div style="text-align: left;">
                        <div style="font-size: 14px; font-weight: 700; color: white;">Sello Básico</div>
                        <div style="font-size: 11px; color: #8b949e;">Para capturar Primals</div>
                    </div>
                </div>
                <div style="color: #ffd700; font-weight: 800;">◉800</div>
            </button>
        </div>
    `;
}

// Render panel primal vacío
function renderEmptyPrimalPanel(index) {
    const content = document.getElementById('primalPanelContent');
    const slotNames = ['izquierda', 'derecha', 'establo'];
    
    content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🔺</div>
            <div style="font-size: 20px; font-weight: 800; color: white; margin-bottom: 10px;">Slot ${slotNames[index]} vacío</div>
            <div style="font-size: 14px; color: #8b949e; margin-bottom: 30px;">Necesitas un Sello para capturar un Primal</div>
            <button class="btn-year" onclick="closeAllPanels(); openPanel('shop')" style="max-width: 200px;">Ir a la tienda</button>
        </div>
    `;
}

// Render panel primal con datos
function renderPrimalPanel(primal, index) {
    const content = document.getElementById('primalPanelContent');
    const color = getPrimalColor(primal.type);
    
    content.innerHTML = `
        <div class="big-primal">
            <div class="big-orb primal-${primal.type.toLowerCase()}" style="--orb-color: ${color}; color: ${color}; border-color: ${color};">
                <div class="big-orb-placeholder">${primal.name[0]}</div>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: ${color};">${primal.name}</div>
            <div style="font-size: 13px; color: #8b949e;">${primal.species || 'Primal salvaje'}</div>
            <div style="font-size: 11px; color: #00ff88; margin-top: 5px;">◉ SELLADO</div>
        </div>
        
        ${renderStatBar('❤️', 'Salud', primal.health, '#ff6b35')}
        ${renderStatBar('⚡', 'Energía', primal.energy, '#ffaa00')}
        ${renderStatBar('💜', 'Vínculo', primal.bond, '#ff66ff')}
        ${renderStatBar('⚔️', 'Poder', primal.power, '#ff8800')}
        
        <div class="action-grid">
            <button class="action-btn" onclick="primalAction(${index}, 'train')">
                <span class="action-icon">🏋️</span>
                <span class="action-name">Entrenar</span>
            </button>
            <button class="action-btn" onclick="primalAction(${index}, 'feed')">
                <span class="action-icon">🍖</span>
                <span class="action-name">Alimentar</span>
            </button>
            <button class="action-btn" onclick="primalAction(${index}, 'rest')">
                <span class="action-icon">😴</span>
                <span class="action-name">Descansar</span>
            </button>
        </div>
    `;
}

// Acciones primal
function primalAction(index, action) {
    const primal = game.primals[index];
    if (!primal) return;
    
    switch(action) {
        case 'train':
            primal.power += 5;
            primal.energy -= 10;
            addHistory(`${primal.name} entrenó duro`, 'primal', ['good', '+Poder']);
            break;
        case 'feed':
            primal.health += 10;
            primal.energy += 5;
            game.player.money -= 50;
            addHistory(`Alimentaste a ${primal.name}`, 'primal', ['good', '+Salud']);
            break;
        case 'rest':
            primal.energy += 20;
            addHistory(`${primal.name} descansó`, 'primal', ['neutral', '+Energía']);
            break;
    }
    
    // Clamp
    primal.health = Math.max(0, Math.min(100, primal.health));
    primal.energy = Math.max(0, Math.min(100, primal.energy));
    primal.power = Math.max(0, Math.min(100, primal.power));
    primal.bond = Math.max(0, Math.min(100, primal.bond));
    
    saveGame();
    updateUI();
    renderPrimalPanel(primal, index);
}

// Comprar item
function buyItem(item, price) {
    if (game.player.money < price) {
        alert('No tienes suficientes créditos');
        return;
    }
    
    if (item === 'seal_basic') {
        // Añadir primal de prueba (temporal)
        const emptySlot = game.primals.findIndex(p => p === null);
        if (emptySlot === -1) {
            alert('No tienes espacio para más Primals');
            return;
        }
        
        game.player.money -= price;
        game.primals[emptySlot] = {
            name: ['EMBER', 'TIDE', 'VOLT'][emptySlot],
            type: ['EMBER', 'TIDE', 'VOLT'][emptySlot],
            health: 80,
            energy: 60,
            bond: 50,
            power: 40
        };
        
        addHistory(`Capturaste a ${game.primals[emptySlot].name}`, 'primal', ['good', '¡Captura!']);
    }
    
    saveGame();
    updateUI();
    closeAllPanels();
}

// Cerrar paneles
function closeAllPanels() {
    Object.values(dom.panels).forEach(panel => {
        panel?.classList.remove('open');
    });
    dom.overlay.classList.remove('active');
}

// Helpers
function getLifePhase(age) {
    if (age < 3) return 'baby';
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    if (age < 65) return 'adult';
    return 'elderly';
}

function getPhaseEmoji(phase) {
    const emojis = {
        'baby': '👶',
        'child': '🧒',
        'teen': '🧑',
        'adult': '👤',
        'elderly': '👴'
    };
    return emojis[phase] || '?';
}

function getPhaseLabel(phase) {
    const labels = {
        'baby': 'Bebé',
        'child': 'Niño',
        'teen': 'Adolescente',
        'adult': 'Adulto',
        'elderly': 'Anciano'
    };
    return labels[phase] || 'Desconocido';
}

function getPrimalColor(type) {
    const colors = {
        'EMBER': '#ff6b35',
        'TIDE': '#00ffff',
        'VOLT': '#ffd700'
    };
    return colors[type] || '#666';
}

// Guardar/Cargar
function saveGame() {
    localStorage.setItem('primals_save', JSON.stringify(game));
}

function loadGame() {
    const saved = localStorage.getItem('primals_save');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(game, data);
    }
}

// Fondo dinámico
function setupBackground() {
    const updateSky = () => {
        const hour = new Date().getHours();
        const sky = document.getElementById('sky');
        const sun = document.getElementById('sun');
        const moon = document.getElementById('moon');
        
        sky.className = 'sky';
        
        if (hour >= 6 && hour < 18) {
            sky.classList.add('day');
            sun.style.display = 'block';
            moon.style.display = 'none';
        } else if (hour >= 18 && hour < 21) {
            sky.classList.add('sunset');
            sun.style.display = 'block';
            moon.style.display = 'none';
        } else {
            sky.classList.add('night');
            sun.style.display = 'none';
            moon.style.display = 'block';
        }
    };

    // Crear estrellas
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }

    updateSky();
    setInterval(updateSky, 60000);
}

// Exponer funciones globales para los onclick
window.buyItem = buyItem;
window.primalAction = primalAction;
window.closeAllPanels = closeAllPanels;
window.openPanel = openPanel;

// Iniciar
init();