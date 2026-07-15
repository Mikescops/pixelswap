function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
    try {
        return localStorage.getItem('theme-mode');
    } catch {
        return null;
    }
}

function getActiveTheme() {
    return document.documentElement.dataset.theme || getSystemTheme();
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem('theme-mode', theme);
    } catch {
        /* ignore */
    }

    document.querySelectorAll('.theme-toggle__btn').forEach((button) => {
        const isActive = button.dataset.theme === theme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function initThemeToggle() {
    const savedTheme = getStoredTheme();
    setTheme(savedTheme || getSystemTheme());

    document.querySelectorAll('.theme-toggle__btn').forEach((button) => {
        button.addEventListener('click', () => {
            setTheme(button.dataset.theme);
        });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (!getStoredTheme()) {
            setTheme(event.matches ? 'dark' : 'light');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}
