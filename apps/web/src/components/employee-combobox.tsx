'use client';

import type { Employee } from '@timesheet/shared';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { useEmployeeSearch } from '@/features/employees/hooks';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

interface Props {
  value?: Employee;
  onChange: (employee: Employee | undefined) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

export function EmployeeCombobox({
  value,
  onChange,
  placeholder,
  allLabel,
  className,
}: Props) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim());

  const { data, isFetching } = useEmployeeSearch(debounced);
  const results = data?.data ?? [];

  const label = value
    ? `${value.firstName} ${value.lastName}`
    : (allLabel ?? placeholder ?? '');

  const select = (employee: Employee | undefined) => {
    onChange(employee);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-10 w-64 justify-between font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('searchEmployee')}
          />
          <CommandList>
            {!isFetching && <CommandEmpty>{t('noEmployees')}</CommandEmpty>}
            <CommandGroup>
              {allLabel && (
                <CommandItem value="__all__" onSelect={() => select(undefined)}>
                  <Check
                    className={cn('size-4', value ? 'opacity-0' : 'opacity-100')}
                  />
                  {allLabel}
                </CommandItem>
              )}
              {results.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id}
                  onSelect={() => select(employee)}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value?.id === employee.id ? 'opacity-100' : 'opacity-0',
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
