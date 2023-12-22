hljs.initHighlightingOnLoad();

document.querySelectorAll('.dark-mode-switcher').forEach((element) => {
    element.addEventListener('click', function (event) {
        event.preventDefault();

        document.documentElement.classList.toggle('dark');
        element.firstChild.classList.toggle('fa-moon');
        element.firstChild.classList.toggle('fa-sun');
        localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
    });
});