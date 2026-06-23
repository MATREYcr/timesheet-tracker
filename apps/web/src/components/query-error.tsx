'use client';

import { useTranslations } from 'next-intl';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function QueryError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();
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
