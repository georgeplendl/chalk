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
    let annotationCount = 0;
    let isEditingText = false;
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
        // Response is sent after async activate in next tick — use a flag
        setTimeout(() => sendResponse({ active: isActive, count: annotationCount }), 50);
      }
      return true;
    });

    // --- Lifecycle ---

    async function activate() {
      isActive = true;

      if (!fab) {
        fab = await import('fabric');
      }

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
      if (containerEl) containerEl.style.pointerEvents = visible ? 'all' : 'none';
      if (toolbarHostEl) toolbarHostEl.style.display = visible ? 'block' : 'none';
    }

    // --- Canvas ---

    function createCanvas() {
      if (!fab) return;

      const pageH = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      const pageW = window.innerWidth;

      containerEl = document.createElement('div');
      Object.assign(containerEl.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${pageW}px`,
        height: `${pageH}px`,
        pointerEvents: 'none',
        zIndex: '2147483646',
        overflow: 'hidden',
      });
      document.body.appendChild(containerEl);

      const canvasEl = document.createElement('canvas');
      canvasEl.width = pageW;
      canvasEl.height = pageH;
      containerEl.appendChild(canvasEl);

      canvas = new fab.Canvas(canvasEl, {
        selection: false,
        enableRetinaScaling: false,
      });

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
        await saveAnnotation({
          url: normalizeUrl(window.location.href),
          data: path.toJSON() as Record<string, unknown>,
          type: 'drawing',
          session_token: token,
        });
        annotationCount++;
      });

      // Text placement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('mouse:down', async (e: any) => {
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

        text.on('editing:exited', async () => {
          isEditingText = false;
          const content = (text.text ?? '').trim();
          if (content) {
            text.set({ selectable: false, evented: false, hasControls: false });
            canvas?.renderAll();
            const token = await getOrCreateSessionToken();
            await saveAnnotation({
              url: normalizeUrl(window.location.href),
              data: text.toJSON() as Record<string, unknown>,
              type: 'text',
              session_token: token,
            });
            annotationCount++;
          } else {
            canvas?.remove(text);
          }
        });
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

    // --- Load existing annotations ---

    async function loadAnnotations() {
      if (!canvas || !fab) return;
      const url = normalizeUrl(window.location.href);
      const rows: AnnotationRow[] = await fetchAnnotations(url);
      annotationCount = rows.length;

      for (const row of rows) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [obj] = (await fab.util.enlivenObjects([row.data as any])) as any[];
          if (!obj) continue;
          obj.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
          canvas.add(obj);
        } catch (err) {
          console.warn('[Chalk] Could not load annotation:', err);
        }
      }

      canvas.renderAll();
    }

    // --- Toolbar ---

    function createToolbar() {
      toolbarHostEl = document.createElement('div');
      Object.assign(toolbarHostEl.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '2147483647',
        display: 'none',
      });

      const shadow = toolbarHostEl.attachShadow({ mode: 'open' });

      shadow.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          .bar {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            user-select: none;
          }
          .divider { width: 80%; height: 1px; background: #eee; margin: 2px 0; }
          button {
            width: 36px; height: 36px;
            border-radius: 8px; border: 2px solid transparent;
            background: #f4f4f4; cursor: pointer;
            font-size: 12px; font-weight: 700; color: #333;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.1s, border-color 0.1s;
          }
          button:hover { background: #e8e8e8; }
          button.active { background: #111; color: #fff; border-color: #111; }
          .swatch {
            width: 24px; height: 24px; border-radius: 50%;
            cursor: pointer; border: 2px solid transparent;
            flex-shrink: 0; transition: border-color 0.1s;
          }
          .swatch.active { border-color: #333; box-shadow: 0 0 0 2px #fff inset; }
          .size {
            width: 36px; height: 28px;
            border-radius: 6px; border: 1.5px solid #ddd;
            background: #f4f4f4; cursor: pointer;
            font-size: 11px; font-weight: 700; color: #555;
          }
          .size.active { background: #111; color: #fff; border-color: #111; }
          .close {
            width: 36px; height: 28px;
            border-radius: 6px; border: 1.5px solid #ddd;
            background: #f4f4f4; font-size: 13px; cursor: pointer; color: #666;
          }
          .close:hover { background: #fdecea; border-color: #e03131; color: #e03131; }
        </style>
        <div class="bar">
          <button id="btn-draw" class="active" title="Draw">D</button>
          <button id="btn-text" title="Text">T</button>
          <div class="divider"></div>
          <div id="swatches"></div>
          <div class="divider"></div>
          ${SIZES.map(s => `<button class="size${s === currentSize ? ' active' : ''}" data-size="${s}">${s === 2 ? 'S' : s === 4 ? 'M' : 'L'}</button>`).join('')}
          <div class="divider"></div>
          <button class="close" id="btn-close">x</button>
        </div>
      `;

      // Color swatches
      const swatchContainer = shadow.getElementById('swatches')!;
      swatchContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;';
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

      // Tool buttons
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

      // Size buttons
      shadow.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSize = parseInt(btn.dataset.size!);
          shadow.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (canvas?.freeDrawingBrush) canvas.freeDrawingBrush.width = currentSize;
        });
      });

      // Close
      shadow.getElementById('btn-close')!.addEventListener('click', () => deactivate());

      document.body.appendChild(toolbarHostEl);
    }
  },
});
