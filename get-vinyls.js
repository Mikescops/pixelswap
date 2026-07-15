require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');

const username = 'lokta';
const userAgent = 'PixelSwapBlog/1.0 +https://pixelswap.fr';
const perPage = 100;
const detailsDelayMs = 1100;
const vinylsPath = 'data/vinyls.json';
const wishlistPath = 'data/wishlist.json';

const skipDetails = process.argv.includes('--skip-details');
const forceDetails = process.argv.includes('--force-details');

const authHeaders = () => ({
    'User-Agent': userAgent,
    Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}`,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getReleaseId = (entry) => entry?.release_id || entry?.id || null;

const loadExistingRecords = (path) => {
    if (!fs.existsSync(path)) {
        return new Map();
    }

    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf8'));
        const map = new Map();

        for (const entry of data) {
            const releaseId = getReleaseId(entry);
            if (releaseId) {
                map.set(releaseId, entry);
            }
        }

        return map;
    } catch (error) {
        console.warn(`Could not read ${path}, starting fresh:`, error.message);
        return new Map();
    }
};

const hasCachedDetails = (cached) =>
    Boolean(
        cached &&
            ((Array.isArray(cached.tracklist) && cached.tracklist.length > 0) ||
                cached.notes ||
                cached.country ||
                cached.released),
    );

const discogsFetch = async (url) => {
    const response = await fetch(url, { headers: authHeaders() });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }

    return response.json();
};

const fetchAllPaginated = async (urlPath, resultKey) => {
    const items = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const url = `https://api.discogs.com${urlPath}?per_page=${perPage}&page=${page}`;
        const data = await discogsFetch(url);
        items.push(...(data[resultKey] || []));
        totalPages = data.pagination?.pages || 1;
        page += 1;
    }

    return items;
};

const fetchAllCollectionReleases = () =>
    fetchAllPaginated(`/users/${username}/collection/folders/0/releases`, 'releases');

const fetchAllWishlistReleases = () => fetchAllPaginated(`/users/${username}/wants`, 'wants');

const fetchImage = async (url, cachedImagePath) => {
    if (cachedImagePath) {
        const cachedFile = `assets/${cachedImagePath}`;
        if (fs.existsSync(cachedFile)) {
            return cachedImagePath;
        }
    }

    const imagePath = `vinyls-cover/${url.split('/').pop()}`;
    const imagePathInAssets = `assets/${imagePath}`;

    if (fs.existsSync(imagePathInAssets)) {
        return imagePath;
    }

    try {
        const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(imagePathInAssets, Buffer.from(buffer));

        return imagePath;
    } catch (error) {
        console.error('Error fetching image:', error);
        return cachedImagePath || null;
    }
};

const normalizeDiscogsUrl = (uri, releaseId) => {
    if (uri) {
        if (uri.startsWith('http')) {
            return uri;
        }
        if (uri.startsWith('/')) {
            return `https://www.discogs.com${uri}`;
        }
    }

    return releaseId ? `https://www.discogs.com/release/${releaseId}` : null;
};

const formatLabels = (labels = []) => labels.map((label) => label.name).filter(Boolean).join(', ');

const formatFormats = (formats = []) =>
    formats.flatMap((format) => {
        const parts = [];
        if (format.name) {
            parts.push(format.qty && format.qty !== '1' ? `${format.qty} x ${format.name}` : format.name);
        }
        if (format.descriptions?.length) {
            parts.push(...format.descriptions);
        }
        return parts;
    });

const formatTracklist = (tracklist = []) =>
    tracklist
        .filter((track) => track.title && track.position !== '')
        .map((track) => ({
            position: track.position,
            title: track.title,
            duration: track.duration || '',
        }));

const fetchReleaseDetails = async (releaseId, releaseCache) => {
    if (releaseCache.has(releaseId)) {
        return releaseCache.get(releaseId);
    }

    await sleep(detailsDelayMs);
    const release = await discogsFetch(`https://api.discogs.com/releases/${releaseId}`);
    const details = {
        tracklist: formatTracklist(release.tracklist),
        notes: release.notes || '',
        country: release.country || '',
        released: release.released || '',
    };
    releaseCache.set(releaseId, details);
    return details;
};

const needsDetailsFetch = (cached) => {
    if (skipDetails) {
        return false;
    }
    if (forceDetails) {
        return true;
    }
    return !hasCachedDetails(cached);
};

const buildRecord = async (entry, existingByReleaseId, releaseCache, stats, label) => {
    const info = entry.basic_information;
    const releaseId = info.id;
    const cached = existingByReleaseId.get(releaseId);
    const formats = formatFormats(info.formats);
    const imagePath = await fetchImage(info.cover_image, cached?.image);

    let details = {
        tracklist: cached?.tracklist || [],
        notes: cached?.notes || '',
        country: cached?.country || info.country || '',
        released: cached?.released || info.released || '',
    };

    if (needsDetailsFetch(cached)) {
        if (!cached) {
            stats.newRecords += 1;
        }

        try {
            console.log(`[${label}] Fetching release details: ${info.title}`);
            details = await fetchReleaseDetails(releaseId, releaseCache);
            stats.fetched += 1;
        } catch (error) {
            console.error(`Failed to fetch release ${releaseId}:`, error.message);
        }
    } else {
        stats.cached += 1;
        console.log(`[${label}] Using cached details: ${info.title}`);
    }

    const record = {
        release_id: releaseId,
        discogs_url: normalizeDiscogsUrl(info.uri, releaseId),
        title: info.title,
        artist: info.artists.map((artist) => artist.name).join(', '),
        label: formatLabels(info.labels),
        year: info.year || 0,
        country: details.country || info.country || '',
        released: details.released || info.released || '',
        formats,
        genres: info.genres || [],
        styles: info.styles || [],
        rating: entry.rating || 0,
        tracklist: details.tracklist,
        notes: details.notes,
        image: imagePath,
    };

    if (label === 'collection') {
        record.date_added = entry.date_added || '';
    }

    if (label === 'wishlist' && entry.notes) {
        record.wishlist_notes = entry.notes;
    }

    return record;
};

const transformRecords = async (entries, existingByReleaseId, releaseCache, label) => {
    const output = [];
    const stats = { cached: 0, fetched: 0, newRecords: 0 };

    for (const entry of entries) {
        output.push(await buildRecord(entry, existingByReleaseId, releaseCache, stats, label));
    }

    return { output, stats };
};

const main = async () => {
    if (!process.env.DISCOGS_TOKEN) {
        console.error('Missing DISCOGS_TOKEN in environment (.env)');
        process.exit(1);
    }

    const existingCollection = loadExistingRecords(vinylsPath);
    const existingWishlist = loadExistingRecords(wishlistPath);
    const releaseCache = new Map();

    console.log(`Loaded ${existingCollection.size} cached collection records from ${vinylsPath}`);
    console.log(`Loaded ${existingWishlist.size} cached wishlist records from ${wishlistPath}`);

    console.log(`Fetching collection for ${username}…`);
    const collectionEntries = await fetchAllCollectionReleases();
    console.log(`Found ${collectionEntries.length} records in collection.`);

    console.log(`Fetching wishlist for ${username}…`);
    const wishlistEntries = await fetchAllWishlistReleases();
    console.log(`Found ${wishlistEntries.length} records in wishlist.`);

    const collectionResult = await transformRecords(
        collectionEntries,
        existingCollection,
        releaseCache,
        'collection',
    );
    const wishlistResult = await transformRecords(
        wishlistEntries,
        existingWishlist,
        releaseCache,
        'wishlist',
    );

    fs.writeFileSync(vinylsPath, JSON.stringify(collectionResult.output, null, 4));
    fs.writeFileSync(wishlistPath, JSON.stringify(wishlistResult.output, null, 4));

    console.log(`Wrote ${collectionResult.output.length} records to ${vinylsPath}`);
    console.log(
        `Collection details: ${collectionResult.stats.cached} cached, ${collectionResult.stats.fetched} fetched${collectionResult.stats.newRecords ? `, ${collectionResult.stats.newRecords} new` : ''}`,
    );

    console.log(`Wrote ${wishlistResult.output.length} records to ${wishlistPath}`);
    console.log(
        `Wishlist details: ${wishlistResult.stats.cached} cached, ${wishlistResult.stats.fetched} fetched${wishlistResult.stats.newRecords ? `, ${wishlistResult.stats.newRecords} new` : ''}`,
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
