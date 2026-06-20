'use client';

import type { Employee } from '@timesheet/shared';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Props {
  employees: Employee[];
  value?: string;
  onChange: (employeeId: string | undefined) => void;
  /** Trigger text when nothing is selected (selection mode). */
  placeholder?: string;
  /** When set, adds an "all" option and shows this as the empty-state label (filter mode). */
  allLabel?: string;
  className?: string;
}

export function EmployeeCombobox({
  employees,
  value,
  onChange,
  placeholder,
  allLabel,
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = employees.find((e) => e.id === value);
  const label = selected
    ? `${selected.firstName} ${selected.lastName}`
    : (allLabel ?? placeholder ?? t('timeEntries.selectEmployee'));

  const select = (employeeId: string | undefined) => {
    onChange(employeeId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-10 w-64 justify-between font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('common.searchEmployee')} />
          <CommandList>
            <CommandEmpty>{t('common.noEmployees')}</CommandEmpty>
            <CommandGroup>
              {allLabel && (
                <CommandItem value="__all__" onSelect={() => select(undefined)}>
                  <Check
                    className={cn('size-4', value ? 'opacity-0' : 'opacity-100')}
                  />
                  {allLabel}
                </CommandItem>
              )}
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.firstName} ${employee.lastName}`}
                  onSelect={() => select(employee.id)}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === employee.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {employee.firstName} {employee.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
