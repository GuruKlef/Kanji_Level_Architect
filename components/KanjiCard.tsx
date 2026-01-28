
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { KanjiItem } from '../types';
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface ComponentDetail {
  char: string;
  level?: number;
}

interface KanjiCardProps {
  item: KanjiItem;
  isWarning: boolean;
  violatedComponents: string[];
  componentDetails: ComponentDetail[];
  suggestedLevel?: number;
  onMoveToLevel?: (itemId: string, targetLevel: number) => void;
}

const KanjiCard: React.FC<KanjiCardProps> = ({ 
  item, 
  isWarning, 
  violatedComponents, 
  componentDetails,
  suggestedLevel,
  onMoveToLevel 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const isRadical = item.type.toLowerCase().includes('radical');
  
  // Base background colors
  const bgColor = isRadical 
    ? (isWarning ? 'bg-yellow-200' : 'bg-yellow-400') 
    : (isWarning ? 'bg-emerald-200' : 'bg-emerald-500');
    
  const textColor = isRadical ? 'text-yellow-900' : 'text-white';
  
  // Apply pulse animation only when not hovering to keep it solid on hover
  const borderColor = isWarning ? 'border-red-500 border-2' : 'border-transparent';
  const animationClass = isWarning ? 'animate-pulse group-hover:animate-none' : '';

  const handleAutoFix = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onMoveToLevel && suggestedLevel) {
      onMoveToLevel(item.id, suggestedLevel);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative group flex flex-col items-center justify-center 
        w-14 h-14 sm:w-16 sm:h-16 rounded-lg cursor-grab active:cursor-grabbing
        transition-all duration-200 shadow-sm hover:shadow-md
        ${bgColor} ${textColor} ${borderColor} ${animationClass}
        ${isDragging ? 'opacity-50 scale-110 shadow-xl' : 'opacity-100'}
      `}
    >
      <span className="kanji-font text-2xl sm:text-3xl font-bold">{item.character}</span>
      
      {isWarning && (
        <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-sm z-10">
          <AlertTriangle size={12} />
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] w-48 sm:w-64">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 animate-none cursor-default" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-sm uppercase tracking-wider opacity-70">{item.type}</span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Level {item.level}</span>
          </div>
          <div className="mb-2">
            <div className="text-sm font-medium">{item.meaning1}</div>
            <div className="text-gray-400 italic">{item.meaning2}</div>
          </div>
          
          {componentDetails.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <div className="text-gray-400 mb-1">Components & Levels:</div>
              <div className="flex flex-wrap gap-1">
                {componentDetails.map((comp, idx) => (
                  <span key={idx} className={`kanji-font px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${violatedComponents.includes(comp.char) ? 'text-red-400 border-red-500/30' : 'text-emerald-400'}`}>
                    {comp.char} <span className="text-[10px] opacity-60">L{comp.level ?? '?'}</span>
                  </span>
                ))}
              </div>
              
              {isWarning && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded text-red-100">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle size={12} />
                    Dependency Violation
                  </div>
                  <div className="opacity-90">
                    Needs: {violatedComponents.join(' ')}
                  </div>
                  
                  {suggestedLevel && (
                    <button
                      onClick={handleAutoFix}
                      className="mt-2 w-full flex items-center justify-between gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded transition-colors shadow-sm active:scale-95"
                    >
                      <div className="flex items-center gap-1">
                        <Zap size={12} />
                        <span>Fix Placement</span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-90">
                        <ArrowRight size={10} />
                        <span>L{suggestedLevel}</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default KanjiCard;
