/**
 * MAIN - Punto de entrada
 */

import CONFIG from './config.js';
import { getGameState, resetGameState } from './gameState.js';
import * as utils from './utils.js';

class PrimalsGame {
    constructor() {
        this.initialized = false;
        this.state = null;
        this.dom = {};
    }

    async init(options = {}) {
        console.log('Iniciando PRIMALS...');
        
        this.state = getGameState();
        
        const hasSave = this.checkExistingSave();
        
        if (hasSave && !options.forceNew) {
            await this.loadGame();
        } else {
            await this.newGame(options.character);
        }
        
        this.setupBasicUI();
        this.startGameLoop();
        
        this.initialized = true;
        console.log('Juego iniciado');
        
        return this;
    }
    
    async newGame(characterConfig = {}) {
        const config = {
            name: utils.generateName(characterConfig.gender || 'M'),
            gender: characterConfig.gender || 'M',
            startAge: characterConfig.startAge ?? 0,
            startMoney: characterConfig.startMoney ?? 0,
            ...characterConfig
        };
        
        this.state.initialize({ newGame: config });
        
        if (config.startAge === 0) {
            this.state.addHistory(
                `Has nacido. Bienvenido a ${this.state.world.year}.`,
                'event',
                ['neutral', 'Nacimiento']
            );
        }
        
        this.saveGame();
        return this.state;
    }
    
    async loadGame() {
        const saveData = localStorage.getItem('primals_save_slot_0');
        if (!saveData) {
            return this.newGame();
        }
        
        const result = this.state.load(saveData);
        if (!result.success) {
            return this.newGame();
        }
        
        this.state.data.meta.lastPlayed = new Date().toISOString();
        return this.state;
    }
    
    saveGame() {
        if (!this.state) return;
        
        const data = this.state.serialize();
        localStorage.setItem('primals_autosave', data);
        localStorage.setItem('primals_save_slot_0', data);
    }
    
    checkExistingSave() {
        return !!localStorage.getItem('primals_save_slot_0');
    }
    
    setupBasicUI() {
        this.dom = {
            playerName: document.getElementById('player-name'),
            playerMeta: document.getElementById('player-meta'),
            playerMoney: document.getElementById('player-money'),
            playerAvatar: document.getElementById('player-avatar'),
            avatarPlaceholder: document.getElementById('avatar-placeholder'),
            playerLevel: document.getElementById('player-level'),
            
            stats: {
                health: document.getElementById('stat-health'),
                happiness: document.getElementById('stat-happiness'),
                intelligence: document.getElementById('stat-intelligence'),
                strength: document.getElementById('stat-strength'),
                appearance: document.getElementById('stat-appearance')
            },
            
            primalsRow: document.getElementById('primals-row'),
            diary: document.getElementById('diary'),
            worldYear: document.getElementById('world-year'),
            monthsUsed: document.getElementById('months-used'),
            
            btnYear: document.getElementById('btn-year'),
            shopBtn: document.getElementById('shop-btn'),
            
            panels: {
                overlay: document.getElementById('overlay'),
                primal: document.getElementById('panel-primal'),
                player: document.getElementById('panel-player'),
                shop: document.getElementById('panel-shop')
            }
        };
        
        this.dom.btnYear?.addEventListener('click', () => this.nextYear());
        this.dom.shopBtn?.addEventListener('click', () => this.openShop());
        
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllPanels());
        });
        
        this.dom.panels.overlay?.addEventListener('click', () => this.closeAllPanels());
        
        document.querySelectorAll('.btn-footer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                this.openPanel(panel);
            });
        });
        
        document.getElementById('avatar-wrap')?.addEventListener('click', () => {
            this.openPanel('player');
        });
        
        this.render();
    }
    
    startGameLoop() {
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }
    
    nextYear() {
        this.state.incrementAge();
        
        const events = [
            'Nada especial este año.',
            'Aprendiste algo nuevo.',
            'Conociste a alguien interesante.',
            'Tuviste un día perfecto.'
        ];
        const randomEvent = utils.randomChoice(events);
        
        this.state.addHistory(randomEvent, 'event', ['neutral']);
        
        if (this.state.age > 40) {
            this.state.updateStats({ health: -1, strength: -0.5 });
        }
        
        this.render();
        this.saveGame();
    }
    
    render() {
        if (!this.dom || !this.state) return;
        
        const p = this.state.player;
        
        this.dom.playerName.textContent = p.name.full.toUpperCase();
        this.dom.playerMeta.textContent = `${p.age} años • ${p.job?.title || 'Sin profesión'}`;
        this.dom.playerMoney.textContent = utils.formatMoney(p.money);
        this.dom.worldYear.textContent = this.state.year;
        
        this.dom.stats.health.textContent = Math.floor(p.stats.health);
        this.dom.stats.happiness.textContent = Math.floor(p.stats.happiness);
        this.dom.stats.intelligence.textContent = Math.floor(p.stats.intelligence);
        this.dom.stats.strength.textContent = Math.floor(p.stats.strength);
        this.dom.stats.appearance.textContent = Math.floor(p.stats.appearance);
        
        this.dom.playerAvatar.className = `avatar-main age-${p.agePhase.toLowerCase()}`;
        this.dom.avatarPlaceholder.textContent = this.getPhaseEmoji(p.agePhase);
        this.dom.playerLevel.textContent = p.level;
        
        this.renderPrimals();
        this.renderDiary();
        
        if (this.dom.monthsUsed) {
            this.dom.monthsUsed.textContent = this.state.data.yearActions.monthsUsed;
        }
    }
    
    renderPrimals() {
        const container = this.dom.primalsRow;
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const primal = this.state.player.primals[i];
            const slot = document.createElement('div');
            slot.className = `primal-slot ${!primal ? 'empty' : ''}`;
            
            if (primal) {
                slot.onclick = () => this.openPrimalPanel(i);
                
                const color = this.getPrimalColor(primal.type);
                const orbClass = this.getPrimalClass(primal.type);
                
                slot.innerHTML = `
                    <div class="primal-orb ${orbClass}" style="--orb-color: ${color};">
                        <div class="primal-orb-placeholder">${primal.name?.[0] || 'P'}</div>
                    </div>
                    <div class="primal-stats-float">
                        <span style="color: #ff6b35;">❤️${Math.floor(primal.health || 0)}</span>
                        <span style="color: #ffaa00;">⚡${Math.floor(primal.energy || 0)}</span>
                    </div>
                `;
            } else {
                slot.innerHTML = `
                    <div class="primal-orb primal-empty">
                        <div class="primal-orb-placeholder">${i + 1}</div>
                    </div>
                    <div class="primal-stats-float"><span style="color: #666;">VACÍO</span></div>
                `;
            }
            
            container.appendChild(slot);
        }
    }
    
    renderDiary() {
        const container = this.dom.diary;
        if (!container) return;
        
        const entries = this.state.player.history.slice(0, 20);
        
        if (entries.length === 0) {
            container.innerHTML = '<div class="diary-empty">No hay eventos registrados</div>';
            return;
        }
        
        container.innerHTML = '';
        entries.forEach(entry => {
            const div = document.createElement('div');
            div.className = `diary-entry entry-${entry.type}`;
            
            const tag = entry.tags?.[0] || 'neutral';
            const tagClass = `tag-${tag}`;
            const tagText = entry.tags?.[1] || '';
            
            div.innerHTML = `
                <span class="entry-year">+${entry.age}</span>
                <span class="entry-text">${entry.text}</span>
                ${tagText ? `<span class="entry-tag ${tagClass}">${tagText}</span>` : ''}
            `;
            container.appendChild(div);
        });
    }
    
    getPhaseEmoji(phase) {
        const emojis = {
            'BABY': '👶',
            'CHILD': '🧒',
            'TEEN': '🧑',
            'ADULT': '👤',
            'ELDERLY': '👴'
        };
        return emojis[phase] || '?';
    }
    
    getPrimalColor(type) {
        const colors = {
            'EMBER': '#ff6b35',
            'TIDE': '#00ffff',
            'VOLT': '#ffd700'
        };
        return colors[type] || '#666';
    }
    
    getPrimalClass(type) {
        const classes = {
            'EMBER': 'primal-ember',
            'TIDE': 'primal-tide',
            'VOLT': 'primal-volt'
        };
        return classes[type] || 'primal-empty';
    }
    
    openPanel(type) {
        this.closeAllPanels();
        
        const panelMap = {
            'life': 'player',
            'leisure': 'player',
            'people': 'player',
            'work': 'player',
            'primal': 'primal',
            'shop': 'shop'
        };
        
        const panelId = panelMap[type];
        if (panelId && this.dom.panels[panelId]) {
            this.dom.panels[panelId].classList.add('open');
            this.dom.panels.overlay.classList.add('active');
        }
        
        if (type === 'shop') this.renderShopPanel();
    }
    
    openPrimalPanel(index) {
        const primal = this.state.player.primals[index];
        if (!primal) return;
        this.openPanel('primal');
    }
    
    openShop() {
        this.openPanel('shop');
    }
    
    renderShopPanel() {
        const content = document.getElementById('shop-content');
        if (!content) return;
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
                <div style="font-size: 18px; color: #ffd700;">Mercado de Primals</div>
                <div style="font-size: 14px; color: #8b949e; margin-top: 5px;">
                    ${utils.formatMoney(this.state.player.money)}
                </div>
            </div>
            <div class="action-grid" style="grid-template-columns: 1fr;">
                <button class="action-btn" style="flex-direction: row; justify-content: space-between; padding: 15px;" 
                        onclick="game.buyItem('seal_basic')">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 28px;">🔺</span>
                        <div style="text-align: left;">
                            <div style="font-size: 14px; font-weight: 700; color: white;">Sello Básico</div>
                            <div style="font-size: 11px; color: #8b949e;">Rango C</div>
                        </div>
                    </div>
                    <div style="color: #ffd700; font-weight: 800;">◉800</div>
                </button>
            </div>
        `;
    }
    
    closeAllPanels() {
        Object.values(this.dom.panels).forEach(panel => {
            panel?.classList.remove('active', 'open');
        });
    }
    
    buyItem(itemId) {
        const prices = {
            'seal_basic': 800,
            'seal_pro': 5000
        };
        
        const price = prices[itemId];
        if (!price) return;
        
        if (this.state.player.money < price) {
            alert('No tienes suficientes créditos');
            return;
        }
        
        this.state.updateMoney(-price);
        
        if (itemId.startsWith('seal_')) {
            const type = itemId.replace('seal_', '');
            this.state.player.inventory.seals[type === 'basic' ? 'basic' : 'professional']++;
        }
        
        this.render();
        this.saveGame();
        this.closeAllPanels();
    }
}

let game = null;

async function initGame(options = {}) {
    game = new PrimalsGame();
    await game.init(options);
    
    window.game = game;
    window.CONFIG = CONFIG;
    window.utils = utils;
    
    return game;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGame());
} else {
    initGame();
}

export { PrimalsGame, initGame, game };
export default PrimalsGame;