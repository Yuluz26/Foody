import type { ReactNode } from 'react';

/** A settings group: its name and a line of help on the left, the fields on the right, all on one raised card. */
export function FormPanel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    const id = title.toLowerCase().replace(/\s+/g, '-');

    return (
        <section aria-labelledby={id} className="neu-card grid gap-5 p-5 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div>
                <h2 id={id} className="font-heading text-xl font-extrabold text-ink">
                    {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>
            <div className="grid content-start gap-5">{children}</div>
        </section>
    );
}
