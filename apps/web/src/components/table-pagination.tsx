'use client';

import { useTranslations } from 'next-intl';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, onPageChange }: Props) {
  const t = useTranslations('pagination');
  if (totalPages <= 1) return null;

  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <span className="text-muted-foreground text-sm">
        {t('page', { page, total: totalPages })}
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text={t('previous')}
              aria-disabled={atStart}
              className={cn(atStart && 'pointer-events-none opacity-50')}
              onClick={(e) => {
                e.preventDefault();
                if (!atStart) onPageChange(page - 1);
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              text={t('next')}
              aria-disabled={atEnd}
              className={cn(atEnd && 'pointer-events-none opacity-50')}
              onClick={(e) => {
                e.preventDefault();
                if (!atEnd) onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
