import { useState, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Search, ChevronDown, Check } from "lucide-react";

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
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className = "",
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id.toString() === value.toString()) || null,
    [options, value]
  );

  const filteredOptions =
    query === ""
      ? options
      : options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase()) ||
            (opt.subLabel &&
              opt.subLabel.toLowerCase().includes(query.toLowerCase()))
        );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#0f2044]/60 dark:text-[#7ba7e8]/70">
          {label}
        </label>
      )}
      <Combobox
        value={selectedOption}
        onChange={(opt: Option | null) => {
          onChange(opt ? opt.id : "");
          setQuery("");
        }}
        onClose={() => setQuery("")}
        nullable
      >
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-[18px] bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/30 border border-[#0f2044]/[0.10] dark:border-[#243460] text-gray-800 dark:text-white focus-within:ring-2 focus-within:ring-[#f5b800] transition-all">
            <ComboboxInput
              className="w-full border-none py-2.5 pl-4 pr-10 text-sm bg-transparent focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              displayValue={(opt: any) => opt?.label || ""}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className="h-4 w-4 text-gray-400 group-hover:text-[#f5b800] transition-colors"
                aria-hidden="true"
              />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom start"
            className="z-[99] mt-2 max-h-60 w-[var(--input-width)] overflow-auto rounded-2xl bg-white dark:bg-[#1a2845] py-2 text-base shadow-2xl border border-gray-100 dark:border-[#243460] focus:outline-none sm:text-sm empty:invisible transition duration-100 ease-in data-[leave]:opacity-0"
          >
            {query.length > 0 && filteredOptions.length === 0 && (
              <div className="relative cursor-default select-none py-3 px-4 text-gray-500 dark:text-gray-400 text-xs italic">
                {query.length > 0 ? `No results for "${query}"` : "No results found"}
              </div>
            )}

            {filteredOptions.map((opt) => (
              <ComboboxOption
                key={opt.id}
                value={opt}
                className={({ focus, selected }) =>
                  `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                    focus 
                      ? "bg-[#0f2044] text-white" 
                      : selected 
                        ? "bg-[#0f2044]/5 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800]" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0f2044]/20"
                  }`
                }
              >
                {({ selected, focus }) => (
                  <>
                    <div className="flex flex-col">
                      <span className={`block truncate ${selected ? "font-bold" : "font-medium"}`}>
                        {opt.label}
                      </span>
                      {opt.subLabel && (
                        <span className={`text-[10px] truncate ${focus ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {selected && (
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${focus ? "text-white" : "text-[#f5b800]"}`}>
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
