'use client';

import type { TimeEntry } from '@timesheet/shared';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    <Table aria-label={t('timeEntries.title')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('timeEntries.columns.date')}</TableHead>
          <TableHead className="text-right">
            {t('timeEntries.columns.hours')}
          </TableHead>
          <TableHead className="text-right">
            {t('timeEntries.columns.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const deleting = remove.isPending && remove.variables === entry.id;
          return (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {formatDate(entry.date, locale)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatHours(entry.hours, locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2 text-sm">
                  <Button
                    variant="link"
                    disabled={locked || deleting}
                    className="text-primary h-auto p-0"
                    onClick={() => onEdit(entry)}
                  >
                    {t('common.edit')}
                  </Button>
                  <span className="text-border">·</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="link"
                        disabled={locked || deleting}
                        className="text-destructive h-auto p-0"
                      >
                        {t('common.delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('timeEntries.delete.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('timeEntries.delete.description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(entry)}>
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
