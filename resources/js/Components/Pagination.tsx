import { Link } from "@inertiajs/react";

export default function Pagination({ links }: { links: any[] }) {
  if (links.length <= 3) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1 mt-8">
      {links.map((link, key) =>
        link.url === null ? (
          <div
            key={key}
            className="px-4 py-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <Link
            key={key}
            href={link.url}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              link.active
                ? "bg-brand-dark text-white border-brand-dark shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        )
      )}
    </div>
  );
}
