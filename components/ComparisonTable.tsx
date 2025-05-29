
import React from 'react';

export interface TableRow {
  criterion: string;
  lieu: string;
  subqg: string;
  [key: string]: string; // Allow for dynamic access
}

interface ComparisonTableProps {
  headers: string[];
  rows: TableRow[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto my-6 rounded-lg shadow-md border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 bg-slate-800">
        <thead className="bg-slate-700/50">
          <tr>
            {headers.map((header) => (
              <th 
                key={header} 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-700/30 transition-colors duration-150">
              {headers.map((header, colIndex) => (
                <td 
                  key={`${rowIndex}-${colIndex}`} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"
                >
                  {row[header.toLowerCase().replace(/\s+/g, '').replace('-modell', '')] || row.criterion}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};