
import React, { useState, useMemo, useCallback } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { KanjiItem } from './types';
import { parseCSV, exportCSV } from './utils/csvHelper';
import LevelRow from './components/LevelRow';
import { Upload, Download, Search, Info, LayoutGrid, FileJson } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<KanjiItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedItems = parseCSV(text);
      setItems(parsedItems);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (items.length === 0) return;
    setIsExporting(true);
    const csvContent = exportCSV(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kanji_curriculum_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = items.find(item => item.id === active.id);
    const overId = over.id as string;

    if (activeItem && overId.startsWith('level-')) {
      const newLevel = parseInt(overId.replace('level-', ''));
      handleMoveToLevel(activeItem.id, newLevel);
    }
  };

  const handleMoveToLevel = useCallback((itemId: string, targetLevel: number) => {
    setItems(prevItems => {
      const activeItem = prevItems.find(item => item.id === itemId);
      if (!activeItem || activeItem.level === targetLevel) return prevItems;

      // Find max order in target level to append it at the end
      const targetLevelItems = prevItems.filter(i => i.level === targetLevel);
      const maxOrder = targetLevelItems.length > 0 
        ? Math.max(...targetLevelItems.map(i => i.order)) 
        : 0;

      return prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, level: targetLevel, order: maxOrder + 1 };
        }
        return item;
      });
    });
  }, []);

  const characterToLevelMap = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(item => {
      map.set(item.character, item.level);
    });
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      item.character.includes(searchQuery) || 
      item.meaning1.toLowerCase().includes(lowerQuery) || 
      item.meaning2.toLowerCase().includes(lowerQuery)
    );
  }, [items, searchQuery]);

  const activeItem = useMemo(() => 
    items.find(i => i.id === activeId), 
    [items, activeId]
  );

  const levels = Array.from({ length: 72 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kanji Architect</h1>
              <p className="text-xs text-gray-500 font-medium">Japanese Curriculum Level Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search character or meaning..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <label className="cursor-pointer flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Upload size={18} />
              <span>Import</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              onClick={handleExport}
              disabled={items.length === 0 || isExporting}
              className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${isExporting ? 'animate-pulse' : ''}`}
            >
              <Download size={18} />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12">
            <div className="bg-emerald-50 p-6 rounded-full text-emerald-600 mb-6">
              <FileJson size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Curriculum Loaded</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Upload a CSV file containing your Kanji and Radical curriculum data to start organizing your levels.
            </p>
            <div className="flex flex-col items-center gap-4">
               <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-3">
                <Upload size={20} />
                <span>Choose CSV File</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <div className="text-xs text-gray-400 flex flex-col gap-1 italic">
                <span>Columns: A (Level), B (Type), C (Order), D (Char), F (Meaning1), G (Meaning2), I (Components)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Levels 1-72</span>
              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                  <span>Radicals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                  <span>Kanji</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-red-500 rounded-sm"></div>
                  <span>Warning (Dependency Missing)</span>
                </div>
              </div>
            </div>

            <DndContext 
              sensors={sensors} 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="divide-y divide-gray-200">
                {levels.map((level) => (
                  <LevelRow
                    key={level}
                    level={level}
                    items={filteredItems.filter(item => item.level === level)}
                    allCharactersMap={characterToLevelMap}
                    onMoveToLevel={handleMoveToLevel}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}>
                {activeId && activeItem ? (
                  <div className={`
                    w-16 h-16 rounded-lg flex items-center justify-center shadow-2xl
                    ${activeItem.type.toLowerCase().includes('radical') ? 'bg-yellow-400 text-yellow-900' : 'bg-emerald-500 text-white'}
                  `}>
                    <span className="kanji-font text-3xl font-bold">{activeItem.character}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </main>

      {/* Footer / Stats */}
      {items.length > 0 && (
        <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 gap-2">
            <div className="flex gap-4">
              <span>Total: <strong>{items.length}</strong> items</span>
              <span>Radicals: <strong>{items.filter(i => i.type.toLowerCase().includes('radical')).length}</strong></span>
              <span>Kanji: <strong>{items.filter(i => i.type.toLowerCase().includes('kanji')).length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Info size={14} className="text-gray-400" />
              <span>Drag cards to change levels. Hover warning to "Fix Placement" automatically.</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
