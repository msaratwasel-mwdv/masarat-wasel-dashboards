import { Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export default function Pagination({ links }: { links: PaginationLink[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  if (links.length <= 3) return null;

  return (
    <div className={`flex flex-wrap justify-center gap-1 mt-6 ${isRTL ? "flex-row-reverse" : ""}`}>
      {links.map((link, key) =>
        link.url === null ? (
          <div
            key={key}
            className={`px-3 py-1.5 text-sm rounded-lg border cursor-not-allowed ${
              isDark
                ? "text-gray-600 bg-gray-800 border-gray-700"
                : "text-gray-400 bg-white border-gray-200"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <Link
            key={key}
            href={link.url}
            preserveScroll
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              link.active
                ? "bg-brand-dark text-white border-brand-dark shadow-sm"
                : isDark
                ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        )
      )}
    </div>
  );
}
