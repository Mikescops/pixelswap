/**
 * Renders fenced ```d2 blocks (base64-encoded in data-d2) using @terrastruct/d2 (WASM).
 */
import { D2 } from 'https://cdn.jsdelivr.net/npm/@terrastruct/d2@0.1.33/dist/browser/index.js';

function decodeBase64Utf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
        bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

function ensureModal() {
    let modal = document.getElementById('d2-modal');
    if (modal) {
        return modal;
    }

    modal = document.createElement('div');
    modal.id = 'd2-modal';
    modal.className = 'd2-modal';
    modal.setAttribute('hidden', '');
    modal.innerHTML = `
        <div class="d2-modal-backdrop" data-close="true"></div>
        <div class="d2-modal-content" role="dialog" aria-modal="true" aria-label="Schema agrandi">
            <button type="button" class="d2-modal-close" aria-label="Fermer">×</button>
            <div class="d2-modal-viewer"></div>
        </div>
    `;

    // Mount under .app so darkMode() CSS vars (--current-light-theme / --current-dark-theme) apply.
    const appRoot = document.querySelector('.app');
    (appRoot || document.body).appendChild(modal);

    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (target && target.dataset && target.dataset.close === 'true') {
            closeModal(modal);
        }
    });

    const closeBtn = modal.querySelector('.d2-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
            closeModal(modal);
        }
    });

    return modal;
}

function normalizeSvgInModal(viewer) {
    const svg = viewer.querySelector('svg');
    if (!svg) {
        return;
    }
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
}

function openModal(svgMarkup) {
    const modal = ensureModal();
    const viewer = modal.querySelector('.d2-modal-viewer');
    if (!viewer) {
        return;
    }

    viewer.innerHTML = svgMarkup;
    normalizeSvgInModal(viewer);
    modal.removeAttribute('hidden');
    document.body.classList.add('d2-modal-open');
}

function closeModal(modal) {
    const viewer = modal.querySelector('.d2-modal-viewer');
    if (viewer) {
        viewer.innerHTML = '';
    }
    modal.setAttribute('hidden', '');
    document.body.classList.remove('d2-modal-open');
}

async function renderAll() {
    const nodes = document.querySelectorAll('.d2-diagram[data-d2]');
    if (!nodes.length) {
        return;
    }

    const d2 = new D2();
    let salt = 0;

    for (const el of nodes) {
        const out = el.querySelector('.d2-output');
        const errEl = el.querySelector('.d2-error');
        if (!out) {
            continue;
        }

        try {
            const src = decodeBase64Utf8(el.getAttribute('data-d2') || '');
            const result = await d2.compile(src, {
                pad: 20,
                sketch: false,
                layout: 'dagre',
            });

            const renderOpts = {
                ...result.renderOptions,
                noXMLTag: true,
                salt: `d2-${salt}`,
                center: true,
            };

            const svg = await d2.render(result.diagram, renderOpts);
            out.innerHTML = svg;
            out.classList.add('is-clickable');
            out.setAttribute('title', 'Cliquer pour agrandir');
            out.onclick = () => openModal(svg);
            out.removeAttribute('aria-busy');
            if (errEl) {
                errEl.hidden = true;
                errEl.textContent = '';
            }
        } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            if (errEl) {
                errEl.hidden = false;
                errEl.textContent = `Erreur de rendu: ${msg}`;
            }
            out.removeAttribute('aria-busy');
        }

        salt += 1;
    }
}

renderAll();
