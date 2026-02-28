import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CanvasElement, EditorState, ElementType, createDefaultElement } from '@/types/editor';

interface EditorContextType extends EditorState {
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
  selectedElement: CanvasElement | null;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  loadElements: (elements: CanvasElement[]) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be inside EditorProvider');
  return ctx;
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoomState] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [unit] = useState<'mm' | 'inch' | 'px'>('mm');
  const [projectName, setProjectName] = useState('Untitled Label');
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const addElement = useCallback((type: ElementType) => {
    const el = createDefaultElement(type, 50 + Math.random() * 100, 50 + Math.random() * 100);
    const newElements = [...elements, el];
    setElements(newElements);
    setSelectedId(el.id);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const addImageElement = useCallback((src: string) => {
    const el = createDefaultElement('image', 50 + Math.random() * 100, 50 + Math.random() * 100);
    el.src = src;
    const newElements = [...elements, el];
    setElements(newElements);
    setSelectedId(el.id);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const selectElement = useCallback((id: string | null) => setSelectedId(id), []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(newElements);
  }, [elements]);

  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    if (selectedId === id) setSelectedId(null);
    pushHistory(newElements);
  }, [elements, selectedId, pushHistory]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const dup = { ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, x: el.x + 20, y: el.y + 20 };
    const newElements = [...elements, dup];
    setElements(newElements);
    setSelectedId(dup.id);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx === -1) return;
    const newArr = [...elements];
    const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (swapIdx < 0 || swapIdx >= newArr.length) return;
    [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    setElements(newArr);
    pushHistory(newArr);
  }, [elements, pushHistory]);

  const loadElements = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements);
    setSelectedId(null);
    pushHistory(newElements);
  }, [pushHistory]);
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setElements(history[newIdx]);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setElements(history[newIdx]);
  }, [history, historyIndex]);

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  return (
    <EditorContext.Provider value={{
      elements, selectedId, zoom, canvasWidth, canvasHeight, unit, projectName,
      history, historyIndex, selectedElement,
      addElement, addImageElement, selectElement, updateElement, deleteElement,
      setZoom: setZoomState, setProjectName, setCanvasSize: (w, h) => { setCanvasWidth(w); setCanvasHeight(h); },
      undo, redo, duplicateElement, moveLayer, loadElements,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
