'use client';

import type { TimeEntry } from '@timesheet/shared';
import { useTranslations } from 'next-intl';
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
import { useLocale } from '@/i18n/use-locale';
import { formatDate, formatHours } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';
import { useDeleteTimeEntry } from '../hooks';

interface Props {
  entries: TimeEntry[];
  locked: boolean;
  onEdit: (entry: TimeEntry) => void;
}

export function TimeEntriesTable({ entries, locked, onEdit }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const remove = useDeleteTimeEntry();

  const handleDelete = (entry: TimeEntry) => {
    remove.mutate(entry.id, {
      onSuccess: () => toast.success(t('timeEntries.toast.deleted')),
    });
  };

  return (
    <Table aria-label={t('timeEntries.title')} className="min-w-120 table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead>{t('timeEntries.columns.date')}</TableHead>
          <TableHead>{t('timeEntries.columns.hours')}</TableHead>
          <TableHead>{t('timeEntries.columns.actions')}</TableHead>
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
                    {t('common.edit')}
                  </Button>
                  <ConfirmDialog
                    title={t('timeEntries.delete.title')}
                    description={t('timeEntries.delete.description')}
                    confirmLabel={t('common.delete')}
                    destructive
                    onConfirm={() => handleDelete(entry)}
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={locked || deleting}
                    >
                      {t('common.delete')}
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
