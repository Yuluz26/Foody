import { DigitDisplay } from '@/components/DigitDisplay';
import { cn } from '@/lib/format';

export type Kpi = { label: string; value: string; highlight?: boolean };

/** Headline numbers as raised tiles, each reading through a glowing digit module. A lit tile means something needs attention. */
export function KpiGrid({ figures, phoneColumns = 2 }: { figures: Kpi[]; phoneColumns?: 1 | 2 }) {
    return (
        <dl className={cn('grid gap-4', figures.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3', phoneColumns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
            {figures.map((figure) => (
                <div key={figure.label} className={cn('neu-tile min-w-0 p-4 [--neu-radius:var(--radius-panel)]', figure.highlight && '[--neu-bg:var(--color-amber-tint)]')}>
                    <dt className="text-sm font-medium text-ink-soft">{figure.label}</dt>
                    <dd className="mt-2.5">
                        <DigitDisplay value={figure.value} size="kpi" />
                    </dd>
                </div>
            ))}
        </dl>
    );
}
