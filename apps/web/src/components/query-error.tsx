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
  const t = useTranslations('common');
  return (
    <Alert variant="destructive">
      <AlertTitle>{t('error')}</AlertTitle>
      <AlertDescription>{t('errorBody')}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      </AlertAction>
    </Alert>
  );
}
