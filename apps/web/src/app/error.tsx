'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{t('common.error')}</EmptyTitle>
        <EmptyDescription>{t('errorPage.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={reset}>{t('common.retry')}</Button>
      </EmptyContent>
    </Empty>
  );
}
