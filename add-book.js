require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

const userAgent = 'PixelSwapBlog/1.0 +https://pixelswap.fr';
const booksPath = 'data/books.json';
const wishlistPath = 'data/books-wishlist.json';
const coversDir = 'assets/books-cover';

const normalizeIsbn = (value) => {
    if (value == null) {
        return null;
    }
    const digits = String(value).replace(/[^\dXx]/g, '').toUpperCase();
    return digits || null;
};

const parseArgs = (argv) => {
    const args = {
        isbn: null,
        wishlist: false,
        read: null,
        rating: null,
        comment: null,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--wishlist') {
            args.wishlist = true;
            continue;
        }
        if (arg === '--read') {
            args.read = true;
            continue;
        }
        if (arg === '--unread') {
            args.read = false;
            continue;
        }
        if (arg === '--rating') {
            const value = Number(argv[i + 1]);
            if (!Number.isFinite(value) || value < 0 || value > 5) {
                throw new Error('--rating must be a number between 0 and 5');
            }
            args.rating = Math.round(value);
            i += 1;
            continue;
        }
        if (arg.startsWith('--rating=')) {
            const value = Number(arg.slice('--rating='.length));
            if (!Number.isFinite(value) || value < 0 || value > 5) {
                throw new Error('--rating must be a number between 0 and 5');
            }
            args.rating = Math.round(value);
            continue;
        }
        if (arg === '--comment') {
            args.comment = argv[i + 1] ?? '';
            i += 1;
            continue;
        }
        if (arg.startsWith('--comment=')) {
            args.comment = arg.slice('--comment='.length);
            continue;
        }
        if (arg.startsWith('-')) {
            throw new Error(`Unknown flag: ${arg}`);
        }
        if (!args.isbn) {
            args.isbn = normalizeIsbn(arg);
        }
    }

    if (!args.isbn) {
        throw new Error(
            'Usage: npm run add-book -- <isbn> [--wishlist] [--read|--unread] [--rating N] [--comment "..."]',
        );
    }

    return args;
};

const loadBooks = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        throw new Error(`Could not parse ${filePath}: ${error.message}`);
    }
};

const saveBooks = (filePath, books) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(books, null, 4) + '\n');
};

const ensureCoversDir = () => {
    if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
    }
};

const findExistingCover = (isbn) => {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
        const imagePath = `books-cover/${isbn}${ext}`;
        if (fs.existsSync(`assets/${imagePath}`)) {
            return imagePath;
        }
    }
    return null;
};

const downloadCover = async (url, isbn) => {
    if (!url) {
        return null;
    }

    ensureCoversDir();
    const existing = findExistingCover(isbn);
    if (existing) {
        return existing;
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': userAgent, Accept: 'image/*' },
            redirect: 'follow',
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        // Open Library returns a tiny placeholder for missing covers; skip those.
        if (buffer.length < 2000) {
            console.warn(`Cover too small (${buffer.length} bytes), treating as missing.`);
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
        const imagePath = `books-cover/${isbn}${ext}`;
        fs.writeFileSync(`assets/${imagePath}`, buffer);
        return imagePath;
    } catch (error) {
        console.warn(`Cover download failed: ${error.message}`);
        return null;
    }
};

const fetchOpenLibrary = async (isbn) => {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
    const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (!response.ok) {
        throw new Error(`Open Library ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const book = data[`ISBN:${isbn}`];
    if (!book) {
        return null;
    }

    const authors = (book.authors || []).map((author) => author.name).filter(Boolean).join(', ');
    const publishers = (book.publishers || []).map((publisher) => publisher.name).filter(Boolean).join(', ');
    const subjects = (book.subjects || [])
        .map((subject) => (typeof subject === 'string' ? subject : subject.name))
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');

    let year = 0;
    if (book.publish_date) {
        const match = String(book.publish_date).match(/(19|20)\d{2}/);
        if (match) {
            year = Number(match[0]);
        }
    }

    const coverUrl =
        book.cover?.large ||
        book.cover?.medium ||
        book.cover?.small ||
        `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

    return {
        title: book.title || isbn,
        author: authors,
        publisher: publishers,
        published: book.publish_date || '',
        year,
        format: '',
        genre: subjects,
        pages: book.number_of_pages || null,
        coverUrl,
        openlibrary_url: book.url || `https://openlibrary.org/isbn/${isbn}`,
    };
};

const fetchGoogleBooks = async (isbn) => {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    const url = key
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${key}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

    const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (response.status === 429) {
        console.warn('Google Books rate-limited (429), skipping.');
        return null;
    }
    if (!response.ok) {
        throw new Error(`Google Books ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const volume = data.items?.[0]?.volumeInfo;
    if (!volume) {
        return null;
    }

    let year = 0;
    if (volume.publishedDate) {
        const match = String(volume.publishedDate).match(/(19|20)\d{2}/);
        if (match) {
            year = Number(match[0]);
        }
    }

    return {
        title: volume.title || isbn,
        author: (volume.authors || []).join(', '),
        publisher: volume.publisher || '',
        published: volume.publishedDate || '',
        year,
        format: volume.printType === 'BOOK' ? volume.printType : '',
        genre: (volume.categories || []).slice(0, 3).join(', '),
        pages: volume.pageCount || null,
        coverUrl: volume.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        google_url: volume.infoLink || null,
        source: 'google',
    };
};

const normalizeGleephCover = (image) => {
    if (!image || typeof image !== 'string') {
        return null;
    }
    const trimmed = image.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    if (/^[a-f0-9]{32,}(-\d+)?$/i.test(trimmed)) {
        const withSize = /-\d+$/.test(trimmed) ? trimmed : `${trimmed}-300`;
        return `https://s3-eu-west-1.amazonaws.com/s.gleeph.net/works/${withSize}`;
    }
    return null;
};

const jpegDimensions = (buffer) => {
    if (!buffer || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return null;
    }

    let offset = 2;
    while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = buffer[offset + 1];
        if (marker === 0xd9 || marker === 0xda) {
            break;
        }

        // SOF0 / SOF2 hold width & height.
        if (marker === 0xc0 || marker === 0xc2) {
            return {
                height: buffer.readUInt16BE(offset + 5),
                width: buffer.readUInt16BE(offset + 7),
            };
        }

        const segmentLength = buffer.readUInt16BE(offset + 2);
        if (segmentLength < 2) {
            break;
        }
        offset += 2 + segmentLength;
    }

    return null;
};

// Flat front covers are ~2:3. Gleeph 3D product mockups are wider (spine visible).
const coverAspectScore = (width, height) => {
    if (!width || !height) {
        return Number.POSITIVE_INFINITY;
    }
    return Math.abs(width / height - 2 / 3);
};

const fetchCoverBuffer = async (url) => {
    const response = await fetch(url, {
        headers: { 'User-Agent': userAgent, Accept: 'image/*' },
        redirect: 'follow',
    });
    if (!response.ok) {
        return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 2000) {
        return null;
    }
    return buffer;
};

const pickBestCoverUrl = async (candidates) => {
    const unique = [...new Set(candidates.filter(Boolean))];
    let best = null;

    for (const url of unique) {
        try {
            const buffer = await fetchCoverBuffer(url);
            if (!buffer) {
                continue;
            }
            const dims = jpegDimensions(buffer);
            const score = dims ? coverAspectScore(dims.width, dims.height) : 1;
            if (!best || score < best.score) {
                best = { url, buffer, score, dims };
            }
        } catch {
            // try next candidate
        }
    }

    return best;
};

const extractGleephLdBook = (html) => {
    const match = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (!match) {
        return null;
    }

    try {
        const data = JSON.parse(match[1]);
        const book = Array.isArray(data) ? data.find((entry) => entry['@type'] === 'Book') : data;
        if (!book || book['@type'] !== 'Book') {
            return null;
        }
        return book;
    } catch {
        return null;
    }
};

const fetchGleephByIsbn = async (isbn) => {
    const browserUa =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
    const url = `https://www.gleeph.com/book/ean/${isbn}`;
    const headers = {
        'User-Agent': browserUa,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    };
    if (process.env.GLEEPH_COOKIE) {
        headers.cookie = process.env.GLEEPH_COOKIE;
    }

    const response = await fetch(url, { headers, redirect: 'follow' });
    if (!response.ok) {
        throw new Error(`Gleeph ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const book = extractGleephLdBook(html);
    if (!book) {
        return null;
    }

    const author =
        typeof book.author === 'string'
            ? book.author
            : Array.isArray(book.author)
              ? book.author
                    .map((entry) => (typeof entry === 'string' ? entry : entry.name))
                    .filter(Boolean)
                    .join(', ')
              : book.author?.name || '';

    const publisher =
        typeof book.publisher === 'string' ? book.publisher : book.publisher?.name || '';

    const year = Number(book.copyrightYear) || 0;
    const coverCandidates = [normalizeGleephCover(book.image)];

    // Related editions on the page often have a flat front cover when the
    // primary JSON-LD image is a 3D product mockup.
    const relatedIsbns = [
        ...new Set(
            [...html.matchAll(/\/ean\/(\d{10,13})/gi)]
                .map((match) => normalizeIsbn(match[1]))
                .filter((value) => value && value !== isbn),
        ),
    ].slice(0, 5);

    for (const relatedIsbn of relatedIsbns) {
        try {
            const relatedResponse = await fetch(`https://www.gleeph.com/book/ean/${relatedIsbn}`, {
                headers,
                redirect: 'follow',
            });
            if (!relatedResponse.ok) {
                continue;
            }
            const relatedBook = extractGleephLdBook(await relatedResponse.text());
            const relatedCover = normalizeGleephCover(relatedBook?.image);
            if (relatedCover) {
                coverCandidates.push(relatedCover);
            }
        } catch {
            // ignore related edition failures
        }
    }

    const bestCover = await pickBestCoverUrl(coverCandidates);
    if (bestCover && bestCover.url !== coverCandidates[0]) {
        console.log('Picked a flatter related-edition cover from Gleeph.');
    }

    return {
        title: book.name || isbn,
        author,
        publisher,
        published: book.copyrightYear ? String(book.copyrightYear) : '',
        year,
        format: book.bookFormat || '',
        genre: book.genre || '',
        pages: book.numberOfPages || null,
        coverUrl: bestCover?.url || coverCandidates[0] || null,
        coverBuffer: bestCover?.buffer || null,
        gleeph_url: url,
        source: 'gleeph',
    };
};

const lookupBookMeta = async (isbn) => {
    console.log('Trying Open Library…');
    let meta = await fetchOpenLibrary(isbn);
    if (meta) {
        meta.source = 'openlibrary';
        return meta;
    }

    console.log('Trying Gleeph…');
    try {
        meta = await fetchGleephByIsbn(isbn);
        if (meta) {
            return meta;
        }
    } catch (error) {
        console.warn(`Gleeph lookup failed: ${error.message}`);
    }

    console.log('Trying Google Books…');
    try {
        meta = await fetchGoogleBooks(isbn);
        if (meta) {
            return meta;
        }
    } catch (error) {
        console.warn(`Google Books lookup failed: ${error.message}`);
    }

    return null;
};

const applyPersonalFields = (book, args) => {
    if (args.read != null) {
        book.read = args.wishlist ? false : args.read;
    }
    if (args.rating != null) {
        book.rating = args.rating;
    }
    if (args.comment != null) {
        book.comment = args.comment;
    }
    return book;
};

const main = async () => {
    const args = parseArgs(process.argv.slice(2));
    const targetPath = args.wishlist ? wishlistPath : booksPath;
    const books = loadBooks(targetPath);
    const existingIndex = books.findIndex((book) => normalizeIsbn(book.isbn) === args.isbn);

    if (existingIndex >= 0) {
        const updated = applyPersonalFields({ ...books[existingIndex] }, args);
        books[existingIndex] = updated;
        saveBooks(targetPath, books);
        console.log(`Updated ${updated.title} (${updated.isbn}) in ${targetPath}`);
        console.log(
            `read=${updated.read} rating=${updated.rating} comment=${updated.comment ? JSON.stringify(updated.comment) : '""'}`,
        );
        return;
    }

    // Also block duplicates across the other list.
    const otherPath = args.wishlist ? booksPath : wishlistPath;
    const otherBooks = loadBooks(otherPath);
    if (otherBooks.some((book) => normalizeIsbn(book.isbn) === args.isbn)) {
        throw new Error(`ISBN ${args.isbn} already exists in ${otherPath}. Move it manually or update that file.`);
    }

    console.log(`Looking up ISBN ${args.isbn}…`);
    const meta = await lookupBookMeta(args.isbn);

    if (!meta) {
        throw new Error(
            `No metadata found for ISBN ${args.isbn}. Tried Open Library, Gleeph, and Google Books.`,
        );
    }

    console.log(`Found via ${meta.source}: ${meta.title}`);

    let image = findExistingCover(args.isbn);
    if (!image && meta.coverBuffer) {
        ensureCoversDir();
        image = `books-cover/${args.isbn}.jpg`;
        fs.writeFileSync(`assets/${image}`, meta.coverBuffer);
    }
    if (!image) {
        image = await downloadCover(meta.coverUrl, args.isbn);
    }
    if (!image) {
        image = await downloadCover(`https://covers.openlibrary.org/b/isbn/${args.isbn}-L.jpg`, args.isbn);
    }

    const book = applyPersonalFields(
        {
            isbn: args.isbn,
            title: meta.title,
            author: meta.author || '',
            publisher: meta.publisher || '',
            published: meta.published || '',
            year: meta.year || 0,
            format: meta.format || '',
            genre: meta.genre || '',
            pages: meta.pages || null,
            read: false,
            rating: 0,
            comment: '',
            gleeph_url: meta.gleeph_url || null,
            image,
            date_added: new Date().toISOString(),
        },
        args,
    );

    if (args.wishlist) {
        book.read = false;
    }

    books.push(book);
    saveBooks(targetPath, books);

    console.log(`Added ${book.title} (${book.isbn}) to ${targetPath}`);
    console.log(`Cover: ${book.image || '(none)'}`);
};

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
