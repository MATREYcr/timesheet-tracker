import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Mini Timesheets</h1>
      <p className="text-muted-foreground mt-2">
        Track hourly employees, log time, and approve weeks.
      </p>
      <nav className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/employees">Employees</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/time-entries">Time entries</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/weekly-summary">Weekly summary</Link>
        </Button>
      </nav>
    </main>
  );
}
