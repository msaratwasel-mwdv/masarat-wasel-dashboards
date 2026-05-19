import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";

interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  forceBottom?: boolean; // Backward compatibility
}

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  label,
  className = "",
  forceBottom = false,
}: SearchableSelectProps) {
  const { t, isRtl } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return options.find((opt) => opt.id.toString() === value.toString()) || null;
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = (optId: string | number) => {
    onChange(optId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500 dark:text-[#7ba7e8]/70">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer rounded-[12px] bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/20 border border-[#0f2044]/[0.10] dark:border-[#243460] py-2 px-3.5 text-xs text-gray-800 dark:text-white hover:bg-[#0f2044]/[0.08] dark:hover:bg-[#0f2044]/30 focus:outline-none focus:ring-1 focus:ring-[#f5b800] transition-all"
      >
        <span className={`block truncate ${selectedOption ? "font-bold text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption && (
            <X
              onClick={handleClear}
              className="h-3 w-3 text-gray-400 hover:text-red-500 transition-colors"
            />
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180 text-[#f5b800]" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown Menu Card */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-[14px] bg-white dark:bg-[#1a2845] p-2 shadow-2xl border border-gray-150 dark:border-[#243460] animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Search Box */}
          <div className="relative flex items-center mb-1.5">
            <Search className={`absolute ${isRtl ? "right-2.5" : "left-2.5"} h-3.5 w-3.5 text-gray-400`} />
            <input
              ref={searchInputRef}
              type="text"
              className={`w-full py-1.5 ${isRtl ? "pr-8 pl-3" : "pl-8 pr-3"} text-xs rounded-[10px] bg-gray-50 dark:bg-[#0f2044]/30 border border-gray-150 dark:border-[#243460] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#f5b800]`}
              placeholder={t("Search...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <ul className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <li className="py-2.5 px-3 text-center text-gray-400 dark:text-gray-500 text-xs italic">
                {searchTerm ? t("No results match your search") : t("No options available")}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption && selectedOption.id.toString() === opt.id.toString();
                return (
                  <li
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.id);
                    }}
                    className={`group flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-[8px] transition-colors text-xs ${
                      isSelected
                        ? "bg-[#0f2044] text-white font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-[#0f2044]/5 dark:hover:bg-[#0f2044]/30"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className={`text-[9px] truncate mt-0.5 ${
                          isSelected ? "text-white/70" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#f5b800] shrink-0 ml-1.5" strokeWidth={3} />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
