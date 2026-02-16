/**
 * UTILS - Funciones auxiliares
 */

// Números aleatorios
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Selección ponderada
export function weightedRandom(options) {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
        random -= option.weight;
        if (random <= 0) {
            return option.value;
        }
    }
    return options[options.length - 1].value;
}

export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Mezclar array
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Tirada de probabilidad (0-1)
export function roll(chance) {
    return Math.random() < chance;
}

// Limitar valores
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function clampStat(value) {
    return clamp(value, 0, 100);
}

export function clampMoney(value) {
    return Math.max(0, Math.min(value, 999999999));
}

// Formato
export function formatNumber(num) {
    return num.toLocaleString('es-ES');
}

export function formatMoney(amount) {
    return `◉ ${formatNumber(Math.floor(amount))}`;
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Nombres
export function generateName(gender = 'M') {
    const maleNames = ['Alex', 'Marcus', 'Chen', 'Diego', 'Leo', 'Kai', 'Omar', 'Sven'];
    const femaleNames = ['Mara', 'Luna', 'Sofia', 'Yuki', 'Zara', 'Nina', 'Ava', 'Iris'];
    const surnames = ['Voss', 'Chen', 'López', 'Sato', 'Rossi', 'Kim', 'Ali', 'Dubois'];
    
    const firstNames = gender === 'F' ? femaleNames : maleNames;
    const first = randomChoice(firstNames);
    const last = randomChoice(surnames);
    
    return { first, last, full: `${first} ${last}` };
}

// ID único
export function generateId(prefix = '') {
    return `${prefix}_${Date.now()}_${randomInt(1000, 9999)}`;
}

// Edad y fases
export function calculateAge(birthYear, currentYear) {
    return currentYear - birthYear;
}

export function getLifePhase(age) {
    if (age < 3) return 'BABY';
    if (age < 13) return 'CHILD';
    if (age < 18) return 'TEEN';
    if (age < 65) return 'ADULT';
    return 'ELDERLY';
}

export function getPhaseLabel(phase) {
    const labels = {
        'BABY': 'Bebé',
        'CHILD': 'Niño',
        'TEEN': 'Adolescente',
        'ADULT': 'Adulto',
        'ELDERLY': 'Anciano'
    };
    return labels[phase] || 'Desconocido';
}

// Arrays
export function findById(array, id) {
    return array.find(item => item.id === id);
}

export function findIndexById(array, id) {
    return array.findIndex(item => item.id === id);
}

export function removeById(array, id) {
    return array.filter(item => item.id !== id);
}

export function updateById(array, id, updates) {
    return array.map(item => 
        item.id === id ? { ...item, ...updates } : item
    );
}

// Debug
export function log(message, data = null) {
    if (window.location.hostname === 'localhost' || window.DEBUG) {
        console.log(`[PRIMALS] ${message}`, data || '');
    }
}

// Exportar todo junto
export default {
    randomInt,
    randomFloat,
    weightedRandom,
    randomChoice,
    shuffle,
    roll,
    clamp,
    clampStat,
    clampMoney,
    formatNumber,
    formatMoney,
    capitalize,
    generateName,
    generateId,
    calculateAge,
    getLifePhase,
    getPhaseLabel,
    findById,
    findIndexById,
    removeById,
    updateById,
    log
};