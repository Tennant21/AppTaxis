import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'éléments',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  if (totalItems === 0) return null;

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) {
      pageNumbers.push(i);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-[13px] text-[#52627A] tabular-nums">
        {start}–{end} sur {totalItems} {itemLabel}
      </p>

      {/* Desktop pagination */}
      <div className="hidden sm:flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Page précédente"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE4EF] bg-white text-[#263B59] hover:bg-[#EAF2FB] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pageNumbers.map((num, idx) => {
          const prev = pageNumbers[idx - 1];
          const showEllipsis = prev && num - prev > 1;
          return (
            <React.Fragment key={num}>
              {showEllipsis && (
                <span className="px-1.5 text-[13px] text-[#8290A5]">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(num)}
                aria-current={num === safePage ? 'page' : undefined}
                className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-full px-2.5 text-[13px] font-semibold tabular-nums transition-colors ${
                  num === safePage
                    ? 'bg-[#174EA6] text-white'
                    : 'border border-[#DCE4EF] bg-white text-[#263B59] hover:bg-[#EAF2FB]'
                }`}
              >
                {num}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Page suivante"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE4EF] bg-white text-[#263B59] hover:bg-[#EAF2FB] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile pagination */}
      <div className="flex sm:hidden w-full items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Précédent
        </Button>
        <span className="text-[13px] font-medium text-[#263B59] tabular-nums">
          Page {safePage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};
