import { useState, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ChevronUpDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
    />
  </svg>
);

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
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
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
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-gray-500 mb-1">
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
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-brand-yellow transition sm:text-sm">
            <ComboboxInput
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(opt: any) => opt?.label || ""}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom start"
            className="z-[99] mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm empty:invisible transition duration-100 ease-in data-[leave]:opacity-0"
          >
            {query.length > 0 && (
              <ComboboxOption
                value={{ id: "", label: query }}
                className="relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900"
              >
                Search for "{query}"...
              </ComboboxOption>
            )}

            <ComboboxOption
              value={null}
              className={({ focus }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  focus ? "bg-brand-navy text-white" : "text-gray-900"
                }`
              }
            >
              All Fleet
            </ComboboxOption>

            {filteredOptions.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                No matching results.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <ComboboxOption
                  key={opt.id}
                  value={opt}
                  className={({ focus }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      focus ? "bg-brand-navy text-white" : "text-gray-900"
                    }`
                  }
                >
                  {({ selected, focus }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-bold" : "font-normal"
                        }`}
                      >
                        {opt.label}
                        {opt.subLabel && (
                          <span
                            className={`text-xs ml-2 ${
                              focus ? "text-gray-100" : "text-gray-400"
                            }`}
                          >
                            ({opt.subLabel})
                          </span>
                        )}
                      </span>
                      {selected && (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            focus ? "text-white" : "text-brand-navy"
                          }`}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
