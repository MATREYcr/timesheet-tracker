'use client';

import { EMPLOYEE_STATUS, type Employee } from '@timesheet/shared';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  employees: Employee[];
  value?: string;
  onChange: (employeeId: string) => void;
}

export function EmployeeSelect({ employees, value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('timeEntries.selectEmployee')} />
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.firstName} {employee.lastName}
            {employee.status === EMPLOYEE_STATUS.inactive && (
              <span className="text-muted-foreground">
                {' · '}
                {t('employees.status.inactive')}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
