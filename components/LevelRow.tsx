
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanjiItem } from '../types';
import KanjiCard from './KanjiCard';

interface LevelRowProps {
  level: number;
  items: KanjiItem[];
  allCharactersMap: Map<string, number>;
  onMoveToLevel?: (itemId: string, targetLevel: number) => void;
}

const LevelRow: React.FC<LevelRowProps> = ({ level, items, allCharactersMap, onMoveToLevel }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `level-${level}`,
  });

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col md:flex-row border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="w-full md:w-20 bg-gray-100 flex items-center justify-center font-bold text-gray-500 py-2 md:py-0 border-r border-gray-200">
        L{level}
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-wrap gap-3 p-4 min-h-[5rem] transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''
        }`}
      >
        {sortedItems.map((item) => {
          // Check dependencies and collect detail levels
          const violatedComponents: string[] = [];
          const componentDetails: { char: string; level?: number }[] = [];
          let maxCompLevel = 0;
          
          item.components.forEach(compChar => {
            const compLevel = allCharactersMap.get(compChar);
            componentDetails.push({ char: compChar, level: compLevel });
            
            if (compLevel !== undefined) {
              if (compLevel > maxCompLevel) {
                maxCompLevel = compLevel;
              }
              // Violation if current level is strictly BEFORE a component's level
              if (level < compLevel) {
                violatedComponents.push(compChar);
              }
            }
          });

          return (
            <KanjiCard 
              key={item.id} 
              item={item} 
              isWarning={violatedComponents.length > 0} 
              violatedComponents={violatedComponents}
              componentDetails={componentDetails}
              suggestedLevel={maxCompLevel > 0 ? maxCompLevel : undefined}
              onMoveToLevel={onMoveToLevel}
            />
          );
        })}
        {sortedItems.length === 0 && !isOver && (
          <div className="flex items-center justify-center w-full text-gray-300 text-sm italic">
            Empty level
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelRow;
