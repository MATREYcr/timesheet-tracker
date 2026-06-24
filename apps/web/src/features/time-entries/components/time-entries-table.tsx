'use client';

import type { TimeEntry } from '@timesheet/shared';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatHours } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';
import { useDeleteTimeEntry } from '../hooks';

interface Props {
  entries: TimeEntry[];
  locked: boolean;
  onEdit: (entry: TimeEntry) => void;
}

export function TimeEntriesTable({ entries, locked, onEdit }: Props) {
  const t = useTranslations('timeEntries');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const remove = useDeleteTimeEntry();

  const handleDelete = (entry: TimeEntry) => {
    remove.mutate(entry.id, {
      onSuccess: () => toast.success(t('toast.deleted')),
    });
  };

  return (
    <Table aria-label={t('title')} className="min-w-120 table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.date')}</TableHead>
          <TableHead>{t('columns.hours')}</TableHead>
          <TableHead>{t('columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => {
          const deleting = remove.isPending && remove.variables === entry.id;
          return (
            <TableRow
              key={entry.id}
              className={ITEM_ENTER}
              style={staggerDelay(i)}
            >
              <TableCell className="font-medium">
                {formatDate(entry.date, locale)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatHours(entry.hours, locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={locked || deleting}
                    onClick={() => onEdit(entry)}
                  >
                    {tCommon('edit')}
                  </Button>
                  <ConfirmDialog
                    title={t('delete.title')}
                    description={t('delete.description')}
                    confirmLabel={tCommon('delete')}
                    destructive
                    onConfirm={() => handleDelete(entry)}
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={locked || deleting}
                    >
                      {tCommon('delete')}
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
