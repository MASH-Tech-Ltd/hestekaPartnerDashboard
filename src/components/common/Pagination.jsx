import React from 'react';
import { useLang } from '../../context/LanguageContext';

const Pagination = ({ meta, onPageChange, loading }) => {
  const { t } = useLang();

  if (loading) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-[#fcfaf7] border-t border-[#e8ddd0] animate-pulse">
        <div className="h-4 bg-[#f5f0e8] rounded w-1/4"></div>
        <div className="h-8 bg-[#f5f0e8] rounded w-1/3"></div>
      </div>
    );
  }

  if (!meta) return null;

  const { page, totalPages, total } = meta;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#fcfaf7] border-t border-[#e8ddd0]">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="relative inline-flex items-center rounded-md border border-[#e8ddd0] bg-white px-4 py-2 text-sm font-medium text-[#3a2a1a] hover:bg-[#f5f0e8] disabled:opacity-50 transition-colors"
        >
          {t.previous || "Previous"}
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-[#e8ddd0] bg-white px-4 py-2 text-sm font-medium text-[#3a2a1a] hover:bg-[#f5f0e8] disabled:opacity-50 transition-colors"
        >
          {t.next || "Next"}
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#9a8a7a]">
            {t.showing || "Showing"} <span className="font-bold">{(page - 1) * meta.limit + 1}</span> {t.to || "to"} <span className="font-bold">{Math.min(page * meta.limit, total)}</span> {t.of || "of"} <span className="font-bold">{total}</span> {t.results || "results"}
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#9a8a7a] ring-1 ring-inset ring-[#e8ddd0] hover:bg-[#f5f0e8] focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
            >
              <span className="sr-only">{t.previous || "Previous"}</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {getPages()[0] > 1 && (
              <>
                <button onClick={() => onPageChange(1)} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#3a2a1a] ring-1 ring-inset ring-[#e8ddd0] hover:bg-[#f5f0e8] focus:z-20 transition-colors">1</button>
                {getPages()[0] > 2 && <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#9a8a7a] ring-1 ring-inset ring-[#e8ddd0]">...</span>}
              </>
            )}

            {getPages().map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${p === page ? 'z-10 bg-[#8B6914] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6914]' : 'text-[#3a2a1a] ring-1 ring-inset ring-[#e8ddd0] hover:bg-[#f5f0e8] focus:z-20'} transition-all`}
              >
                {p}
              </button>
            ))}

            {getPages().slice(-1)[0] < totalPages && (
              <>
                {getPages().slice(-1)[0] < totalPages - 1 && <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#9a8a7a] ring-1 ring-inset ring-[#e8ddd0]">...</span>}
                <button onClick={() => onPageChange(totalPages)} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#3a2a1a] ring-1 ring-inset ring-[#e8ddd0] hover:bg-[#f5f0e8] focus:z-20 transition-colors">{totalPages}</button>
              </>
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#9a8a7a] ring-1 ring-inset ring-[#e8ddd0] hover:bg-[#f5f0e8] focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
            >
              <span className="sr-only">{t.next || "Next"}</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
