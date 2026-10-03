import { cn } from '@/lib/format';

type Tab = { value: string; label: string };

type SegmentedTabsProps = {
    tabs: Tab[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    className?: string;
};

/** Filter tabs as a segmented control: a pressed-in track, with the chosen tab raised out of it. */
export function SegmentedTabs({ tabs, value, onChange, label, className }: SegmentedTabsProps) {
    return (
        <div role="tablist" aria-label={label} className={cn('neu-well-sm max-w-full', className)}>
            <div className="no-scrollbar flex gap-1 overflow-x-auto p-2">
                {tabs.map((tab) => {
                    const selected = tab.value === value;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => onChange(tab.value)}
                            className={cn(
                                'h-10 shrink-0 rounded-(--radius-control) px-3.5 font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-200',
                                selected ? 'bg-panel text-ink shadow-(--shadow-raised-2xs)' : 'text-ink-soft hover:text-ink',
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
