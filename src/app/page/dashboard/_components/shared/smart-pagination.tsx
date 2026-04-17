"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Pages to show on each side of the current page (default: 1) */
  delta?: number;
}

/** Returns the visible page numbers/ellipsis tokens for a windowed pagination. */
function getPageRange(
  current: number,
  total: number,
  delta: number
): (number | "...")[] {
  if (total <= 1) return [];

  const left = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);
  const items: (number | "...")[] = [];

  if (left > 1) {
    items.push(1);
    if (left > 2) items.push("...");
  }

  for (let i = left; i <= right; i++) items.push(i);

  if (right < total) {
    if (right < total - 1) items.push("...");
    items.push(total);
  }

  return items;
}

export function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  delta = 1,
}: SmartPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages, delta);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === "..." ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                onClick={() => onPageChange(p as number)}
                isActive={currentPage === p}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
