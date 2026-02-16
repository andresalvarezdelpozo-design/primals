/**
 * GAMESTATE - Estado del juego
 */

import CONFIG from './config.js';
import * as utils from './utils.js';

export class GameState {
    constructor() {
        this.initialized = false;
        this.data = this.createEmptyState();
    }

    createEmptyState() {
        const year = 2024;
        
        return {
            meta: {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastPlayed: new Date().toISOString(),
                playTimeMinutes: 0
            },
            
            world: {
                year: year,
                globalEvents: []
            },
            
            player: {
                id: utils.generateId('char'),
                name: { first: 'Bebé', last: 'Desconocido', full: 'Bebé Desconocido' },
                gender: 'M',
                birthYear: year,
                age: 0,
                agePhase: 'BABY',
                
                stats: {
                    health: 100,
                    happiness: 100,
                    intelligence: 50,
                    strength: 50,
                    appearance: 50,
                    karma: 50
                },
                
                hidden: {
                    fertility: 100,
                    stress: 0,
                    addiction: 0,
                    primalDrain: 0
                },
                
                level: 1,
                experience: 0,
                money: 0,
                income: 0,
                
                education: {
                    level: 'NONE',
                    completed: [],
                    inProgress: null
                },
                
                licenses: {
                    primal: false,
                    drive: false,
                    fly: false,
                    weapon: false
                },
                
                job: null,
                
                properties: {
                    house: null,
                    vehicle: null,
                    stableSlots: 2
                },
                
                family: {
                    father: null,
                    mother: null,
                    siblings: [],
                    partner: null,
                    children: [],
                    exPartners: []
                },
                
                primals: [],
                
                inventory: {
                    seals: {
                        basic: 0,
                        professional: 0,
                        military: 0,
                        blackMarket: 0
                    },
                    items: [],
                    traps: [],
                    bait: []
                },
                
                history: [],
                
                flags: {
                    hasSeenPrimal: false,
                    hasCapturedPrimal: false,
                    married: false,
                    widowed: false,
                    divorced: false,
                    criminalRecord: [],
                    wanted: false,
                    sick: null,
                    inHospital: false,
                    famous: false,
                    legendaryTamer: false
                }
            },
            
            npcs: {},
            
            yearActions: {
                monthsUsed: 0,
                traveled: false,
                studied: 0,
                workedExtra: false,
                primalTrained: [],
                crimesCommitted: []
            }
        };
    }

    initialize(options = {}) {
        if (options.loadFromSave) {
            this.load(options.loadFromSave);
        } else if (options.newGame) {
            this.createNewCharacter(options.newGame);
        }
        
        this.initialized = true;
        this.clampAllStats();
        return this;
    }

    createNewCharacter(options = {}) {
        const state = this.createEmptyState();
        
        if (options.name) state.player.name = options.name;
        if (options.gender) state.player.gender = options.gender;
        if (options.startAge) {
            state.player.birthYear = state.world.year - options.startAge;
            state.player.age = options.startAge;
            this.updateAgePhase(state);
        }
        if (options.startMoney) {
            state.player.money = options.startMoney;
        }
        
        this.data = state;
        return this;
    }

    get player() { return this.data.player; }
    get world() { return this.data.world; }
    get year() { return this.data.world.year; }
    get age() { return this.player.age; }
    get phase() { return this.player.agePhase; }

    updatePlayer(updates) {
        this.data.player = { ...this.data.player, ...updates };
        return this;
    }
    
    updateStats(statChanges) {
        for (const [stat, change] of Object.entries(statChanges)) {
            if (this.player.stats[stat] !== undefined) {
                this.player.stats[stat] += change;
            }
        }
        this.clampAllStats();
        return this;
    }
    
    updateMoney(amount) {
        this.player.money = utils.clampMoney(this.player.money + amount);
        return this;
    }
    
    addHistory(text, type = 'event', tags = []) {
        const entry = {
            id: utils.generateId('hist'),
            year: this.year,
            age: this.age,
            text,
            type,
            tags,
            timestamp: Date.now()
        };
        
        this.player.history.unshift(entry);
        
        if (this.player.history.length > 100) {
            this.player.history = this.player.history.slice(0, 100);
        }
        
        return this;
    }

    incrementAge() {
        this.player.age++;
        this.data.world.year++;
        this.updateAgePhase();
        this.resetYearActions();
        return this;
    }
    
    updateAgePhase(state = this.data) {
        state.player.agePhase = utils.getLifePhase(state.player.age);
        return this;
    }
    
    resetYearActions() {
        this.data.yearActions = {
            monthsUsed: 0,
            traveled: false,
            studied: 0,
            workedExtra: false,
            primalTrained: [],
            crimesCommitted: []
        };
        return this;
    }

    clampAllStats() {
        for (const stat of Object.keys(this.player.stats)) {
            this.player.stats[stat] = utils.clampStat(this.player.stats[stat]);
        }
        
        this.player.hidden.stress = utils.clamp(this.player.hidden.stress, 0, 100);
        this.player.hidden.addiction = utils.clamp(this.player.hidden.addiction, 0, 100);
        this.player.hidden.primalDrain = utils.clamp(this.player.hidden.primalDrain, 0, 100);
        
        const age = this.player.age;
        let fertility = 100;
        if (age > 30) fertility -= (age - 30) * 2;
        if (age > 50) fertility = Math.max(0, fertility - 30);
        this.player.hidden.fertility = utils.clamp(fertility, 0, 100);
        
        return this;
    }

    addPrimal(primalData) {
        if (this.player.primals.length >= 3) {
            return { success: false, error: 'MAX_PRIMALS_REACHED' };
        }
        
        const primal = {
            id: utils.generateId('primal'),
            capturedAt: this.year,
            ageCurrent: primalData.age || 0,
            ...primalData
        };
        
        this.player.primals.push(primal);
        this.player.flags.hasCapturedPrimal = true;
        
        return { success: true, primal };
    }
    
    removePrimal(primalId, reason = 'unknown') {
        const index = utils.findIndexById(this.player.primals, primalId);
        if (index === -1) return { success: false, error: 'PRIMAL_NOT_FOUND' };
        
        const primal = this.player.primals[index];
        this.player.primals.splice(index, 1);
        
        this.addHistory(
            `${primal.name} ya no está contigo (${reason})`,
            'primal',
            ['bad', 'Perdido']
        );
        
        return { success: true, primal };
    }
    
    getPrimal(id) {
        return utils.findById(this.player.primals, id);
    }
    
    updatePrimal(id, updates) {
        const index = utils.findIndexById(this.player.primals, id);
        if (index === -1) return false;
        
        this.player.primals[index] = { 
            ...this.player.primals[index], 
            ...updates 
        };
        return true;
    }

    addNPC(npcData) {
        const id = utils.generateId('npc');
        this.data.npcs[id] = {
            id,
            created: this.year,
            ...npcData
        };
        return id;
    }
    
    getNPC(id) {
        return this.data.npcs[id] || null;
    }
    
    updateNPC(id, updates) {
        if (!this.data.npcs[id]) return false;
        this.data.npcs[id] = { ...this.data.npcs[id], ...updates };
        return true;
    }

    setFlag(flag, value) {
        this.player.flags[flag] = value;
        return this;
    }
    
    hasFlag(flag) {
        return !!this.player.flags[flag];
    }

    serialize() {
        return JSON.stringify(this.data);
    }
    
    load(serializedData) {
        try {
            const parsed = JSON.parse(serializedData);
            this.data = parsed;
            this.clampAllStats();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    
    exportToObject() {
        return JSON.parse(JSON.stringify(this.data));
    }

    debugLog() {
        utils.log('GameState:', {
            age: this.age,
            phase: this.phase,
            money: this.player.money,
            primals: this.player.primals.length,
            health: this.player.stats.health
        });
    }
}

let instance = null;

export function getGameState() {
    if (!instance) {
        instance = new GameState();
    }
    return instance;
}

export function resetGameState() {
    instance = new GameState();
    return instance;
}

export function createNewGameState() {
    return new GameState();
}

export default GameState;