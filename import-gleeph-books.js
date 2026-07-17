require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const shelfId = 'WORK_TAG-0956A5FD6BD84964890DE878569F8BD6-all';
const browseUrl = `https://www.gleeph.com/api/shelves/browse/content/${shelfId}`;
const booksPath = 'data/books.json';
const wishlistPath = 'data/books-wishlist.json';
const coversDir = 'assets/books-cover';
const requestDelayMs = 400;
const forceCovers = process.argv.includes('--force-covers');

const coverStats = { reused: 0, downloaded: 0, failed: 0, missing: 0 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCookieMap = (cookieHeader) => {
    const map = new Map();
    for (const part of String(cookieHeader || '').split(';')) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }
        const eq = trimmed.indexOf('=');
        if (eq === -1) {
            continue;
        }
        map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
    }
    return map;
};

const extractCognitoIdToken = (cookieHeader) => {
    const cookies = parseCookieMap(cookieHeader);
    for (const [name, value] of cookies.entries()) {
        if (name.endsWith('.idToken') && value) {
            return value;
        }
    }
    return null;
};

const authHeaders = () => {
    const cookie = process.env.GLEEPH_COOKIE;
    const idToken = extractCognitoIdToken(cookie);
    const headers = {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        pragma: 'no-cache',
        'user-agent': userAgent,
        cookie,
        referer: `https://www.gleeph.com/shelf/${shelfId}`,
        origin: 'https://www.gleeph.com',
        'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
    };

    if (idToken) {
        headers.authorization = `Bearer ${idToken}`;
    }

    return headers;
};

const loadExistingByIsbn = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return new Map();
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const map = new Map();
        for (const entry of data) {
            const isbn = normalizeIsbn(entry?.isbn);
            if (isbn) {
                map.set(isbn, entry);
            }
        }
        return map;
    } catch (error) {
        console.warn(`Could not read ${filePath}, starting fresh:`, error.message);
        return new Map();
    }
};

const normalizeIsbn = (value) => {
    if (value == null) {
        return null;
    }
    const digits = String(value).replace(/[^\dXx]/g, '').toUpperCase();
    return digits || null;
};

const pickFirst = (...values) => {
    for (const value of values) {
        if (value == null) {
            continue;
        }
        if (typeof value === 'string' && value.trim() === '') {
            continue;
        }
        return value;
    }
    return null;
};

const asString = (value) => {
    if (value == null) {
        return '';
    }
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'object') {
        return pickFirst(value.name, value.title, value.label, value.value, value.text) || '';
    }
    return '';
};

const extractItems = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    // Gleeph browse API: { total, pageSize, hasMore, pageId, data: [...] }
    if (Array.isArray(payload.data)) {
        return payload.data;
    }

    const candidates = [
        payload.items,
        payload.content,
        payload.results,
        payload.works,
        payload.data?.items,
        payload.data?.content,
        payload.data?.results,
        payload.page?.items,
        payload.page?.content,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
};

const extractNextPageId = (payload, items) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if (payload.hasMore === false || payload.hasNext === false || payload.end === true) {
        return null;
    }

    const direct = pickFirst(
        payload.pageId,
        payload.nextPageId,
        payload.next,
        payload.cursor,
        payload.data?.pageId,
        payload.data?.nextPageId,
        payload.pagination?.pageId,
        payload.pagination?.nextPageId,
    );

    if (direct != null) {
        return direct;
    }

    // Fall back to last item's pageId-like fields if API embeds cursors on rows.
    const last = items[items.length - 1];
    if (last && typeof last === 'object') {
        return pickFirst(last.pageId, last.nextPageId, last.cursor) || null;
    }

    return null;
};

const extractIsbn = (item) => {
    const glcat = item.glcatObj && typeof item.glcatObj === 'object' ? item.glcatObj : {};
    const direct = pickFirst(
        item.ean,
        item.isbn,
        item.ISBN,
        item.EAN,
        item.ean13,
        item.workEan,
        glcat.ean,
        glcat.isbn,
        glcat.EAN,
        item.product?.ean,
        item.product?.isbn,
        item.work?.ean,
        item.work?.isbn,
        item.edition?.ean,
        item.edition?.isbn,
    );
    const fromDirect = normalizeIsbn(direct);
    if (fromDirect) {
        return fromDirect;
    }

    const url = asString(
        pickFirst(item.url, item.href, item.link, item.gleephUrl, item.work?.url, item.product?.url),
    );
    const match = url.match(/\/ean\/(\d{10,13})/i) || url.match(/(\d{13})/);
    if (match) {
        return normalizeIsbn(match[1]);
    }

    // Gleeph ids look like "9782205088168-0956A5FD6BD84964890DE878569F8BD6"
    const id = asString(pickFirst(item.id, item.workId, item.pageId));
    const idMatch = id.match(/^(\d{10,13})(?:-|_|$)/) || id.match(/(\d{13})/) || id.match(/(\d{10})/);
    return idMatch ? normalizeIsbn(idMatch[1]) : null;
};

const normalizeCoverUrl = (cover) => {
    if (!cover || typeof cover !== 'string') {
        return null;
    }

    const trimmed = cover.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    if (trimmed.includes('s.gleeph.net/') || trimmed.includes('amazonaws.com/')) {
        return trimmed.startsWith('/') ? `https:${trimmed}` : `https://${trimmed.replace(/^\/+/, '')}`;
    }
    if (trimmed.startsWith('/works/') || trimmed.startsWith('works/')) {
        const pathPart = trimmed.replace(/^\//, '');
        return `https://s3-eu-west-1.amazonaws.com/s.gleeph.net/${pathPart}`;
    }
    if (trimmed.startsWith('/')) {
        return `https://www.gleeph.com${trimmed}`;
    }
    // Bare content hash from Gleeph (optionally with size suffix like -300).
    if (/^[a-f0-9]{32,}(-\d+)?$/i.test(trimmed)) {
        const withSize = /-\d+$/.test(trimmed) ? trimmed : `${trimmed}-300`;
        return `https://s3-eu-west-1.amazonaws.com/s.gleeph.net/works/${withSize}`;
    }

    return null;
};

const extractCoverUrl = (item) => {
    const glcat = item.glcatObj && typeof item.glcatObj === 'object' ? item.glcatObj : {};
    const cover = pickFirst(
        item.image,
        item.cover,
        item.coverUrl,
        item.imageUrl,
        item.thumbnail,
        item.thumb,
        glcat.image,
        glcat.cover,
        item.work?.cover,
        item.work?.image,
        item.product?.cover,
        item.images?.cover,
        item.images?.medium,
        item.images?.large,
    );

    if (typeof cover === 'string') {
        return normalizeCoverUrl(cover);
    }
    if (cover && typeof cover === 'object') {
        const nested = pickFirst(cover.url, cover.src, cover.large, cover.medium, cover.small, cover['300'], cover.hash);
        if (typeof nested === 'string') {
            return normalizeCoverUrl(nested);
        }
    }
    return null;
};

const tagFlags = (item) => {
    const tags = item.tags;
    if (!tags || typeof tags !== 'object') {
        return {};
    }
    return tags;
};

const extractRead = (item) => {
    const tags = tagFlags(item);

    // Gleeph shelf tags: { own, wish, reading, read, like }
    if (typeof tags.read === 'boolean') {
        return tags.read;
    }

    if (
        item.read === true ||
        item.isRead === true ||
        item.hasRead === true ||
        tags.lu === true ||
        tags.finished === true
    ) {
        return true;
    }

    if (item.read === false || item.isRead === false) {
        return false;
    }

    return null;
};

const extractRating = (item) => {
    const raw = pickFirst(
        item.rating,
        item.userRating,
        item.note,
        item.score,
        item.stars,
        item.myRating,
        item.personalRating,
        item.user?.rating,
        item.review?.rating,
        tagFlags(item).rating,
    );

    if (raw == null || raw === '') {
        return null;
    }

    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) {
        return null;
    }

    // Gleeph sometimes uses 0–10; normalize to 0–5.
    const scaled = num > 5 ? num / 2 : num;
    return Math.max(0, Math.min(5, Math.round(scaled)));
};

const extractComment = (item) => {
    const tags = tagFlags(item);
    const value = pickFirst(
        item.comment,
        item.comments,
        item.noteText,
        item.personalNote,
        item.review,
        item.reviewText,
        item.avis,
        item.critique,
        item.userComment,
        item.wishlistNote,
        item.notes,
        tags.comment,
        tags.note,
        tags.avis,
        item.user?.comment,
        item.review?.text,
        item.review?.comment,
    );

    if (typeof value === 'string') {
        return value.trim();
    }
    if (value && typeof value === 'object') {
        return asString(pickFirst(value.text, value.comment, value.content, value.body));
    }
    return '';
};

const formatPublishingDate = (value) => {
    if (value == null || value === '') {
        return { published: '', year: 0 };
    }

    if (typeof value === 'number') {
        // Unix ms / s, or YYYYMMDD-style ints.
        if (value > 1e12) {
            const date = new Date(value);
            return {
                published: date.toISOString().slice(0, 10),
                year: date.getUTCFullYear(),
            };
        }
        if (value > 1e9) {
            const date = new Date(value * 1000);
            return {
                published: date.toISOString().slice(0, 10),
                year: date.getUTCFullYear(),
            };
        }
        const asStr = String(Math.trunc(value));
        if (/^\d{8}$/.test(asStr)) {
            return {
                published: `${asStr.slice(0, 4)}-${asStr.slice(4, 6)}-${asStr.slice(6, 8)}`,
                year: Number(asStr.slice(0, 4)),
            };
        }
        if (/^\d{4}$/.test(asStr)) {
            return { published: asStr, year: Number(asStr) };
        }
    }

    const published = asString(value);
    const yearMatch = published.match(/(19|20)\d{2}/);
    return { published, year: yearMatch ? Number(yearMatch[0]) : 0 };
};

const parsePublished = (item) => {
    const fromGleeph = formatPublishingDate(
        pickFirst(item.publishing_date, item.published, item.publishDate, item.publicationDate),
    );
    if (fromGleeph.published || fromGleeph.year) {
        return fromGleeph;
    }

    const published = asString(
        pickFirst(
            item.released,
            item.releaseDate,
            item.work?.published,
            item.edition?.published,
            item.glcatObj?.publishing_date,
        ),
    );

    const yearRaw = pickFirst(item.year, item.copyrightYear, item.publicationYear, item.work?.year);
    let year = Number(yearRaw) || 0;

    if (!year && published) {
        const yearMatch = published.match(/(19|20)\d{2}/);
        if (yearMatch) {
            year = Number(yearMatch[0]);
        }
    }

    return { published, year };
};

const formatAuthors = (item) => {
    if (Array.isArray(item.authors)) {
        return item.authors.map(asString).filter(Boolean).join(', ');
    }
    return asString(pickFirst(item.author, item.writer, item.work?.author, item.work?.authors, item.product?.author));
};

const buildGleephUrl = (item, isbn) => {
    const url = asString(
        pickFirst(item.url, item.href, item.link, item.gleephUrl, item.work?.url, item.product?.url),
    );
    if (url) {
        if (url.startsWith('http')) {
            return url;
        }
        if (url.startsWith('/')) {
            return `https://www.gleeph.com${url}`;
        }
    }
    return isbn ? `https://www.gleeph.com/book/ean/${isbn}` : null;
};

const ensureCoversDir = () => {
    if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
    }
};

const guessExtension = (url, contentType) => {
    try {
        const fromUrl = path.extname(new URL(url, 'https://www.gleeph.com').pathname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromUrl)) {
            return fromUrl === '.jpeg' ? '.jpg' : fromUrl;
        }
    } catch {
        // ignore invalid URL paths (Gleeph hashes have no extension)
    }
    if (contentType?.includes('png')) {
        return '.png';
    }
    if (contentType?.includes('webp')) {
        return '.webp';
    }
    return '.jpg';
};

const findExistingCover = (isbn, cachedImagePath) => {
    if (cachedImagePath) {
        const cachedFile = `assets/${cachedImagePath}`;
        if (fs.existsSync(cachedFile)) {
            return cachedImagePath;
        }
    }

    if (!isbn) {
        return null;
    }

    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
        const candidate = `books-cover/${isbn}${ext}`;
        if (fs.existsSync(`assets/${candidate}`)) {
            return candidate;
        }
    }

    return null;
};

const fetchCover = async (coverUrl, isbn, cachedImagePath) => {
    const existing = findExistingCover(isbn, cachedImagePath);
    if (existing && !forceCovers) {
        coverStats.reused += 1;
        return existing;
    }

    if (!coverUrl || !isbn) {
        coverStats.missing += 1;
        return existing || cachedImagePath || null;
    }

    ensureCoversDir();

    try {
        const response = await fetch(coverUrl, {
            headers: { 'User-Agent': userAgent, Accept: 'image/*' },
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const ext = guessExtension(coverUrl, contentType);
        const imagePath = `books-cover/${isbn}${ext}`;
        const absolutePath = `assets/${imagePath}`;

        // Never overwrite a local cover unless explicitly forced.
        if (fs.existsSync(absolutePath) && !forceCovers) {
            coverStats.reused += 1;
            return imagePath;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 2000) {
            throw new Error(`cover too small (${buffer.length} bytes)`);
        }

        fs.writeFileSync(absolutePath, buffer);
        coverStats.downloaded += 1;
        return imagePath;
    } catch (error) {
        coverStats.failed += 1;
        console.error(`Cover failed for ${isbn} (${coverUrl}):`, error.message);
        return existing || cachedImagePath || null;
    }
};

const mapItem = async (item, existingByIsbn, label) => {
    const isbn = extractIsbn(item);
    if (!isbn) {
        console.warn(`[${label}] Skipping item without ISBN:`, JSON.stringify(item).slice(0, 200));
        return null;
    }

    const cached = existingByIsbn.get(isbn);
    const { published, year } = parsePublished(item);
    const gleephRead = extractRead(item);
    const gleephRating = extractRating(item);
    const gleephComment = extractComment(item);
    const coverUrl = extractCoverUrl(item);
    const image = await fetchCover(coverUrl, isbn, cached?.image);

    const glcat = item.glcatObj && typeof item.glcatObj === 'object' ? item.glcatObj : {};
    const title = asString(
        pickFirst(item.title, item.name, item.workTitle, glcat.title, item.work?.title, item.product?.title, cached?.title),
    );
    const author = formatAuthors(item) || asString(glcat.authors) || cached?.author || '';

    // Merge: prefer Gleeph values when present; otherwise keep local edits.
    const read = gleephRead != null ? gleephRead : Boolean(cached?.read);
    const rating = gleephRating != null ? gleephRating : Number(cached?.rating) || 0;
    const comment =
        gleephComment !== ''
            ? gleephComment
            : typeof cached?.comment === 'string'
              ? cached.comment
              : '';

    const slugAuthor = author
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const slugTitle = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const gleephUrl =
        buildGleephUrl(item, isbn) ||
        (slugAuthor && slugTitle
            ? `https://www.gleeph.com/book/${slugAuthor}-${slugTitle}/ean/${isbn}`
            : `https://www.gleeph.com/book/ean/${isbn}`);

    return {
        isbn,
        title: title || cached?.title || isbn,
        author: author || cached?.author || '',
        publisher: asString(
            pickFirst(
                item.edition,
                item.publisher,
                item.editeur,
                glcat.publisher,
                glcat.edition,
                item.work?.publisher,
                item.edition?.publisher,
                cached?.publisher,
            ),
        ),
        published: published || cached?.published || '',
        year: year || cached?.year || 0,
        format: asString(pickFirst(item.format, item.bookFormat, item.binding, glcat.format, item.work?.format, cached?.format)),
        genre: asString(
            pickFirst(
                item.genre,
                item.category,
                item.categories,
                glcat.labelFr,
                glcat.name,
                glcat.genre,
                glcat.category,
                Array.isArray(item.genres) ? item.genres.map(asString).filter(Boolean).join(', ') : null,
                item.work?.genre,
                cached?.genre,
            ),
        ),
        pages: Number(pickFirst(item.pages, item.numberOfPages, item.pageCount, glcat.pages, cached?.pages)) || null,
        read: label === 'wishlist' ? false : read,
        rating,
        comment,
        gleeph_url: gleephUrl,
        image,
        date_added: cached?.date_added || (item.createdOn ? new Date(item.createdOn).toISOString() : null),
    };
};

const browseShelf = async (filters) => {
    const items = [];
    let pageId = null;
    let page = 0;
    const seenPageIds = new Set();

    while (true) {
        page += 1;
        const body = {
            searcher: '',
            filters,
            pageId,
        };

        const response = await fetch(browseUrl, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });

        if (response.status === 401 || response.status === 403) {
            const body = (await response.text()).replace(/\s+/g, ' ').slice(0, 240);
            throw new Error(
                `Gleeph auth failed (${response.status}). Copy the Cookie header from the browse API request in DevTools (Network → the POST to /api/shelves/browse/...), not from Application → Cookies. Response: ${body}`,
            );
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Gleeph browse failed: ${response.status} ${response.statusText} — ${text.slice(0, 300)}`);
        }

        const payload = await response.json();
        const pageItems = extractItems(payload);

        if (page === 1) {
            console.log(`First page keys: ${Object.keys(payload || {}).join(', ') || '(array)'}`);
            console.log(
                `total=${payload.total ?? '?'} pageSize=${payload.pageSize ?? '?'} hasMore=${payload.hasMore}`,
            );
            console.log(`First page item count: ${pageItems.length}`);
            if (pageItems[0]) {
                console.log(`Sample item keys: ${Object.keys(pageItems[0]).join(', ')}`);
                console.log(`Sample image: ${JSON.stringify(pageItems[0].image)}`);
                console.log(`Sample tags: ${JSON.stringify(pageItems[0].tags)}`);
                if (pageItems[0].glcatObj && typeof pageItems[0].glcatObj === 'object') {
                    console.log(`Sample glcatObj: ${JSON.stringify(pageItems[0].glcatObj)}`);
                }
            }
        }

        if (pageItems.length === 0) {
            break;
        }

        items.push(...pageItems);

        const nextPageId = extractNextPageId(payload, pageItems);
        if (nextPageId == null) {
            break;
        }

        const pageIdKey = JSON.stringify(nextPageId);
        if (seenPageIds.has(pageIdKey) || pageIdKey === JSON.stringify(pageId)) {
            break;
        }

        seenPageIds.add(pageIdKey);
        pageId = nextPageId;

        console.log(`Fetched page ${page} (${items.length} items so far)…`);
        await sleep(requestDelayMs);
    }

    return items;
};

const transform = async (rawItems, existingByIsbn, label) => {
    const output = [];
    const seen = new Set();

    for (const item of rawItems) {
        const record = await mapItem(item, existingByIsbn, label);
        if (!record || seen.has(record.isbn)) {
            continue;
        }
        seen.add(record.isbn);
        output.push(record);
        console.log(`[${label}] ${record.title} (${record.isbn})`);
    }

    return output;
};

const main = async () => {
    if (!process.env.GLEEPH_COOKIE) {
        console.error('Missing GLEEPH_COOKIE in environment (.env).');
        console.error('Copy the Cookie header from a logged-in request to the Gleeph browse API.');
        process.exit(1);
    }

    ensureCoversDir();
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data', { recursive: true });
    }

    const existingCollection = loadExistingByIsbn(booksPath);
    const existingWishlist = loadExistingByIsbn(wishlistPath);

    console.log(`Loaded ${existingCollection.size} cached collection books from ${booksPath}`);
    console.log(`Loaded ${existingWishlist.size} cached wishlist books from ${wishlistPath}`);

    console.log('Fetching shelf from Gleeph…');
    const allRaw = await browseShelf({});
    console.log(`Found ${allRaw.length} shelf items.`);

    console.log('Fetching wishlist filter from Gleeph…');
    const wishRaw = await browseShelf({ wish: true });
    console.log(`Found ${wishRaw.length} wish-tagged items.`);

    // Gleeph tags: own / wish / reading / read / like
    const isOwned = (item) => tagFlags(item).own === true;
    const isWishOnly = (item) => tagFlags(item).wish === true && tagFlags(item).own !== true;

    const collectionRaw = allRaw.filter(isOwned);
    const wishlistCandidates = [...allRaw.filter(isWishOnly), ...wishRaw.filter(isWishOnly)];
    const wishlistRaw = [];
    const seenWish = new Set();
    for (const item of wishlistCandidates) {
        const isbn = extractIsbn(item);
        if (!isbn || seenWish.has(isbn)) {
            continue;
        }
        seenWish.add(isbn);
        wishlistRaw.push(item);
    }

    console.log(`Owned: ${collectionRaw.length}. Wishlist-only: ${wishlistRaw.length}.`);

    const collection = await transform(collectionRaw, existingCollection, 'collection');
    const wishlist = await transform(wishlistRaw, existingWishlist, 'wishlist');

    fs.writeFileSync(booksPath, JSON.stringify(collection, null, 4) + '\n');
    fs.writeFileSync(wishlistPath, JSON.stringify(wishlist, null, 4) + '\n');

    console.log(`Wrote ${collection.length} books to ${booksPath}`);
    console.log(`Wrote ${wishlist.length} books to ${wishlistPath}`);
    console.log(
        `Covers: ${coverStats.reused} reused, ${coverStats.downloaded} downloaded, ${coverStats.failed} failed, ${coverStats.missing} missing` +
            (forceCovers ? ' (--force-covers)' : ''),
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
