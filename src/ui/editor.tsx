'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorAdapters } from '@/adapters';

type FabricCanvas = any;
type FabricObject = any;

type PageState = {
  id: string;
  title: string;
};

const PPI = 100;
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const PRINTABLE_WIDTH_IN = 7.5;
const PRINTABLE_HEIGHT_IN = 10;

const CANVAS_WIDTH = Math.round(PAGE_WIDTH_IN * PPI);
const CANVAS_HEIGHT = Math.round(PAGE_HEIGHT_IN * PPI);
const PRINTABLE_WIDTH = Math.round(PRINTABLE_WIDTH_IN * PPI);
const PRINTABLE_HEIGHT = Math.round(PRINTABLE_HEIGHT_IN * PPI);
const PRINTABLE_LEFT = Math.round((CANVAS_WIDTH - PRINTABLE_WIDTH) / 2);
const PRINTABLE_TOP = Math.round((CANVAS_HEIGHT - PRINTABLE_HEIGHT) / 2);

export interface EditorProps {
  adapters: EditorAdapters;
  layoutId?: string;
  projectId: string;
}

export const EditorComponent: React.FC<EditorProps> = ({
  adapters,
  layoutId,
  projectId,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fabricRef = useRef<any>(null);
  const historyRef = useRef<{ undo: string[]; redo: string[] }>({ undo: [], redo: [] });
  const isApplyingHistoryRef = useRef(false);
  const copiedObjectRef = useRef<any>(null);
  const cropHandlesRef = useRef<FabricObject[]>([]);
  const cropTargetRef = useRef<FabricObject | null>(null);
  const pageJsonRef = useRef<Record<string, any | null>>({ 'page-1': null });

  const [pages, setPages] = useState<PageState[]>([
    { id: 'page-1', title: 'Page 1' },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState('#111827');
  const [isBold, setIsBold] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [shareUrl, setShareUrl] = useState('');

  const currentPage = pages[currentPageIndex];

  const getDesignObjects = useCallback((canvas: FabricCanvas) => {
    return canvas.getObjects().filter((obj: any) => {
      const role = obj?.data?.role;
      return role !== 'printable-guide' && role !== 'crop-handle';
    });
  }, []);

  const removeCropHandles = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    cropHandlesRef.current.forEach((h) => canvas.remove(h));
    cropHandlesRef.current = [];
    cropTargetRef.current = null;
    canvas.requestRenderAll();
  }, []);

  const saveCurrentPageJson = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (isApplyingHistoryRef.current) return;
    const page = pages[currentPageIndex];
    if (!page) return;
    removeCropHandles();
    pageJsonRef.current[page.id] = canvas.toJSON(['data']);
  }, [currentPageIndex, pages, removeCropHandles]);

  const pushHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isApplyingHistoryRef.current) return;
    const snapshot = JSON.stringify(canvas.toJSON(['data']));
    const h = historyRef.current;
    h.undo.push(snapshot);
    if (h.undo.length > 10) h.undo.shift();
    h.redo = [];
  }, []);

  const applySnapshot = useCallback((snapshot: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    isApplyingHistoryRef.current = true;
    canvas.loadFromJSON(snapshot, () => {
      canvas.renderAll();
      isApplyingHistoryRef.current = false;
      setSelectedObj(canvas.getActiveObject() || null);
    });
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const h = historyRef.current;
    if (h.undo.length < 2) return;
    const current = h.undo.pop();
    if (!current) return;
    h.redo.push(current);
    const prev = h.undo[h.undo.length - 1];
    if (prev) applySnapshot(prev);
    setStatus('Undo');
  }, [applySnapshot]);

  const redo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const h = historyRef.current;
    const next = h.redo.pop();
    if (!next) return;
    h.undo.push(next);
    applySnapshot(next);
    setStatus('Redo');
  }, [applySnapshot]);

  const renderPrintableGuide = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;

    const existing = canvas.getObjects().find((o: any) => o?.data?.role === 'printable-guide');
    if (existing) canvas.remove(existing);

    const guide = new fabric.Rect({
      left: PRINTABLE_LEFT,
      top: PRINTABLE_TOP,
      width: PRINTABLE_WIDTH,
      height: PRINTABLE_HEIGHT,
      fill: 'rgba(0,0,0,0)',
      stroke: '#d1d5db',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      data: { role: 'printable-guide' },
    });

    canvas.add(guide);
    canvas.sendToBack(guide);
    canvas.requestRenderAll();
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!canvasElRef.current) return;
      const fabricLib = await import('fabric');
      const fabric = (fabricLib as any).fabric;
      if (!mounted || !fabric) return;
      fabricRef.current = fabric;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;
      renderPrintableGuide();

      const initial = JSON.stringify(canvas.toJSON(['data']));
      historyRef.current.undo = [initial];
      historyRef.current.redo = [];

      canvas.on('selection:created', () => setSelectedObj(canvas.getActiveObject() || null));
      canvas.on('selection:updated', () => setSelectedObj(canvas.getActiveObject() || null));
      canvas.on('selection:cleared', () => {
        setSelectedObj(null);
        removeCropHandles();
      });

      const onMutation = () => {
        pushHistory();
        saveCurrentPageJson();
      };

      canvas.on('object:added', onMutation);
      canvas.on('object:modified', onMutation);
      canvas.on('object:removed', onMutation);
    };

    init();

    return () => {
      mounted = false;
      removeCropHandles();
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
      fabricCanvasRef.current = null;
    };
  }, [pushHistory, removeCropHandles, renderPrintableGuide, saveCurrentPageJson]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const cmd = e.ctrlKey || e.metaKey;
      if (!cmd) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((key === 'y') || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }
      if (key === 'a') {
        e.preventDefault();
        const objs = getDesignObjects(canvas);
        if (!objs.length) return;
        const sel = new fabricRef.current.ActiveSelection(objs, { canvas });
        canvas.setActiveObject(sel);
        canvas.requestRenderAll();
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone((cloned: any) => {
          copiedObjectRef.current = cloned;
          setStatus('Copied');
        });
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone((cloned: any) => {
          copiedObjectRef.current = cloned;
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          setStatus('Cut');
        });
        return;
      }
      if (key === 'v') {
        e.preventDefault();
        const copied = copiedObjectRef.current;
        if (!copied) return;
        copied.clone((clonedObj: any) => {
          clonedObj.set({
            left: (clonedObj.left || 0) + 20,
            top: (clonedObj.top || 0) + 20,
          });
          canvas.add(clonedObj);
          canvas.setActiveObject(clonedObj);
          canvas.requestRenderAll();
          setStatus('Pasted');
        });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [getDesignObjects, redo, undo]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !currentPage) return;
      removeCropHandles();

      try {
        const user = await adapters.auth.getCurrentUser();
        const objects = getDesignObjects(canvas).map((obj: any, idx: number) => ({
          id: String(obj?.data?.id || `obj-${idx}`),
          type: obj.type === 'image' ? 'image' : obj.type === 'i-text' ? 'text' : 'shape',
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.getScaledWidth ? obj.getScaledWidth() : obj.width || 0,
          height: obj.getScaledHeight ? obj.getScaledHeight() : obj.height || 0,
          rotation: obj.angle || 0,
          zIndex: idx,
          locked: !!obj.lockMovementX,
          opacity: typeof obj.opacity === 'number' ? obj.opacity : 1,
          properties: {
            text: obj.text,
            fontSize: obj.fontSize,
            fill: obj.fill,
            fontWeight: obj.fontWeight,
            src: obj.getSrc ? obj.getSrc() : undefined,
            flipX: obj.flipX,
          },
        }));

        await adapters.storage.saveLayout({
          _id: layoutId || currentPage.id,
          projectId,
          pageId: currentPage.id,
          ownerId: user.userId,
          title: currentPage.title,
          width: PAGE_WIDTH_IN,
          height: PAGE_HEIGHT_IN,
          elements: objects,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            pageJson: canvas.toJSON(['data']),
            ownerModel: 'single-owner-per-project',
            replaces: 'pdf_templates',
          },
        });

        window.localStorage.setItem(
          `lde:${layoutId || 'new'}:${currentPage.id}`,
          JSON.stringify(canvas.toJSON(['data']))
        );

        setStatus(`Autosaved ${new Date().toLocaleTimeString()}`);
      } catch {
        setStatus('Autosave failed');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [adapters, currentPage, getDesignObjects, layoutId, projectId, removeCropHandles]);

  const addText = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const txt = new fabric.IText('Editable text', {
      left: PRINTABLE_LEFT + 40,
      top: PRINTABLE_TOP + 40,
      fontSize,
      fill: fontColor,
      fontWeight: isBold ? 'bold' : 'normal',
      data: { id: `text-${Date.now()}` },
    });
    canvas.add(txt);
    canvas.setActiveObject(txt);
    canvas.requestRenderAll();
  }, [fontColor, fontSize, isBold]);

  const addRect = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const rect = new fabric.Rect({
      left: PRINTABLE_LEFT + 60,
      top: PRINTABLE_TOP + 60,
      width: 180,
      height: 120,
      fill: '#dbeafe',
      stroke: '#2563eb',
      strokeWidth: 1,
      data: { id: `shape-${Date.now()}` },
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }, []);

  const addImageFromFile = useCallback((file: File) => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      fabric.Image.fromURL(url, (img: any) => {
        img.set({
          left: PRINTABLE_LEFT + 80,
          top: PRINTABLE_TOP + 80,
          data: { id: `image-${Date.now()}`, originalSrc: url },
        });
        const maxW = 320;
        const maxH = 320;
        const sx = maxW / (img.width || maxW);
        const sy = maxH / (img.height || maxH);
        const s = Math.min(sx, sy, 1);
        img.scale(s);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      }, { crossOrigin: 'anonymous' });
    };
    reader.readAsDataURL(file);
  }, []);

  const loadFromProjectContent = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;

    try {
      const [images, texts] = await Promise.all([
        adapters.gallery.getProjectImages(projectId),
        adapters.gallery.getProjectTexts(projectId),
      ]);

      const firstText = texts[0]?.content || 'Project text sample';
      const txt = new fabric.IText(firstText, {
        left: PRINTABLE_LEFT + 24,
        top: PRINTABLE_TOP + 24,
        width: PRINTABLE_WIDTH - 48,
        fontSize,
        fill: fontColor,
        data: { id: `text-${Date.now()}` },
      });
      canvas.add(txt);

      if (images[0]?.url) {
        fabric.Image.fromURL(images[0].url, (img: any) => {
          img.set({
            left: PRINTABLE_LEFT + 24,
            top: PRINTABLE_TOP + 120,
            data: { id: `image-${Date.now()}`, originalSrc: images[0].url },
          });
          const maxW = PRINTABLE_WIDTH - 48;
          const s = Math.min(maxW / (img.width || maxW), 1);
          img.scale(s);
          canvas.add(img);
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
      }

      setStatus('Loaded project/request content');
    } catch {
      setStatus('Failed to load project content');
    }
  }, [adapters.gallery, fontColor, fontSize, projectId]);

  const mirrorSelectedImage = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') return;
    obj.set('flipX', !obj.flipX);
    canvas.requestRenderAll();
    setStatus('Image mirrored');
  }, []);

  const applyFourPointCrop = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') return;

    removeCropHandles();
    cropTargetRef.current = obj;

    const rect = obj.getBoundingRect(true, true);
    const points = [
      { x: rect.left, y: rect.top },
      { x: rect.left + rect.width, y: rect.top },
      { x: rect.left + rect.width, y: rect.top + rect.height },
      { x: rect.left, y: rect.top + rect.height },
    ];

    const updateClip = () => {
      const handles = cropHandlesRef.current;
      if (handles.length !== 4) return;
      const polyPoints = handles.map((h) => ({ x: h.left, y: h.top }));
      obj.clipPath = new fabric.Polygon(polyPoints, {
        absolutePositioned: true,
      });
      canvas.requestRenderAll();
    };

    const handles = points.map((p) => {
      const c = new fabric.Circle({
        left: p.x,
        top: p.y,
        radius: 7,
        fill: '#2563eb',
        stroke: '#ffffff',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        data: { role: 'crop-handle' },
      });
      c.on('moving', updateClip);
      return c;
    });

    cropHandlesRef.current = handles;
    handles.forEach((h) => canvas.add(h));
    updateClip();
    setStatus('4-point crop active (drag blue points)');
  }, [removeCropHandles]);

  const finalizeCrop = useCallback(() => {
    removeCropHandles();
    setStatus('Crop applied (non-destructive)');
  }, [removeCropHandles]);

  const setZOrder = useCallback((mode: 'front' | 'back' | 'forward' | 'backward') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (mode === 'front') canvas.bringToFront(obj);
    if (mode === 'back') canvas.sendToBack(obj);
    if (mode === 'forward') canvas.bringForward(obj);
    if (mode === 'backward') canvas.sendBackwards(obj);
    const guide = canvas.getObjects().find((o: any) => o?.data?.role === 'printable-guide');
    if (guide) canvas.sendToBack(guide);
    canvas.requestRenderAll();
  }, []);

  const applyTextStyles = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    obj.set({
      fontSize,
      fill: fontColor,
      fontWeight: isBold ? 'bold' : 'normal',
    });
    canvas.requestRenderAll();
  }, [fontColor, fontSize, isBold]);

  const exportPNG = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    removeCropHandles();
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${layoutId || 'layout'}-${currentPage.id}.png`;
    a.click();
    setStatus('PNG exported');
  }, [currentPage?.id, layoutId, removeCropHandles]);

  const exportPDF = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    removeCropHandles();
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const jsPdfModule = await import('jspdf');
    const JsPdf = jsPdfModule.jsPDF;
    const pdf = new JsPdf({ orientation: 'portrait', unit: 'in', format: [PAGE_WIDTH_IN, PAGE_HEIGHT_IN] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH_IN, PAGE_HEIGHT_IN);
    pdf.save(`${layoutId || 'layout'}-${currentPage.id}.pdf`);
    setStatus('PDF exported');
  }, [currentPage?.id, layoutId, removeCropHandles]);

  const getExportHtml = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return '';
    removeCropHandles();
    const png = canvas.toDataURL({ format: 'png', multiplier: 2 });
    return [
      '<!DOCTYPE html>',
      '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${layoutId || 'Layout'} - ${currentPage.id}</title>`,
      '<style>body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f4f4f5;} .sheet{background:#fff;max-width:8.5in;margin:0 auto;padding:0.25in;box-shadow:0 10px 28px rgba(0,0,0,.12);} img{width:100%;height:auto;display:block;}</style>',
      '</head><body><div class="sheet">',
      `<img src="${png}" alt="Layout export"/>`,
      '</div></body></html>',
    ].join('');
  }, [currentPage?.id, layoutId, removeCropHandles]);

  const exportHTML = useCallback(() => {
    const html = getExportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layoutId || 'layout'}-${currentPage.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('HTML exported');
  }, [currentPage?.id, getExportHtml, layoutId]);

  const createShareLink = useCallback(async () => {
    const html = getExportHtml();
    if (!html) return;
    const id = `share-${Date.now()}`;
    window.localStorage.setItem(`lde:share:${id}`, html);
    const url = `${window.location.origin}/share?id=${encodeURIComponent(id)}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied');
    } catch {
      setStatus('Share link created');
    }
  }, [getExportHtml]);

  const loadPageJson = useCallback((json: any | null) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    removeCropHandles();
    if (!json) {
      canvas.clear();
      canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());
      renderPrintableGuide();
      const initial = JSON.stringify(canvas.toJSON(['data']));
      historyRef.current.undo = [initial];
      historyRef.current.redo = [];
      return;
    }
    isApplyingHistoryRef.current = true;
    canvas.loadFromJSON(json, () => {
      renderPrintableGuide();
      canvas.renderAll();
      isApplyingHistoryRef.current = false;
      const initial = JSON.stringify(canvas.toJSON(['data']));
      historyRef.current.undo = [initial];
      historyRef.current.redo = [];
    });
  }, [removeCropHandles, renderPrintableGuide]);

  const switchPage = useCallback((index: number) => {
    saveCurrentPageJson();
    setCurrentPageIndex(index);
  }, [saveCurrentPageJson]);

  useEffect(() => {
    const page = pages[currentPageIndex];
    if (!page) return;
    const cached = pageJsonRef.current[page.id];
    if (cached) {
      loadPageJson(cached);
      return;
    }
    const local = window.localStorage.getItem(`lde:${layoutId || 'new'}:${page.id}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        pageJsonRef.current[page.id] = parsed;
        loadPageJson(parsed);
        return;
      } catch {
        // noop
      }
    }
    loadPageJson(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex, layoutId]);

  const addNewPage = useCallback(() => {
    saveCurrentPageJson();
    const newId = `page-${Date.now()}`;
    pageJsonRef.current[newId] = null;
    setPages((prev) => {
      const nextIndex = prev.length + 1;
      return [...prev, { id: newId, title: `Page ${nextIndex}` }];
    });
    setCurrentPageIndex(pages.length);
    setStatus('New page created');
  }, [pages.length, saveCurrentPageJson]);

  const shortcutHint = useMemo(
    () => 'Ctrl/Cmd+Z Undo, Ctrl/Cmd+Y Redo, Ctrl/Cmd+X/C/V, Ctrl/Cmd+A',
    []
  );

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', height: '100%', width: '100%', background: '#eef2ff' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12, borderBottom: '1px solid #c7d2fe', background: '#ffffff' }}>
        <button onClick={addText}>Add Text</button>
        <button onClick={addRect}>Add Shape</button>
        <button onClick={() => fileInputRef.current?.click()}>Add Image</button>
        <button onClick={loadFromProjectContent}>From Project/Request</button>
        <button onClick={mirrorSelectedImage}>Mirror</button>
        <button onClick={applyFourPointCrop}>4-Point Crop</button>
        <button onClick={finalizeCrop}>Apply Crop</button>
        <button onClick={() => setZOrder('backward')}>Send Backward</button>
        <button onClick={() => setZOrder('forward')}>Bring Forward</button>
        <button onClick={() => setZOrder('back')}>Send to Back</button>
        <button onClick={() => setZOrder('front')}>Bring to Front</button>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #c7d2fe', background: '#f8fafc' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          Font
          <input
            type="number"
            value={fontSize}
            min={8}
            max={120}
            onChange={(e) => setFontSize(Number(e.target.value || 28))}
            onBlur={applyTextStyles}
            style={{ width: 72 }}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          Color
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            onBlur={applyTextStyles}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={isBold}
            onChange={(e) => setIsBold(e.target.checked)}
            onBlur={applyTextStyles}
          />
          Bold
        </label>
        <button onClick={applyTextStyles}>Apply Text Style</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={exportPNG}>Export PNG</button>
          <button onClick={exportPDF}>Export PDF</button>
          <button onClick={exportHTML}>Export HTML</button>
          <button onClick={createShareLink}>Create HTML Share Link</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
        <aside style={{ borderRight: '1px solid #c7d2fe', background: '#ffffff', padding: 12, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Pages</strong>
            <button onClick={addNewPage}>New Page</button>
          </div>
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => switchPage(idx)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                marginBottom: 6,
                border: idx === currentPageIndex ? '2px solid #4f46e5' : '1px solid #d1d5db',
                background: idx === currentPageIndex ? '#eef2ff' : '#fff',
                borderRadius: 6,
              }}
            >
              {p.title}
            </button>
          ))}

          <div style={{ marginTop: 16, fontSize: 12, color: '#4b5563' }}>
            <div><strong>Selected</strong>: {selectedObj ? selectedObj.type : 'None'}</div>
            <div style={{ marginTop: 8 }}><strong>Canvas</strong>: 8.5x11</div>
            <div><strong>Printable</strong>: 7.5x10 centered</div>
            <div style={{ marginTop: 8 }}>{shortcutHint}</div>
          </div>
        </aside>

        <main style={{ overflow: 'auto', padding: 16 }}>
          <div style={{ width: CANVAS_WIDTH, margin: '0 auto', border: '1px solid #d1d5db', boxShadow: '0 10px 24px rgba(0,0,0,.12)', background: '#fff' }}>
            <canvas ref={canvasElRef} />
          </div>
        </main>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid #c7d2fe', background: '#ffffff', fontSize: 12, color: '#374151' }}>
        <span>{status}</span>
        <span>{shareUrl ? `Share: ${shareUrl}` : 'No share link yet'}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addImageFromFile(file);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
};

export const Toolbar: React.FC = () => {
  return <div>Toolbar (Phase 1)</div>;
};

export const Canvas: React.FC = () => {
  return <div>Canvas (Phase 1)</div>;
};

export const PropertiesPanel: React.FC = () => {
  return <div>Properties Panel (Phase 1)</div>;
};

export const LayersPanel: React.FC = () => {
  return <div>Layers Panel (Phase 1)</div>;
};

export const GalleryPanel: React.FC = () => {
  return <div>Gallery Panel (Phase 2)</div>;
};

export const ExportPanel: React.FC = () => {
  return <div>Export Panel (Phase 4)</div>;
};
