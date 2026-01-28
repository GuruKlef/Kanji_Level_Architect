
import { KanjiItem } from '../types';

export const parseCSV = (text: string): KanjiItem[] => {
  const lines = text.split(/\r?\n/);
  const items: KanjiItem[] = [];

  // Skip header if it exists (assuming first row might be header if A is not a number)
  const startIdx = isNaN(parseInt(lines[0]?.split(',')[0])) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (!row || row.length < 4 || !row[3]) continue;

    const componentsStr = row[8] || '';
    // Handle various separators for components (comma, space, or just characters)
    const components = componentsStr.includes(',') 
      ? componentsStr.split(',').map(c => c.trim()).filter(Boolean)
      : componentsStr.split('').map(c => c.trim()).filter(Boolean);

    items.push({
      id: `${row[3]}-${i}`, // Use character + index for uniqueness
      level: parseInt(row[0]) || 1,
      type: row[1] || 'Kanji',
      order: parseInt(row[2]) || 0,
      character: row[3],
      meaning1: row[5] || '',
      meaning2: row[6] || '',
      components,
      originalData: row
    });
  }

  return items;
};

// Helper to handle quoted CSV fields
const parseCSVRow = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const exportCSV = (items: KanjiItem[]): string => {
  // We want to reconstruct the CSV but update columns A (0), B (1), C (2) if needed
  // Though instructions say just adjustments, typically you'd want the whole file back.
  
  const csvRows = items.map(item => {
    const row = [...item.originalData];
    row[0] = item.level.toString();
    row[2] = item.order.toString();
    
    return row.map(cell => {
      const stringified = cell.toString();
      return stringified.includes(',') ? `"${stringified}"` : stringified;
    }).join(',');
  });

  return csvRows.join('\n');
};
