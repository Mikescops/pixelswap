function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function initVinylFilter() {
    const collection = document.getElementById('vinyls-collection');
    const itemsNode = document.getElementById('vinyls-items');
    const statusNode = document.getElementById('vinyls-status');
    const emptyNode = document.getElementById('vinyls-empty');
    const searchInput = document.getElementById('vinyls-search-input');
    const viewButtons = document.querySelectorAll('.vinyls-view-filter__btn');
    const sourceButtons = document.querySelectorAll('.vinyls-source-filter__btn');

    if (!collection || !itemsNode || !searchInput) {
        return;
    }

    const items = Array.from(itemsNode.querySelectorAll('.vinyl-item'));
    const countsBySource = items.reduce(
        (counts, item) => {
            const source = item.dataset.source || 'collection';
            counts[source] = (counts[source] || 0) + 1;
            return counts;
        },
        { collection: 0, wishlist: 0 },
    );

    let activeSource = 'collection';

    function setSource(source) {
        activeSource = source;
        collection.dataset.source = source;

        sourceButtons.forEach((button) => {
            const isActive = button.dataset.source === source;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        try {
            localStorage.setItem('vinyls-source', source);
        } catch {
            // ignore storage errors
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
            localStorage.setItem('vinyls-view', view);
        } catch {
            // ignore storage errors
        }
    }

    function updateStatus(visibleCount, query) {
        if (!statusNode) {
            return;
        }

        const totalForSource = countsBySource[activeSource] || 0;
        const label = activeSource === 'wishlist' ? 'wishlist items' : 'records';

        if (query) {
            statusNode.textContent = `${visibleCount} of ${totalForSource} ${label}`;
        } else {
            statusNode.textContent = `${totalForSource} ${label}`;
        }
    }

    function applyFilters() {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        items.forEach((item) => {
            const source = item.dataset.source || 'collection';
            const haystack = item.dataset.search || '';
            const matchesSource = source === activeSource;
            const matchesSearch = !query || haystack.includes(query);
            const matches = matchesSource && matchesSearch;

            item.hidden = !matches;
            if (matches) {
                visibleCount += 1;
            }
        });

        updateStatus(visibleCount, query);

        if (emptyNode) {
            const totalForSource = countsBySource[activeSource] || 0;
            emptyNode.hidden = visibleCount > 0;
            emptyNode.textContent =
                totalForSource === 0
                    ? 'No wishlist items yet. Run npm run sync-vinyls to import from Discogs.'
                    : 'No records match your search.';
        }
    }

    const debouncedFilter = debounce(applyFilters, 150);

    searchInput.addEventListener('input', debouncedFilter);
    searchInput.addEventListener('search', applyFilters);

    viewButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setView(button.dataset.view || 'grid');
        });
    });

    sourceButtons.forEach((button) => {
        if (button.disabled) {
            return;
        }

        button.addEventListener('click', () => {
            setSource(button.dataset.source || 'collection');
        });
    });

    try {
        const savedView = localStorage.getItem('vinyls-view');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        }
    } catch {
        // ignore storage errors
    }

    try {
        const savedSource = localStorage.getItem('vinyls-source');
        if (
            (savedSource === 'collection' || savedSource === 'wishlist') &&
            countsBySource[savedSource] > 0
        ) {
            setSource(savedSource);
        } else {
            applyFilters();
        }
    } catch {
        applyFilters();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVinylFilter);
} else {
    initVinylFilter();
}
