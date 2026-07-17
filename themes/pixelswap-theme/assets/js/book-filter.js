function debounceBooks(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function initBookFilter() {
    const collection = document.getElementById('books-collection');
    const itemsNode = document.getElementById('books-items');
    const statusNode = document.getElementById('books-status');
    const emptyNode = document.getElementById('books-empty');
    const searchInput = document.getElementById('books-search-input');
    const viewButtons = document.querySelectorAll('.books-view-filter__btn');
    const sourceButtons = document.querySelectorAll('.books-source-filter__btn');
    const readButtons = document.querySelectorAll('.books-read-filter__btn');
    const readFilterGroup = document.querySelector('.books-read-filter');

    if (!collection || !itemsNode || !searchInput) {
        return;
    }

    const items = Array.from(itemsNode.querySelectorAll('.book-item'));
    const countsBySource = items.reduce(
        (counts, item) => {
            const source = item.dataset.source || 'collection';
            counts[source] = (counts[source] || 0) + 1;
            return counts;
        },
        { collection: 0, wishlist: 0 },
    );

    let activeSource = 'collection';
    let activeRead = 'all';

    function setReadFilterVisibility() {
        if (!readFilterGroup) {
            return;
        }
        readFilterGroup.hidden = activeSource !== 'collection';
    }

    function setSource(source) {
        activeSource = source;
        collection.dataset.source = source;

        sourceButtons.forEach((button) => {
            const isActive = button.dataset.source === source;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (source !== 'collection') {
            setRead('all', false);
        }

        setReadFilterVisibility();

        try {
            localStorage.setItem('books-source', source);
        } catch {
            // ignore storage errors
        }

        applyFilters();
    }

    function setRead(read, persist = true) {
        activeRead = read;
        collection.dataset.read = read;

        readButtons.forEach((button) => {
            const isActive = button.dataset.read === read;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (persist) {
            try {
                localStorage.setItem('books-read', read);
            } catch {
                // ignore storage errors
            }
        }

        applyFilters();
    }

    function setView(view) {
        collection.dataset.view = view;

        viewButtons.forEach((button) => {
            const isActive = button.dataset.view === view;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        try {
            localStorage.setItem('books-view', view);
        } catch {
            // ignore storage errors
        }
    }

    function updateStatus(visibleCount, query) {
        if (!statusNode) {
            return;
        }

        const totalForSource = countsBySource[activeSource] || 0;
        const label = activeSource === 'wishlist' ? 'wishlist items' : 'books';

        if (query || (activeSource === 'collection' && activeRead !== 'all')) {
            statusNode.textContent = `${visibleCount} of ${totalForSource} ${label}`;
        } else {
            statusNode.textContent = `${totalForSource} ${label}`;
        }
    }

    function applyFilters() {
        closeOpenBookDetails();
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        items.forEach((item) => {
            const source = item.dataset.source || 'collection';
            const read = item.dataset.read || 'unread';
            const haystack = item.dataset.search || '';
            const matchesSource = source === activeSource;
            const matchesSearch = !query || haystack.includes(query);
            const matchesRead =
                activeSource !== 'collection' ||
                activeRead === 'all' ||
                read === activeRead;
            const matches = matchesSource && matchesSearch && matchesRead;

            item.hidden = !matches;
            if (matches) {
                visibleCount += 1;
            }
        });

        updateStatus(visibleCount, query);

        if (emptyNode) {
            const totalForSource = countsBySource[activeSource] || 0;
            emptyNode.hidden = visibleCount > 0;
            if (totalForSource === 0) {
                emptyNode.textContent =
                    activeSource === 'wishlist'
                        ? 'No wishlist items yet. Run npm run import-gleeph-books or npm run add-book -- --wishlist <isbn>.'
                        : 'No books yet. Run npm run import-gleeph-books or npm run add-book -- <isbn>.';
            } else {
                emptyNode.textContent = 'No books match your filters.';
            }
        }
    }

    function closeOpenBookDetails() {
        items.forEach((item) => {
            if (!item.classList.contains('is-open')) {
                return;
            }
            item.classList.remove('is-open');
            const trigger = item.querySelector('.book-item__cover-wrap');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function initTouchBookDetails() {
        const canHover = window.matchMedia('(hover: hover)').matches;
        if (canHover) {
            return;
        }

        items.forEach((item) => {
            const cover = item.querySelector('.book-item__cover-wrap');
            const card = item.querySelector('.book-item__hover-card');
            if (!cover || !card) {
                return;
            }

            cover.setAttribute('role', 'button');
            cover.setAttribute('tabindex', '0');
            cover.setAttribute('aria-expanded', 'false');
            cover.setAttribute('aria-label', `Show details for ${item.getAttribute('aria-label') || 'book'}`);

            const toggle = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const willOpen = !item.classList.contains('is-open');
                closeOpenBookDetails();
                if (willOpen) {
                    item.classList.add('is-open');
                    cover.setAttribute('aria-expanded', 'true');
                    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            };

            cover.addEventListener('click', toggle);
            cover.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    toggle(event);
                }
            });
        });

        document.addEventListener('click', (event) => {
            if (event.target.closest('.book-item.is-open')) {
                return;
            }
            closeOpenBookDetails();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeOpenBookDetails();
            }
        });
    }

    const debouncedFilter = debounceBooks(applyFilters, 150);

    searchInput.addEventListener('input', debouncedFilter);
    searchInput.addEventListener('search', applyFilters);

    viewButtons.forEach((button) => {
        button.addEventListener('click', () => {
            closeOpenBookDetails();
            setView(button.dataset.view || 'grid');
        });
    });

    sourceButtons.forEach((button) => {
        if (button.disabled) {
            return;
        }

        button.addEventListener('click', () => {
            closeOpenBookDetails();
            setSource(button.dataset.source || 'collection');
        });
    });

    readButtons.forEach((button) => {
        if (button.disabled) {
            return;
        }

        button.addEventListener('click', () => {
            closeOpenBookDetails();
            setRead(button.dataset.read || 'all');
        });
    });

    initTouchBookDetails();

    try {
        const savedView = localStorage.getItem('books-view');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        }
    } catch {
        // ignore storage errors
    }

    try {
        const savedRead = localStorage.getItem('books-read');
        if (savedRead === 'all' || savedRead === 'read' || savedRead === 'unread') {
            activeRead = savedRead;
            collection.dataset.read = savedRead;
            readButtons.forEach((button) => {
                const isActive = button.dataset.read === savedRead;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }
    } catch {
        // ignore storage errors
    }

    try {
        const savedSource = localStorage.getItem('books-source');
        if (
            (savedSource === 'collection' || savedSource === 'wishlist') &&
            countsBySource[savedSource] > 0
        ) {
            setSource(savedSource);
        } else {
            setReadFilterVisibility();
            applyFilters();
        }
    } catch {
        setReadFilterVisibility();
        applyFilters();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookFilter);
} else {
    initBookFilter();
}
