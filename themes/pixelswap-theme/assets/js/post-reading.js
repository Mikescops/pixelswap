function initPostReadingProgress() {
    const postPage = document.querySelector('.post-page');
    const navBar = document.querySelector('.post-nav-bar');
    const progressFill = document.querySelector('.post-nav-bar__progress-fill');
    const progressBar = document.querySelector('.post-nav-bar__progress');
    const headerTitle = document.querySelector('.post-header__title');
    const content = document.querySelector('.post-content');

    if (!postPage || !navBar || !progressFill || !content) {
        return;
    }

    let ticking = false;

    function update() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const contentTop = content.offsetTop;
        const contentHeight = content.offsetHeight;
        const start = Math.max(0, contentTop - windowHeight * 0.35);
        const end = Math.max(start + 1, contentTop + contentHeight - windowHeight * 0.55);
        const progress = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));

        progressFill.style.transform = `scaleX(${progress / 100})`;

        if (progressBar) {
            progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
        }

        const showNavTitle = headerTitle ? headerTitle.getBoundingClientRect().bottom < 72 : scrollY > 240;
        navBar.classList.toggle('is-scrolled', showNavTitle);

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostReadingProgress);
} else {
    initPostReadingProgress();
}
