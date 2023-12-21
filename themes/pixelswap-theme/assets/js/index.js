hljs.initHighlightingOnLoad();

const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (localStorage.getItem('dark-mode') === null) {
    localStorage.setItem('dark-mode', true);
}

if (prefersDark || localStorage.getItem('dark-mode') === 'true') {
    document.documentElement.classList.add('dark');
}

document.querySelectorAll('.dark-mode-switcher').forEach(function (element) {
    element.addEventListener('click', function (event) {
        event.preventDefault();

        document.documentElement.classList.toggle('dark');
        element.firstChild.classList.toggle('fa-moon');
        element.firstChild.classList.toggle('fa-sun');
        localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
    });
});