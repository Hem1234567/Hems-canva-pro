import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorProvider, useEditor } from '@/contexts/EditorContext';
import DesignCanvas, { DesignCanvasHandle } from '@/components/editor/DesignCanvas';
import ImageUploader from '@/components/editor/ImageUploader';
import Konva from 'konva';
import ExportDialog from '@/components/editor/ExportDialog';

const LetterpadMakerInner = () => {
  const navigate = useNavigate();
  const { setCanvasSize, zoomToFit, setZoom, addCustomElement, loadElements, canvasWidth, canvasHeight, selectedElement, updateElement, canvasBg, setCanvasBg, elements, selectElement, moveLayer, deleteElement } = useEditor();

  const [activeTab, setActiveTab] = useState<'text' | 'shapes' | 'image'>('text');
  const [padSize, setPadSize] = useState('a4');
  const [widthIn, setWidthIn] = useState('8.27');
  const [heightIn, setHeightIn] = useState('11.69');
  const [textContent, setTextContent] = useState('');

  // 1 inch = 96 pixels (standard web DPI)
  const DPI = 96;

  const stageRef = useRef<Konva.Stage>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('letterpad-maker-draft', JSON.stringify({ 
        elements, 
        canvasWidth, 
        canvasHeight, 
        canvasBg 
      }));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [elements, canvasWidth, canvasHeight, canvasBg]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('letterpad-maker-draft');
      if (draft) {
        const { elements: savedEls, canvasBg: bg } = JSON.parse(draft);
        if (savedEls && savedEls.length > 0) loadElements(savedEls);
        if (bg) setCanvasBg(bg);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Preset Change
  useEffect(() => {
    if (padSize === 'a4') {
      setWidthIn('8.27');
      setHeightIn('11.69');
    } else if (padSize === 'letter') {
      setWidthIn('8.5');
      setHeightIn('11');
    } else if (padSize === 'legal') {
      setWidthIn('8.5');
      setHeightIn('14');
    }
  }, [padSize]);

  // Handle Size updates
  useEffect(() => {
    const w = parseFloat(widthIn) || 8.27;
    const h = parseFloat(heightIn) || 11.69;
    const pxW = Math.round((w * DPI) / 3);
    const pxH = Math.round((h * DPI) / 3);
    
    setCanvasSize(pxW, pxH);
    
    const timer = setTimeout(() => {
      zoomToFit();
    }, 150);
    return () => clearTimeout(timer);
  }, [widthIn, heightIn, setCanvasSize, zoomToFit]);

  const handleAddText = (text: string, size: number = 24, bold: boolean = false) => {
    addCustomElement({ 
      type: 'text', 
      text, 
      fill: '#000000', 
      fontSize: size, 
      fontStyle: bold ? 'bold' : 'normal',
      align: 'center', 
      width: 400 
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the letterpad?")) {
      loadElements([]);
    }
  };

  const activeTabClass = "flex-1 min-w-[70px] py-2 px-2 md:px-3 text-center rounded-lg text-xs md:text-sm font-medium transition-colors bg-primary text-white";
  const inactiveTabClass = "flex-1 min-w-[70px] py-2 px-2 md:px-3 text-center rounded-lg text-xs md:text-sm font-medium transition-colors bg-white/10 text-gray-300 hover:bg-white/20";

  return (
    <div className="min-h-screen bg-neutral-950 pt-16 px-4 pb-12">
      <div className="container mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-8 max-w-6xl mx-auto border border-white/20">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              
              {/* Size Configuration */}
              <div className="bg-white/5 rounded-2xl p-5">
                <div className="text-lg font-semibold text-white mb-4">Letterpad Size</div>
                <select 
                  value={padSize}
                  onChange={(e) => setPadSize(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary"
                >
                  <option className="bg-neutral-800" value="a4">A4 (8.27" x 11.69")</option>
                  <option className="bg-neutral-800" value="letter">US Letter (8.5" x 11")</option>
                  <option className="bg-neutral-800" value="legal">Legal (8.5" x 14")</option>
                  <option className="bg-neutral-800" value="custom">Custom Size</option>
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs text-gray-400">Width (in)</label>
                    <input 
                      type="number" min="1" max="20" step="0.25" 
                      value={widthIn} 
                      onChange={(e) => { setWidthIn(e.target.value); setPadSize('custom'); }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Height (in)</label>
                    <input 
                      type="number" min="1" max="20" step="0.25" 
                      value={heightIn} 
                      onChange={(e) => { setHeightIn(e.target.value); setPadSize('custom'); }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-gray-400 block mb-2">Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={canvasBg?.slice(0, 7) || '#ffffff'} 
                      onChange={(e) => setCanvasBg(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer shrink-0 border border-white/30 bg-transparent p-0" 
                    />
                    <input 
                      type="text" 
                      value={canvasBg || '#ffffff'} 
                      onChange={(e) => setCanvasBg(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/10 border border-white/30 rounded-lg text-white text-xs font-mono uppercase" 
                    />
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="bg-white/5 rounded-2xl p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setActiveTab('text')} className={activeTab === 'text' ? activeTabClass : inactiveTabClass}>Text</button>
                  <button onClick={() => setActiveTab('shapes')} className={activeTab === 'shapes' ? activeTabClass : inactiveTabClass}>Shapes</button>
                  <button onClick={() => setActiveTab('image')} className={activeTab === 'image' ? activeTabClass : inactiveTabClass}>Image</button>
                </div>
                
                <div className="space-y-4">
                  {activeTab === 'text' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Text Content</label>
                        <input 
                          type="text" 
                          placeholder="Enter text" 
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddText(textContent)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 text-sm" 
                        />
                      </div>
                      <button onClick={() => handleAddText(textContent || 'Sample Text')} className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors">Add Text</button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAddText('COMPANY NAME', 36, true)} className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">+ Company Name</button>
                        <button onClick={() => handleAddText('123 Business Rd, City, State 12345\nPhone: (123) 456-7890\nEmail: contact@company.com', 14)} className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">+ Contact Info</button>
                        <button onClick={() => handleAddText('Date: _________')} className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">+ Date Field</button>
                        <button onClick={() => handleAddText('Ref: _________')} className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">+ Ref Field</button>
                        <button onClick={() => handleAddText('Authorized Signature\n\n__________________', 16)} className="py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors col-span-2">+ Signature Line</button>
                      </div>
                    </>
                  )}
                  {activeTab === 'shapes' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addCustomElement({ type: 'rect', width: 200, height: 100, fill: '#000000' })} className="py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">Rectangle</button>
                      <button onClick={() => addCustomElement({ type: 'circle', height: 100, width: 100, fill: '#000000' })} className="py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors">Circle</button>
                      <button onClick={() => addCustomElement({ type: 'line', width: 400, fill: '#000000', strokeWidth: 2 })} className="py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors col-span-2">Line</button>
                    </div>
                  )}
                  {activeTab === 'image' && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                      <p className="text-sm text-gray-300 mb-2">Upload your company logo</p>
                      <ImageUploader />
                    </div>
                  )}
                </div>
              </div>

              {/* Clear */}
              <div className="bg-white/5 rounded-2xl p-5 space-y-3">
                <button onClick={handleClearAll} className="w-full py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-medium transition-colors">Clear All</button>
              </div>

              {/* Properties for selected element */}
              {selectedElement && (
                <div className="bg-white/5 rounded-2xl p-5 border border-primary/20">
                  <div className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
                    <span className="capitalize">{selectedElement.type} Properties</span>
                    <button onClick={() => updateElement(selectedElement.id, { opacity: selectedElement.opacity === 0 ? 1 : 0 })} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 hover:bg-white/20">Hide</button>
                  </div>
                  
                  {/* Position & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-gray-400">Width</label>
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.width)} 
                        onChange={e => updateElement(selectedElement.id, { width: Math.max(1, Number(e.target.value)) })} 
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Height</label>
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.height)} 
                        onChange={e => updateElement(selectedElement.id, { height: Math.max(1, Number(e.target.value)) })} 
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                      />
                    </div>
                  </div>

                  {/* Colors & Styles */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400">Color (Fill)</label>
                        <div className="flex gap-2 items-center mt-1">
                          <input 
                            type="color" 
                            value={selectedElement.fill?.slice(0, 7) || '#000000'} 
                            onChange={e => updateElement(selectedElement.id, { fill: e.target.value })} 
                            className="w-8 h-8 rounded cursor-pointer shrink-0 border border-white/30 bg-transparent p-0" 
                          />
                          <input 
                            type="text" 
                            value={selectedElement.fill || '#000000'} 
                            onChange={e => updateElement(selectedElement.id, { fill: e.target.value })} 
                            className="w-full px-2 py-1.5 bg-white/10 border border-white/30 rounded-lg text-white text-xs font-mono" 
                          />
                        </div>
                      </div>
                      
                      {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'line') && (
                        <div>
                          <label className="text-xs text-gray-400">Stroke Color</label>
                          <div className="flex gap-2 items-center mt-1">
                            <input 
                              type="color" 
                              value={selectedElement.stroke?.slice(0, 7) || '#000000'} 
                              onChange={e => updateElement(selectedElement.id, { stroke: e.target.value })} 
                              className="w-8 h-8 rounded cursor-pointer shrink-0 border border-white/30 bg-transparent p-0" 
                            />
                            <input 
                              type="text" 
                              value={selectedElement.stroke || '#000000'} 
                              onChange={e => updateElement(selectedElement.id, { stroke: e.target.value })} 
                              className="w-full px-2 py-1.5 bg-white/10 border border-white/30 rounded-lg text-white text-xs font-mono" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'line') && (
                      <div>
                        <label className="text-xs text-gray-400">Stroke Width</label>
                        <input 
                          type="number" 
                          min="0"
                          value={selectedElement.strokeWidth || 0} 
                          onChange={e => updateElement(selectedElement.id, { strokeWidth: Math.max(0, Number(e.target.value)) })} 
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                        />
                      </div>
                    )}

                    {(selectedElement.type === 'rect' || selectedElement.type === 'image') && (
                      <div>
                        <label className="text-xs text-gray-400">Corner Radius</label>
                        <input 
                          type="number" 
                          min="0"
                          value={selectedElement.cornerRadius || 0} 
                          onChange={e => updateElement(selectedElement.id, { cornerRadius: Math.max(0, Number(e.target.value)) })} 
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                        />
                      </div>
                    )}

                    {selectedElement.type === 'text' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Font Family</label>
                          <select 
                            value={selectedElement.fontFamily || 'Inter'}
                            onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option className="bg-neutral-800" value="Inter">Inter</option>
                            <option className="bg-neutral-800" value="Roboto">Roboto</option>
                            <option className="bg-neutral-800" value="Arial">Arial</option>
                            <option className="bg-neutral-800" value="Times New Roman">Times New Roman</option>
                            <option className="bg-neutral-800" value="Courier New">Courier New</option>
                            <option className="bg-neutral-800" value="Georgia">Georgia</option>
                            <option className="bg-neutral-800" value="Verdana">Verdana</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                            <input 
                              type="number" 
                              min="1"
                              value={Math.round(selectedElement.fontSize || 16)} 
                              onChange={e => updateElement(selectedElement.id, { fontSize: Math.max(1, Number(e.target.value)) })} 
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Style</label>
                            <div className="flex gap-1 h-9">
                              <button 
                                onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle?.includes('bold') ? selectedElement.fontStyle.replace('bold', '').trim() || 'normal' : `${selectedElement.fontStyle === 'normal' ? '' : (selectedElement.fontStyle || '')} bold`.trim() })}
                                className={`flex-1 flex items-center justify-center rounded-lg border transition-colors ${selectedElement.fontStyle?.includes('bold') ? 'bg-primary/20 border-primary text-primary' : 'bg-white/10 border-white/30 text-white hover:bg-white/20'}`}
                                title="Bold"
                              >
                                <span className="font-bold text-sm">B</span>
                              </button>
                              <button 
                                onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle?.includes('italic') ? selectedElement.fontStyle.replace('italic', '').trim() || 'normal' : `${selectedElement.fontStyle === 'normal' ? '' : (selectedElement.fontStyle || '')} italic`.trim() })}
                                className={`flex-1 flex items-center justify-center rounded-lg border transition-colors ${selectedElement.fontStyle?.includes('italic') ? 'bg-primary/20 border-primary text-primary' : 'bg-white/10 border-white/30 text-white hover:bg-white/20'}`}
                                title="Italic"
                              >
                                <span className="italic font-serif text-sm">I</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Edit Text</label>
                          <textarea 
                            value={selectedElement.text || ''} 
                            onChange={e => updateElement(selectedElement.id, { text: e.target.value })} 
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm resize-none" 
                            rows={4}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Layers List */}
              <div className="bg-white/5 rounded-2xl p-5 border border-primary/20 mt-4">
                <div className="text-sm font-semibold text-white mb-4">Layers</div>
                <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                  {[...elements].reverse().map((el) => {
                    const label = el.type === 'text' ? (el.text?.slice(0, 16) || 'Text') : el.type;
                    const isActive = el.id === selectedElement?.id;
                    return (
                      <div
                        key={el.id} 
                        onClick={() => selectElement(el.id)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/10 text-gray-300 border border-transparent'}`}
                      >
                        {el.locked && <Lock className="w-3 h-3 shrink-0 opacity-70" />}
                        <span className="capitalize truncate flex-1">{label}</span>
                        <div className="flex shrink-0">
                          <button className="p-1 hover:bg-white/20 rounded z-10" onClick={e => { e.stopPropagation(); moveLayer(el.id, 'up'); }} title="Bring Forward">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:bg-white/20 rounded z-10" onClick={e => { e.stopPropagation(); moveLayer(el.id, 'down'); }} title="Send Backward">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:bg-white/20 rounded z-10" onClick={e => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} title="Lock Element">
                            {el.locked ? <Lock className="w-3.5 h-3.5 text-primary" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button className="p-1 hover:bg-white/20 rounded text-red-400 z-10" onClick={e => { e.stopPropagation(); deleteElement(el.id); }} title="Delete Element">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {elements.length === 0 && <p className="text-xs text-gray-500 italic">No elements yet</p>}
                </div>
              </div>
            </div>

            {/* Right: Preview & Actions */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              <div className="bg-neutral-800 rounded-2xl p-2 sm:p-6 flex-1 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] overflow-auto relative group">
                <div className="absolute top-2 right-2 text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Scroll to zoom • Drag items
                </div>
                {/* Integration of real canvas */}
                <DesignCanvas hideWorkspace={true} ref={(r: DesignCanvasHandle | null) => { if (r && r.getStage()) { (stageRef as any).current = r.getStage(); } }} />
              </div>
              
              <div className="text-center text-gray-400 text-sm">
                Letterpad size: {widthIn}" × {heightIn}" ({canvasWidth * 3} × {canvasHeight * 3} pixels in designer)
              </div>
              
              {/* Output Actions */}
              <div className="mt-4 flex justify-end">
                <ExportDialog stageRef={stageRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LetterpadMakerPage = () => {
  return (
    <EditorProvider>
      <LetterpadMakerInner />
    </EditorProvider>
  );
};

export default LetterpadMakerPage;
