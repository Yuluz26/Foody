import { ChartLineUpIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useId, useState } from 'react';
import { cn, formatPrice, priceDigits } from '@/lib/format';
import { ease } from '@/lib/motion';
import { DigitDisplay } from '@/components/DigitDisplay';

export type TrendPoint = { label: string; count: number; revenue: number };

type Metric = 'count' | 'revenue';

const PAD_TOP = 12;
const PAD_BOTTOM = 10;
const CHART_HEIGHT = 200;

/** Catmull-Rom to cubic-Bezier conversion — a curve that passes through every point, not just near it. */
function smoothPath(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) {
        return '';
    }

    if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
}

/** Completed-order trend, count or revenue, as a smooth filled line — the period (day/week/month/year) comes from the caller since that's a server-side re-fetch; the count/revenue toggle stays client-side. */
export function CompletedOrdersChart({ trend }: { trend: TrendPoint[] }) {
    const reduce = useReducedMotion();
    const gradientId = useId();
    const [metric, setMetric] = useState<Metric>('count');
    const [active, setActive] = useState<number | null>(null);

    const values = trend.map((point) => point[metric]);
    const max = Math.max(1, ...values);
    const total = values.reduce((sum, value) => sum + value, 0);
    const baselineY = 100 - PAD_BOTTOM;

    const points = trend.map((point, index) => ({
        x: ((index + 0.5) / trend.length) * 100,
        y: total === 0 ? baselineY : baselineY - (point[metric] / max) * (100 - PAD_TOP - PAD_BOTTOM),
    }));

    const linePath = smoothPath(points);
    const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z` : '';

    const labelEvery = trend.length <= 7 ? 1 : trend.length <= 14 ? 2 : Math.ceil(trend.length / 8);

    return (
        <div className="rounded-(--radius-panel) border-2 border-rule-strong bg-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-heading text-lg font-extrabold text-ink">Pesanan selesai</h3>
                    <p className="text-sm text-ink-muted">
                        {metric === 'count' ? `${total} pesanan dalam tempoh ini` : `${formatPrice(total)} jualan dalam tempoh ini`}
                    </p>
                </div>
                <div role="tablist" aria-label="Papar mengikut" className="flex gap-0.5 rounded-(--radius-control) border-2 border-rule-strong bg-ground p-0.5">
                    {(['count', 'revenue'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="tab"
                            aria-selected={metric === option}
                            onClick={() => setMetric(option)}
                            className={cn(
                                'h-9 rounded-(--radius-module) px-3 text-sm font-semibold transition-colors duration-150',
                                metric === option ? 'bg-amber text-ink' : 'text-ink-soft hover:text-ink',
                            )}
                        >
                            {option === 'count' ? 'Pesanan' : 'Jualan'}
                        </button>
                    ))}
                </div>
            </div>

            {total === 0 ? (
                <div className="mt-6 grid place-items-center gap-2 rounded-(--radius-panel) border-2 border-dashed border-rule-strong py-10 text-center">
                    <ChartLineUpIcon size={28} weight="bold" className="text-rule-strong" aria-hidden />
                    <p className="text-[15px] text-ink-muted">Tiada pesanan selesai dalam tempoh ini.</p>
                </div>
            ) : (
                <>
                    <div className="relative mt-6" style={{ height: CHART_HEIGHT }} role="img" aria-label={`Carta aliran ${metric === 'count' ? 'bilangan' : 'jualan'} pesanan selesai, jumlah ${metric === 'count' ? `${total} pesanan` : formatPrice(total)}.`}>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" style={{ stopColor: 'var(--color-amber)', stopOpacity: 0.35 }} />
                                    <stop offset="100%" style={{ stopColor: 'var(--color-amber)', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                            {[0.25, 0.5, 0.75].map((fraction) => (
                                <line
                                    key={fraction}
                                    x1={0}
                                    x2={100}
                                    y1={PAD_TOP + fraction * (100 - PAD_TOP - PAD_BOTTOM)}
                                    y2={PAD_TOP + fraction * (100 - PAD_TOP - PAD_BOTTOM)}
                                    stroke="var(--color-rule)"
                                    strokeWidth={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}
                            <motion.g initial={reduce ? { opacity: 0 } : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: ease.out }}>
                                <path d={areaPath} fill={`url(#${gradientId})`} />
                                <path d={linePath} fill="none" stroke="var(--color-amber-deep)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            </motion.g>
                        </svg>

                        <div className="absolute inset-0 flex">
                            {trend.map((point, index) => {
                                const isActive = active === index;
                                const value = point[metric];

                                return (
                                    <button
                                        key={point.label + index}
                                        type="button"
                                        className="relative h-full min-w-0 flex-1 focus-visible:outline-none"
                                        onMouseEnter={() => setActive(index)}
                                        onMouseLeave={() => setActive(null)}
                                        onFocus={() => setActive(index)}
                                        onBlur={() => setActive(null)}
                                        aria-label={`${point.label}: ${metric === 'count' ? `${value} pesanan` : formatPrice(value)}`}
                                    >
                                        <span
                                            className={cn(
                                                'absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel transition-transform duration-150',
                                                isActive ? 'scale-125 bg-amber-deep' : 'bg-amber',
                                            )}
                                            style={{ left: '50%', top: `${points[index].y}%` }}
                                        />
                                        {isActive && (
                                            <div
                                                className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-(--radius-module) bg-ink px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-(--shadow-lift)"
                                                style={{ left: '50%', top: `calc(${points[index].y}% - 2.75rem)` }}
                                            >
                                                <span className="tabular">{metric === 'count' ? value : formatPrice(value)}</span> &middot; {point.label}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-1.5 flex gap-2">
                        {trend.map((point, index) => (
                            <div key={point.label + index} className="min-w-0 flex-1 text-center">
                                {index % labelEvery === 0 && <span className="text-[11px] font-semibold whitespace-nowrap text-ink-muted">{point.label}</span>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/** Compact readout row for the three headline numbers above the chart. */
export function TrendSummary({ trend }: { trend: TrendPoint[] }) {
    const count = trend.reduce((sum, point) => sum + point.count, 0);
    const revenue = trend.reduce((sum, point) => sum + point.revenue, 0);
    const average = count > 0 ? Math.round(revenue / count) : null;

    const figures = [
        { label: 'Pesanan selesai', value: String(count) },
        { label: 'Jualan', value: priceDigits(revenue) },
        { label: 'Purata pesanan', value: average !== null ? priceDigits(average) : '—' },
    ];

    return (
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-(--radius-panel) border-2 border-rule-strong bg-rule">
            {figures.map((figure) => (
                <div key={figure.label} className="bg-panel px-4 py-4">
                    <dt className="text-sm font-medium text-ink-muted">{figure.label}</dt>
                    <dd className="mt-1.5">
                        <DigitDisplay value={figure.value} chip={false} size="lg" />
                    </dd>
                </div>
            ))}
        </dl>
    );
}
