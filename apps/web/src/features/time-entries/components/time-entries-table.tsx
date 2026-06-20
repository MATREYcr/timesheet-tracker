'use client';

import type { TimeEntry } from '@timesheet/shared';
import { useTranslation } from 'react-i18next';
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
import { useDeleteTimeEntry } from '../hooks';

interface Props {
  entries: TimeEntry[];
  locked: boolean;
  onEdit: (entry: TimeEntry) => void;
}

export function TimeEntriesTable({ entries, locked, onEdit }: Props) {
  const { t } = useTranslation();
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
          <TableHead className="text-center">
            {t('timeEntries.columns.date')}
          </TableHead>
          <TableHead className="text-center">
            {t('timeEntries.columns.hours')}
          </TableHead>
          <TableHead className="text-center">
            {t('timeEntries.columns.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const deleting = remove.isPending && remove.variables === entry.id;
          return (
            <TableRow key={entry.id}>
              <TableCell className="text-center font-medium">
                {formatDate(entry.date, locale)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {formatHours(entry.hours, locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={locked || deleting}
                    className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
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
                      variant="ghost"
                      disabled={locked || deleting}
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
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
