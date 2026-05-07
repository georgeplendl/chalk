import { normalizeUrl } from '../../lib/url';
import { getOrCreateSessionToken } from '../../lib/session';
import { fetchAnnotations, saveAnnotation, type AnnotationRow } from '../../lib/annotations';

type FabricModule = typeof import('fabric');

const COLORS = ['#1a1a1a', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#f5f5f5'];
const SIZES = [2, 4, 8] as const;

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    let isActive = false;
    let fab: FabricModule | null = null;
    let canvas: InstanceType<FabricModule['Canvas']> | null = null;
    let containerEl: HTMLElement | null = null;
    let toolbarHostEl: HTMLElement | null = null;
    let loadedRows: AnnotationRow[] = [];
    let annotationCount = 0;
    let isEditingText = false;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let currentColor = COLORS[0];
    let currentSize: number = 4;
    let currentTool: 'draw' | 'text' = 'draw';

    // --- Message handler ---

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'GET_STATE') {
        sendResponse({ active: isActive, count: annotationCount });
      } else if (msg.type === 'TOGGLE_OVERLAY') {
        if (isActive) {
          deactivate();
        } else {
          activate().catch(console.error);
        }
        setTimeout(() => sendResponse({ active: isActive, count: annotationCount }), 50);
      }
      return true;
    });

    // --- Lifecycle ---

    async function activate() {
      isActive = true;
      if (!fab) fab = await import('fabric');
      if (!containerEl) {
        createCanvas();
        createToolbar();
        await loadAnnotations();
      }
      setOverlayVisible(true);
    }

    function deactivate() {
      isActive = false;
      setOverlayVisible(false);
    }

    function setOverlayVisible(visible: boolean) {
      if (containerEl) {
        containerEl.style.display = visible ? 'block' : 'none';
        containerEl.style.pointerEvents = visible ? 'all' : 'none';
      }
      if (toolbarHostEl) toolbarHostEl.style.display = visible ? 'block' : 'none';
    }

    // --- Annotation data helpers ---

    // Wraps Fabric.js JSON with the canvas dimensions it was drawn at,
    // so we can scale correctly when the viewport differs on load.
    function wrapWithDimensions(fabricJson: Record<string, unknown>): Record<string, unknown> {
      return {
        fabricData: fabricJson,
        canvasWidth: canvas?.width ?? window.innerWidth,
        canvasHeight: canvas?.height ?? window.innerHeight,
      };
    }

    function parseAnnotationData(data: Record<string, unknown>) {
      if ('fabricData' in data) {
        return {
          fabricData: data.fabricData as Record<string, unknown>,
          storedW: data.canvasWidth as number | null,
          storedH: data.canvasHeight as number | null,
        };
      }
      // Legacy format: no dimensions stored, render as-is
      return { fabricData: data, storedW: null, storedH: null };
    }

    // Scales Fabric.js serialized object proportionally to the current canvas size.
    function scaleFabricData(
      data: Record<string, unknown>,
      ratioX: number,
      ratioY: number,
    ): Record<string, unknown> {
      const d = { ...data };
      if (typeof d.left === 'number')     d.left     = d.left     * ratioX;
      if (typeof d.top === 'number')      d.top      = d.top      * ratioY;
      // Scale shape uniformly by ratioX to preserve aspect ratio.
      // ratioY differs from ratioX when height changes independently of width,
      // which would skew shapes (a square becomes a tall rectangle, etc.).
      if (typeof d.scaleX === 'number')   d.scaleX   = d.scaleX   * ratioX;
      if (typeof d.scaleY === 'number')   d.scaleY   = d.scaleY   * ratioX;
      if (typeof d.fontSize === 'number') d.fontSize = d.fontSize * ratioX;
      return d;
    }

    // --- Canvas ---

    function getPageDimensions() {
      return {
        w: window.innerWidth,
        h: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          window.innerHeight,
        ),
      };
    }

    function createCanvas() {
      if (!fab) return;
      const { w, h } = getPageDimensions();

      containerEl = document.createElement('div');
      Object.assign(containerEl.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${w}px`,
        height: `${h}px`,
        pointerEvents: 'none',
        zIndex: '2147483646',
        overflow: 'hidden',
      });
      document.body.appendChild(containerEl);

      const canvasEl = document.createElement('canvas');
      canvasEl.width = w;
      canvasEl.height = h;
      containerEl.appendChild(canvasEl);

      canvas = new fab.Canvas(canvasEl, { selection: false, enableRetinaScaling: false });
      applyBrush();

      // Forward wheel events so page scrolling still works
      canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        window.scrollBy({ left: e.deltaX, top: e.deltaY, behavior: 'instant' as ScrollBehavior });
      }, { passive: false });

      // Save each completed stroke
      canvas.on('path:created', async (e: { path: InstanceType<FabricModule['Path']> }) => {
        const path = e.path;
        path.set({ selectable: false, evented: false, hasControls: false });
        canvas?.renderAll();
        const token = await getOrCreateSessionToken();
        const row = await saveAnnotation({
          url: normalizeUrl(window.location.href),
          data: wrapWithDimensions(path.toJSON() as Record<string, unknown>),
          type: 'drawing',
          session_token: token,
        });
        if (row) loadedRows.push(row);
        annotationCount++;
      });

      // Text placement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('mouse:down', (e: any) => {
        if (currentTool !== 'text' || isEditingText || !canvas || !fab) return;
        const pointer = canvas.getPointer(e.e);
        const text = new fab.IText('', {
          left: pointer.x,
          top: pointer.y,
          fill: currentColor,
          fontSize: Math.max(currentSize * 5, 16),
          fontFamily: 'system-ui, sans-serif',
          selectable: true,
          hasControls: false,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        isEditingText = true;
        text.enterEditing();
      });

      // Save text when editing ends (canvas-level event fires more reliably than object-level)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('text:editing:exited', async (e: any) => {
        isEditingText = false;
        const text = e.target;
        if (!text) return;
        const content = (text.text ?? '').trim();
        if (content) {
          text.set({ selectable: false, evented: false, hasControls: false });
          canvas?.renderAll();
          const token = await getOrCreateSessionToken();
          const row = await saveAnnotation({
            url: normalizeUrl(window.location.href),
            data: wrapWithDimensions(text.toJSON() as Record<string, unknown>),
            type: 'text',
            session_token: token,
          });
          if (row) loadedRows.push(row);
          annotationCount++;
        } else {
          canvas?.remove(text);
        }
      });

      // On resize: resize the canvas and re-render stored annotations with new ratios
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(async () => {
          if (!containerEl || !canvas) return;
          const { w: newW, h: newH } = getPageDimensions();
          containerEl.style.width = `${newW}px`;
          containerEl.style.height = `${newH}px`;
          canvas.setDimensions({ width: newW, height: newH });
          await renderAnnotations(loadedRows);
        }, 250);
      });
    }

    function applyBrush() {
      if (!canvas || !fab) return;
      canvas.isDrawingMode = currentTool === 'draw';
      if (currentTool === 'draw') {
        const brush = new fab.PencilBrush(canvas);
        brush.color = currentColor;
        brush.width = currentSize;
        canvas.freeDrawingBrush = brush;
      }
    }

    // --- Annotation loading & rendering ---

    async function loadAnnotations() {
      if (!canvas || !fab) return;
      loadedRows = await fetchAnnotations(normalizeUrl(window.location.href));
      annotationCount = loadedRows.length;
      await renderAnnotations(loadedRows);
    }

    async function renderAnnotations(rows: AnnotationRow[]) {
      if (!canvas || !fab) return;
      canvas.clear();
      for (const row of rows) {
        await renderAnnotation(row);
      }
      canvas.renderAll();
      applyBrush();
    }

    async function renderAnnotation(row: AnnotationRow) {
      if (!canvas || !fab) return;
      try {
        const { fabricData, storedW, storedH } = parseAnnotationData(row.data);
        const currentW = canvas.width!;
        const currentH = canvas.height!;
        const ratioX = storedW ? currentW / storedW : 1;
        const ratioY = storedH ? currentH / storedH : 1;
        const scaled = scaleFabricData(fabricData, ratioX, ratioY);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [obj] = (await fab.util.enlivenObjects([scaled as any])) as any[];
        if (!obj) return;
        obj.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
        canvas.add(obj);
      } catch (err) {
        console.warn('[Chalk] Could not load annotation:', err);
      }
    }

    // --- Toolbar ---

    function createToolbar() {
      toolbarHostEl = document.createElement('div');
      Object.assign(toolbarHostEl.style, {
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '2147483647',
        display: 'none',
      });

      const shadow = toolbarHostEl.attachShadow({ mode: 'open' });

      shadow.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          .bar {
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 8px;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            user-select: none;
            white-space: nowrap;
          }
          .vdivider { width: 1px; height: 24px; background: #d7d7d7; flex-shrink: 0; }
          .logo {
            display: flex; align-items: center; gap: 5px;
            padding: 0 4px;
            font-family: system-ui, sans-serif;
            font-size: 15px; font-weight: 700; color: #111; letter-spacing: -0.3px;
          }
          .tool-btn {
            width: 40px; height: 40px;
            border-radius: 8px; border: 2px solid transparent;
            background: #ebebeb; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.1s, border-color 0.1s;
            flex-shrink: 0; padding: 0;
          }
          .tool-btn svg { display: block; stroke: #333; transition: stroke 0.1s; }
          .tool-btn:hover { background: #e0e0e0; }
          .tool-btn.active { background: #111; border-color: #111; }
          .tool-btn.active svg { stroke: #fff; }
          .swatches { display: flex; flex-direction: row; align-items: center; gap: 4px; }
          .swatch {
            width: 24px; height: 24px; border-radius: 50%;
            cursor: pointer; border: 2px solid transparent;
            flex-shrink: 0; transition: border-color 0.1s;
          }
          .swatch.active { border-color: #333; box-shadow: 0 0 0 2px #fff inset; }
          .size {
            height: 32px; border-radius: 6px; border: 1px solid #ddd;
            background: #ebebeb; cursor: pointer; color: #57595a;
            padding: 0 10px;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.1s; flex-shrink: 0;
            font-family: system-ui, sans-serif;
          }
          .size.active { background: #111; color: #fff; border-color: #111; }
          .size-s { font-size: 11px; font-weight: 500; }
          .size-m { font-size: 14px; font-weight: 400; }
          .size-l { font-size: 20px; font-weight: 400; line-height: 1; }
          .close-btn {
            width: 40px; height: 40px;
            border-radius: 8px; border: none;
            background: #ebebeb; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            padding: 0; transition: background 0.1s; flex-shrink: 0;
          }
          .close-btn svg { display: block; stroke: #666; transition: stroke 0.1s; }
          .close-btn:hover { background: #fdecea; }
          .close-btn:hover svg { stroke: #e03131; }
        </style>
        <div class="bar">
          <div class="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.4 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
            </svg>
            Chalk
          </div>
          <div class="vdivider"></div>
          <button class="tool-btn active" id="btn-draw" title="Draw">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.4 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
            </svg>
          </button>
          <button class="tool-btn" id="btn-text" title="Text">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" x2="15" y1="20" y2="20"/>
              <line x1="12" x2="12" y1="4" y2="20"/>
            </svg>
          </button>
          <div class="vdivider"></div>
          <div class="swatches" id="swatches"></div>
          <div class="vdivider"></div>
          ${SIZES.map(s => `<button class="size${s === currentSize ? ' active' : ''} size-${s === 2 ? 's' : s === 4 ? 'm' : 'l'}" data-size="${s}">${s === 2 ? 'Small' : s === 4 ? 'Medium' : 'Large'}</button>`).join('')}
          <div class="vdivider"></div>
          <button class="close-btn" id="btn-close" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      `;

      const swatchContainer = shadow.getElementById('swatches')!;
      swatchContainer.style.cssText = 'display:flex;flex-direction:row;gap:4px;align-items:center;';
      for (const color of COLORS) {
        const s = document.createElement('div');
        s.className = `swatch${color === currentColor ? ' active' : ''}`;
        s.style.background = color;
        if (color === '#f5f5f5') s.style.border = '2px solid #ccc';
        s.title = color;
        s.addEventListener('click', () => {
          currentColor = color;
          shadow.querySelectorAll<HTMLElement>('.swatch').forEach(el => {
            el.classList.toggle('active', el.style.background === color);
          });
          if (canvas?.freeDrawingBrush) canvas.freeDrawingBrush.color = color;
        });
        swatchContainer.appendChild(s);
      }

      shadow.getElementById('btn-draw')!.addEventListener('click', () => {
        currentTool = 'draw';
        applyBrush();
        shadow.getElementById('btn-draw')!.classList.add('active');
        shadow.getElementById('btn-text')!.classList.remove('active');
      });

      shadow.getElementById('btn-text')!.addEventListener('click', () => {
        currentTool = 'text';
        applyBrush();
        shadow.getElementById('btn-text')!.classList.add('active');
        shadow.getElementById('btn-draw')!.classList.remove('active');
      });

      shadow.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSize = parseInt(btn.dataset.size!);
          shadow.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (canvas?.freeDrawingBrush) canvas.freeDrawingBrush.width = currentSize;
        });
      });

      shadow.getElementById('btn-close')!.addEventListener('click', () => deactivate());

      document.body.appendChild(toolbarHostEl);
    }
  },
});
