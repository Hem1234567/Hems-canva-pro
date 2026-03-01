import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CanvasElement, EditorState, ElementType, createDefaultElement } from '@/types/editor';

export interface Page {
  id: string;
  elements: CanvasElement[];
}

interface EditorContextType {
  elements: CanvasElement[];
  selectedId: string | null;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  unit: 'mm' | 'inch' | 'px';
  projectName: string;
  history: CanvasElement[][];
  historyIndex: number;
  selectedElement: CanvasElement | null;
  snapEnabled: boolean;
  selectedIds: Set<string>;
  selectedElements: CanvasElement[];
  // Multi-page
  pages: Page[];
  currentPageIndex: number;
  addPage: () => void;
  deletePage: (index: number) => void;
  duplicatePage: (index: number) => void;
  switchPage: (index: number) => void;
  // Actions
  addElement: (type: ElementType) => void;
  addImageElement: (src: string) => void;
  selectElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setZoom: (zoom: number) => void;
  setProjectName: (name: string) => void;
  setCanvasSize: (w: number, h: number) => void;
  undo: () => void;
  redo: () => void;
  duplicateElement: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  loadElements: (elements: CanvasElement[]) => void;
  copyElement: () => void;
  pasteElement: () => void;
  setSnapEnabled: (v: boolean) => void;
  reorderElements: (fromIndex: number, toIndex: number) => void;
  toggleSelectElement: (id: string) => void;
  selectAll: () => void;
  deleteSelected: () => void;
  updateSelectedElements: (updates: Partial<CanvasElement>) => void;
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be inside EditorProvider');
  return ctx;
};

const createPageId = () => `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<Page[]>([{ id: createPageId(), elements: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoomState] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [unit] = useState<'mm' | 'inch' | 'px'>('mm');
  const [projectName, setProjectName] = useState('Untitled Design');
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Current page elements accessor
  const elements = pages[currentPageIndex]?.elements || [];
  
  const setElements = useCallback((newElements: CanvasElement[]) => {
    setPages(prev => prev.map((p, i) => i === currentPageIndex ? { ...p, elements: newElements } : p));
  }, [currentPageIndex]);

  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Multi-page actions
  const addPage = useCallback(() => {
    const newPage: Page = { id: createPageId(), elements: [] };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(prev => prev + 1);
    setSelectedId(null);
    setSelectedIds(new Set());
  }, []);

  const deletePage = useCallback((index: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== index));
    setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
    setSelectedId(null);
    setSelectedIds(new Set());
  }, [pages.length]);

  const duplicatePage = useCallback((index: number) => {
    const source = pages[index];
    if (!source) return;
    const newPage: Page = {
      id: createPageId(),
      elements: source.elements.map(el => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })),
    };
    setPages(prev => [...prev.slice(0, index + 1), newPage, ...prev.slice(index + 1)]);
    setCurrentPageIndex(index + 1);
  }, [pages]);

  const switchPage = useCallback((index: number) => {
    if (index < 0 || index >= pages.length) return;
    setCurrentPageIndex(index);
    setSelectedId(null);
    setSelectedIds(new Set());
  }, [pages.length]);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPages(prev => {
      const newPages = [...prev];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);
      return newPages;
    });
    setCurrentPageIndex(toIndex);
  }, []);

  const addElement = useCallback((type: ElementType) => {
    const el = createDefaultElement(type, 50 + Math.random() * 100, 50 + Math.random() * 100);
    const newElements = [...elements, el];
    setElements(newElements);
    setSelectedId(el.id);
    pushHistory(newElements);
  }, [elements, pushHistory, setElements]);

  const addImageElement = useCallback((src: string) => {
    const el = createDefaultElement('image', 50 + Math.random() * 100, 50 + Math.random() * 100);
    el.src = src;
    const newElements = [...elements, el];
    setElements(newElements);
    setSelectedId(el.id);
    pushHistory(newElements);
  }, [elements, pushHistory, setElements]);

  const selectElement = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedIds(id ? new Set([id]) : new Set());
  }, []);

  const toggleSelectElement = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (next.size > 0) setSelectedId(next.has(id) ? id : [...next][next.size - 1]);
      else setSelectedId(null);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(elements.map(e => e.id));
    setSelectedIds(allIds);
    if (elements.length > 0) setSelectedId(elements[elements.length - 1].id);
  }, [elements]);

  const deleteSelected = useCallback(() => {
    const newElements = elements.filter(el => !selectedIds.has(el.id));
    setElements(newElements);
    setSelectedId(null);
    setSelectedIds(new Set());
    pushHistory(newElements);
  }, [elements, selectedIds, pushHistory, setElements]);

  const updateSelectedElements = useCallback((updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => selectedIds.has(el.id) ? { ...el, ...updates } : el);
    setElements(newElements);
  }, [elements, selectedIds, setElements]);

  const alignElements = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const sel = elements.filter(el => selectedIds.has(el.id));
    if (sel.length < 2) return;
    let ref: number;
    const newElements = [...elements];
    switch (alignment) {
      case 'left': ref = Math.min(...sel.map(e => e.x)); break;
      case 'right': ref = Math.max(...sel.map(e => e.x + e.width)); break;
      case 'center': { const minX = Math.min(...sel.map(e => e.x)); const maxX = Math.max(...sel.map(e => e.x + e.width)); ref = (minX + maxX) / 2; break; }
      case 'top': ref = Math.min(...sel.map(e => e.y)); break;
      case 'bottom': ref = Math.max(...sel.map(e => e.y + e.height)); break;
      case 'middle': { const minY = Math.min(...sel.map(e => e.y)); const maxY = Math.max(...sel.map(e => e.y + e.height)); ref = (minY + maxY) / 2; break; }
    }
    for (let i = 0; i < newElements.length; i++) {
      if (!selectedIds.has(newElements[i].id)) continue;
      const el = newElements[i];
      switch (alignment) {
        case 'left': newElements[i] = { ...el, x: ref }; break;
        case 'right': newElements[i] = { ...el, x: ref - el.width }; break;
        case 'center': newElements[i] = { ...el, x: ref - el.width / 2 }; break;
        case 'top': newElements[i] = { ...el, y: ref }; break;
        case 'bottom': newElements[i] = { ...el, y: ref - el.height }; break;
        case 'middle': newElements[i] = { ...el, y: ref - el.height / 2 }; break;
      }
    }
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, selectedIds, pushHistory, setElements]);

  const distributeElements = useCallback((direction: 'horizontal' | 'vertical') => {
    const sel = elements.filter(el => selectedIds.has(el.id));
    if (sel.length < 3) return;
    const sorted = [...sel].sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSize = direction === 'horizontal'
      ? sorted.reduce((s, e) => s + e.width, 0)
      : sorted.reduce((s, e) => s + e.height, 0);
    const totalSpace = direction === 'horizontal'
      ? (last.x + last.width) - first.x - totalSize
      : (last.y + last.height) - first.y - totalSize;
    const gap = totalSpace / (sorted.length - 1);
    const newElements = [...elements];
    let pos = direction === 'horizontal' ? first.x : first.y;
    for (const s of sorted) {
      const idx = newElements.findIndex(e => e.id === s.id);
      if (idx === -1) continue;
      if (direction === 'horizontal') {
        newElements[idx] = { ...newElements[idx], x: pos };
        pos += newElements[idx].width + gap;
      } else {
        newElements[idx] = { ...newElements[idx], y: pos };
        pos += newElements[idx].height + gap;
      }
    }
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, selectedIds, pushHistory, setElements]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(newElements);
  }, [elements, setElements]);

  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    if (selectedId === id) setSelectedId(null);
    pushHistory(newElements);
  }, [elements, selectedId, pushHistory, setElements]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const dup = { ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, x: el.x + 20, y: el.y + 20 };
    const newElements = [...elements, dup];
    setElements(newElements);
    setSelectedId(dup.id);
    pushHistory(newElements);
  }, [elements, pushHistory, setElements]);

  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx === -1) return;
    const newArr = [...elements];
    const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (swapIdx < 0 || swapIdx >= newArr.length) return;
    [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    setElements(newArr);
    pushHistory(newArr);
  }, [elements, pushHistory, setElements]);

  const loadElements = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements);
    setSelectedId(null);
    pushHistory(newElements);
  }, [pushHistory, setElements]);

  const copyElement = useCallback(() => {
    const el = elements.find(e => e.id === selectedId);
    if (el) setClipboard({ ...el });
  }, [elements, selectedId]);

  const pasteElement = useCallback(() => {
    if (!clipboard) return;
    const dup = { ...clipboard, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, x: clipboard.x + 30, y: clipboard.y + 30 };
    const newElements = [...elements, dup];
    setElements(newElements);
    setSelectedId(dup.id);
    pushHistory(newElements);
  }, [clipboard, elements, pushHistory, setElements]);

  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newArr = [...elements];
    const [moved] = newArr.splice(fromIndex, 1);
    newArr.splice(toIndex, 0, moved);
    setElements(newArr);
    pushHistory(newArr);
  }, [elements, pushHistory, setElements]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setElements(history[newIdx]);
  }, [history, historyIndex, setElements]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setElements(history[newIdx]);
  }, [history, historyIndex, setElements]);

  const selectedElement = elements.find(el => el.id === selectedId) || null;
  const selectedElements = elements.filter(el => selectedIds.has(el.id));

  return (
    <EditorContext.Provider value={{
      elements, selectedId, zoom, canvasWidth, canvasHeight, unit, projectName,
      history, historyIndex, selectedElement, snapEnabled, selectedIds, selectedElements,
      pages, currentPageIndex, addPage, deletePage, duplicatePage, switchPage, reorderPages,
      addElement, addImageElement, selectElement, updateElement, deleteElement,
      setZoom: setZoomState, setProjectName, setCanvasSize: (w, h) => { setCanvasWidth(w); setCanvasHeight(h); },
      undo, redo, duplicateElement, moveLayer, loadElements,
      copyElement, pasteElement, setSnapEnabled, reorderElements,
      toggleSelectElement, selectAll, deleteSelected, updateSelectedElements,
      alignElements, distributeElements,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
