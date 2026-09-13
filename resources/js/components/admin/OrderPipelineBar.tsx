import { motion, useReducedMotion } from 'framer-motion';
import { DigitDisplay } from '@/components/DigitDisplay';
import { cn } from '@/lib/format';
import { ease } from '@/lib/motion';

type PipelineStats = { pending: number; preparing: number; ready: number; completed: number };

type Segment = { key: string; label: string; count: number; bar: string };

/** Today's orders as one bar, split by where each stands right now — proportion at a glance, exact counts in the legend below. */
export function OrderPipelineBar({ stats }: { stats: PipelineStats }) {
    const reduce = useReducedMotion();

    const segments: Segment[] = [
        { key: 'pending', label: 'Baru', count: stats.pending, bar: 'bg-amber' },
        { key: 'preparing', label: 'Di dapur', count: stats.preparing, bar: 'bg-ink' },
        { key: 'ready', label: 'Siap diambil', count: stats.ready, bar: 'bg-leaf' },
        { key: 'completed', label: 'Selesai', count: stats.completed, bar: 'bg-rule-strong' },
    ];
    const total = segments.reduce((sum, segment) => sum + segment.count, 0);

    if (total === 0) {
        return null;
    }

    return (
        <div className="rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5">
            <h3 className="font-heading text-lg font-extrabold text-ink">Kedudukan pesanan hari ini</h3>

            <div
                role="img"
                aria-label={segments.map((segment) => `${segment.label}: ${segment.count}`).join(', ')}
                className="mt-4 flex h-4 overflow-hidden rounded-(--radius-module) bg-ground"
            >
                {segments.map(
                    (segment, index) =>
                        segment.count > 0 && (
                            <motion.div
                                key={segment.key}
                                className={cn(segment.bar, index > 0 && 'border-l-2 border-panel')}
                                initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                style={{ width: `${(segment.count / total) * 100}%`, transformOrigin: 'left' }}
                                transition={{ duration: 0.55, delay: reduce ? 0 : index * 0.08, ease: ease.out }}
                            />
                        ),
                )}
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                {segments.map((segment) => (
                    <li key={segment.key} className="flex items-center justify-between gap-2 text-[15px]">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className={cn('size-2.5 shrink-0 rounded-full', segment.bar)} aria-hidden />
                            <span className="truncate font-semibold text-ink-soft">{segment.label}</span>
                        </span>
                        <DigitDisplay value={String(segment.count)} chip={false} tone="ink" size="xs" />
                    </li>
                ))}
            </ul>
        </div>
    );
}
