import React from 'react';
import { useLang } from '../../context/LanguageContext';
import { Inbox } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  loading,
  onRowClick,
  skeletonCount = 10,
  emptyMessage
}) => {
  const { t } = useLang();
  const displayEmptyMessage = emptyMessage || t.noDataFound || "No data found.";
  const showSkeleton = loading && data.length === 0;

  return (
    <div className="relative min-h-[400px]">
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-start justify-center pt-20 transition-all duration-300">
          <div className="bg-white px-5 py-2.5 rounded-full shadow-2xl border border-[#e8ddd0] flex items-center gap-3 animate-bounce">
            <div className="w-4 h-4 border-2 border-[#8B6914] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-[#3a2a1a] uppercase tracking-widest">{t.updating || "Updating..."}</span>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfaf7] border-b border-[#e8ddd0]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`py-4 px-4 text-[10px] font-bold text-[#9a8a7a] tracking-widest uppercase ${col.align === 'right' ? 'text-right' :
                      col.align === 'center' ? 'text-center' :
                        'text-left'
                    }`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8d8]">
            {showSkeleton ? (
              Array(skeletonCount).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="py-6 px-4">
                      <div className="flex flex-col gap-3">
                        <div className="h-3.5 bg-gray-200 rounded-md w-3/4"></div>
                        <div className="h-2.5 bg-gray-100 rounded-md w-1/2"></div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, i) => (
                <tr
                  key={row._id || i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group hover:bg-[#fcfaf7] transition-all duration-300 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`py-5 px-4 text-xs text-[#3a2a1a] font-medium ${col.align === 'right' ? 'text-right' :
                          col.align === 'center' ? 'text-center' :
                            'text-left'
                        }`}
                    >
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-40 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                     <Inbox className="w-12 h-12" />
                    <p className="text-sm font-bold uppercase tracking-widest">{displayEmptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-[#fcfaf7]">
        {showSkeleton ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e8ddd0] p-5 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((row, i) => (
            <div
              key={row._id || i}
              onClick={() => onRowClick && onRowClick(row)}
              className="bg-white rounded-2xl border border-[#e8ddd0] p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-4"
            >
              <div className="border-b border-[#f0e8d8] pb-3">
                {columns[0].cell ? columns[0].cell(row) : (
                  <div className="text-sm font-bold text-[#3a2a1a]">
                    {row[columns[0].accessor]}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {columns.slice(1, -1).map((col, j) => (
                  <div key={j} className={`flex flex-col gap-1 ${col.header?.toLowerCase() === 'address' ? 'col-span-2' : ''}`}>
                    <span className="text-[9px] font-bold text-[#9a8a7a] uppercase tracking-widest">{col.header}</span>
                    <div className="text-xs text-[#3a2a1a] font-medium break-words">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#f0e8d8] flex flex-col gap-2">
                <span className="text-[9px] font-bold text-[#9a8a7a] uppercase tracking-widest">{columns[columns.length - 1].header}</span>
                <div className="flex flex-wrap gap-2">
                  {columns[columns.length - 1].cell ? columns[columns.length - 1].cell(row) : row[columns[columns.length - 1].accessor]}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-20 bg-white rounded-2xl border border-dashed border-[#e8ddd0]">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-[#e8ddd0]" />
            <p className="text-xs font-bold uppercase tracking-widest">{displayEmptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
