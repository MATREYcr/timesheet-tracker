'use client';

import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function QueryError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert variant="destructive">
      <AlertTitle>{t('common.error')}</AlertTitle>
      <AlertDescription>{t('common.errorBody')}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </AlertAction>
    </Alert>
  );
}
