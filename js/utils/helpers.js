// helpers.js – utility functions
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
