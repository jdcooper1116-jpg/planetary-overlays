'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface FilterField {
  key: string;
  label: string;
  options: string[];
  placeholder?: string;
}

interface FilterBarProps {
  fields: FilterField[];
}

export default function FilterBar({ fields }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters = fields.some((f) => searchParams.get(f.key));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-mono">{field.label}</label>
          <select
            value={searchParams.get(field.key) ?? ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="">{field.placeholder ?? 'All'}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-gray-500 hover:text-gray-300 underline ml-1"
        >
          clear filters
        </button>
      )}
    </div>
  );
}
