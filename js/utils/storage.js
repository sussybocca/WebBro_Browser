// storage.js – localStorage wrapper with namespace
export const storage = {
    get(key, defaultValue) {
        try {
            const item = localStorage.getItem(`chaos:${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set(key, value) {
        localStorage.setItem(`chaos:${key}`, JSON.stringify(value));
    }
};
