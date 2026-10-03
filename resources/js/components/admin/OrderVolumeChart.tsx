import { ChartBarIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { ease } from '@/lib/motion';
import type { HourlyPoint } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';

const CHART_HEIGHT = 128;
const BAR_MIN_HEIGHT = 2;

function hourLabel(hour: number, withPeriod = true): string {
    const period = hour < 12 ? 'pg' : hour < 18 ? 'ptg' : 'mlm';
    const display = hour % 12 === 0 ? 12 : hour % 12;

    return withPeriod ? `${display}${period}` : String(display);
}

/** Today's order count per hour — an amber bar per hour, growing in on load, with a hover readout per bar. */
export function OrderVolumeChart({ hourly }: { hourly: HourlyPoint[] }) {
    const reduce = useReducedMotion();
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(1, ...hourly.map((point) => point.count));
    const total = hourly.reduce((sum, point) => sum + point.count, 0);

    // Label every hour when there's room to breathe, thinning out as the row gets crowded.
    const labelEvery = hourly.length <= 8 ? 1 : hourly.length <= 14 ? 2 : 3;

    if (total === 0) {
        return (
            <EmptyState centered Icon={ChartBarIcon} title="Belum ada pesanan hari ini untuk carta ini." />
        );
    }

    return (
        <div className="neu-card p-5">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-lg font-extrabold text-ink">Aliran pesanan hari ini</h3>
                <p className="text-sm text-ink-muted">mengikut jam</p>
            </div>

            <div className="neu-well-sm mt-5 px-3 pt-4 pb-2.5">
            <div className="flex items-end gap-2" role="img" aria-label={`Carta bar pesanan mengikut jam, jumlah ${total} pesanan hari ini.`} style={{ height: CHART_HEIGHT }}>
                {hourly.map((point, index) => {
                    const barHeight = point.count === 0 ? BAR_MIN_HEIGHT : Math.max(6, (point.count / max) * CHART_HEIGHT);
                    const isActive = active === point.hour;

                    return (
                        <div key={point.hour} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                            {isActive && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-(--radius-module) bg-ink px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-(--shadow-lift)">
                                    <span className="tabular">{point.count}</span> pesanan &middot; {hourLabel(point.hour)}
                                </div>
                            )}
                            <button
                                type="button"
                                aria-label={`${point.count} pesanan pada jam ${hourLabel(point.hour)}`}
                                onFocus={() => setActive(point.hour)}
                                onBlur={() => setActive(null)}
                                onMouseEnter={() => setActive(point.hour)}
                                onMouseLeave={() => setActive(null)}
                                className="flex w-full flex-col justify-end focus-visible:outline-none"
                                style={{ height: CHART_HEIGHT }}
                            >
                                <motion.span
                                    className={barClass(point.count > 0, isActive)}
                                    initial={reduce ? { opacity: 0 } : { scaleY: 0 }}
                                    animate={reduce ? { opacity: 1 } : { scaleY: 1 }}
                                    transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.02, ease: ease.out }}
                                    style={{ height: barHeight, transformOrigin: 'bottom' }}
                                />
                            </button>
                        </div>
                    );
                })}
            </div>
            <div className="mt-1.5 flex gap-2">
                {hourly.map((point, index) => (
                    <div key={point.hour} className="min-w-0 flex-1 text-center">
                        {index % labelEvery === 0 && <span className="text-[11px] font-semibold whitespace-nowrap text-ink-muted">{hourLabel(point.hour, false)}</span>}
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}

function barClass(hasValue: boolean, isActive: boolean): string {
    const base = 'block w-full rounded-t-md transition-colors duration-150';

    if (!hasValue) {
        return `${base} bg-rule-strong/60`;
    }

    return isActive ? `${base} bg-amber-deep` : `${base} bg-amber`;
}
