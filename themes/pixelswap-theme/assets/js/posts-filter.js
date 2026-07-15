function escapeHtml(value) {
    return (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function truncateText(value, maxLength = 220) {
    const text = (value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}…`;
}

function formatDateLabel(isoDate, lang) {
    if (!isoDate) {
        return '';
    }

    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return isoDate;
    }

    const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function comparePostsByDate(a, b) {
    const dateA = a.meta?.date || '';
    const dateB = b.meta?.date || '';
    return dateB.localeCompare(dateA);
}

function renderSearchResult(result, featured = false) {
    const meta = result.meta || {};
    const lang = meta.language || 'en';
    const readMore = meta.readMore || (lang === 'fr' ? "Lire l'article" : 'Read more');
    const title = meta.title || result.url;
    const summary = truncateText(result.plain_excerpt || result.excerpt || '');
    const dateLabel = formatDateLabel(meta.date, lang);
    const featuredClass = featured ? ' item--featured' : '';
    const cover = meta.image
        ? `<a href="${escapeHtml(result.url)}" class="item-cover" title="${escapeHtml(title)}">
                <img src="${escapeHtml(meta.image)}" alt="" loading="lazy" decoding="async">
           </a>`
        : '';

    return `<article class="item${featuredClass}">
        ${cover}
        <div class="item-body">
            ${dateLabel ? `<time class="item-date" datetime="${escapeHtml(meta.date || '')}">${escapeHtml(dateLabel)}</time>` : ''}
            <a href="${escapeHtml(result.url)}" class="item-title" title="${escapeHtml(title)}">
                <h2>${escapeHtml(title)}</h2>
            </a>
            <p class="item-description">${escapeHtml(summary)}</p>
            <a href="${escapeHtml(result.url)}" class="button-outline" title="${escapeHtml(title)}">${escapeHtml(readMore)}</a>
        </div>
    </article>`;
}

async function initPostsFilter() {
    const listNode = document.getElementById('posts-list');
    const featuredNode = document.getElementById('posts-featured');
    const paginationNode = document.getElementById('posts-pagination');
    const statusNode = document.getElementById('posts-status');
    const searchInput = document.getElementById('posts-search-input');
    const langButtons = document.querySelectorAll('.posts-lang-filter__btn');

    if (!listNode || !searchInput || !langButtons.length) {
        return;
    }

    let pagefindModule = null;
    let pagefindReady = false;
    let activeLang = 'all';
    let searchQuery = '';
    let requestId = 0;

    const initialListHtml = listNode.innerHTML;
    const initialFeaturedHtml = featuredNode ? featuredNode.innerHTML : '';
    const initialPaginationHtml = paginationNode ? paginationNode.innerHTML : '';

    async function getPagefind() {
        if (pagefindModule) {
            return pagefindModule;
        }

        try {
            pagefindModule = await import('/pagefind/pagefind.js');
            await pagefindModule.init();
            pagefindReady = true;
            return pagefindModule;
        } catch {
            pagefindReady = false;
            return null;
        }
    }

    function isFiltered() {
        return activeLang !== 'all' || searchQuery.length > 0;
    }

    function buildFilters() {
        const filters = { type: 'post' };

        if (activeLang !== 'all') {
            filters.language = activeLang;
        }

        return filters;
    }

    function updateStatus(message, visible = true) {
        if (!statusNode) {
            return;
        }

        statusNode.hidden = !visible;
        statusNode.textContent = message;
    }

    function restoreInitialView() {
        listNode.innerHTML = initialListHtml;

        if (featuredNode) {
            featuredNode.innerHTML = initialFeaturedHtml;
            featuredNode.hidden = initialFeaturedHtml.length === 0;
        }

        if (paginationNode) {
            paginationNode.innerHTML = initialPaginationHtml;
            paginationNode.hidden = false;
        }

        updateStatus('', false);
    }

    async function renderResults() {
        const currentRequest = ++requestId;

        if (!isFiltered()) {
            restoreInitialView();
            return;
        }

        if (featuredNode) {
            featuredNode.hidden = true;
        }

        const pagefind = await getPagefind();
        if (currentRequest !== requestId) {
            return;
        }

        if (!pagefind) {
            updateStatus('Search index unavailable. Run npm run build to generate Pagefind.');
            return;
        }

        updateStatus('Searching…');

        const filters = buildFilters();
        let search;

        if (searchQuery) {
            search = await pagefind.debouncedSearch(searchQuery, { filters }, 200);
            if (search === null) {
                return;
            }
        } else {
            search = await pagefind.search(null, { filters });
        }

        if (currentRequest !== requestId) {
            return;
        }

        const results = await Promise.all(search.results.map((result) => result.data()));

        if (currentRequest !== requestId) {
            return;
        }

        if (!searchQuery) {
            results.sort(comparePostsByDate);
        }

        if (!results.length) {
            listNode.innerHTML = '';
            if (paginationNode) {
                paginationNode.hidden = true;
            }
            updateStatus('No posts match your search.');
            return;
        }

        listNode.innerHTML = results.map((result, index) => renderSearchResult(result, index === 0)).join('');

        if (paginationNode) {
            paginationNode.hidden = true;
        }

        updateStatus(results.length === 1 ? '1 post found' : `${results.length} posts found`);
    }

    searchInput.addEventListener('focus', () => {
        getPagefind();
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();

        if (pagefindReady) {
            pagefindModule.preload(searchQuery, { filters: buildFilters() });
        }

        renderResults();
    });

    langButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeLang = button.dataset.lang || 'all';

            langButtons.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });

            renderResults();
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostsFilter);
} else {
    initPostsFilter();
}
