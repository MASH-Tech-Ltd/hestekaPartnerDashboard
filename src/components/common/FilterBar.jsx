import React, { useState, useEffect } from 'react';
import { useLang } from '../../context/LanguageContext';
import { Search } from 'lucide-react';

const FilterBar = ({
  onSearch,
  onFilterChange,
  onSortChange,
  filters = [],
  sortOptions = [],
  placeholder,
  actionButton,
  related = false
}) => {
  const { t } = useLang();
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  return (
    <div className={`p-3 flex flex-wrap items-center justify-between gap-4 transition-all ${related
        ? "bg-white border-b border-[#e8ddd0]"
        : "bg-white rounded-2xl border border-[#e8ddd0] shadow-sm"
      }`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder || t.searchPlaceholder || "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/10 transition-all w-72 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50 w-4 h-4 text-[#9a8a7a]" />
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <select
            key={filter.name}
            onChange={(e) => onFilterChange(filter.name, e.target.value)}
            className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-[#8B6914] transition-all cursor-pointer min-w-[150px] shadow-sm appearance-none"
          >
            <option value="all">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Sorting */}
        {sortOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#9a8a7a] uppercase tracking-wider">{t.sortBy || "Sort by:"}</span>
            <select
              onChange={(e) => {
                const [sortBy, sort] = e.target.value.split(':');
                onSortChange(sortBy, sort);
              }}
              className="bg-[#fcfaf7] border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-xs text-[#3a2a1a] outline-none focus:border-[#8B6914] transition-all cursor-pointer shadow-sm appearance-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action Button */}
        {actionButton && (
          <div className="ml-2">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
