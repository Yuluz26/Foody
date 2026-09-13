import { Head } from '@inertiajs/react';
import { DigitDisplay } from '@/components/DigitDisplay';

const COPY: Record<number, { title: string; body: string }> = {
    403: { title: 'Akses tidak dibenarkan', body: 'Halaman ini hanya untuk kakitangan kedai. Log masuk dengan akaun admin untuk meneruskan.' },
    404: { title: 'Halaman tidak dijumpai', body: 'Pautan mungkin tersilap atau sudah tidak digunakan. Semak semula pautan, atau kembali ke menu.' },
    500: { title: 'Ada masalah di pihak kami', body: 'Sila muat semula halaman dalam beberapa saat. Jika masih berlaku, hubungi kedai.' },
    503: { title: 'Sedang diselenggara', body: 'Kami sedang membuat kerja penyelenggaraan dan akan kembali sebentar lagi.' },
};

export default function ErrorPage({ status }: { status: number }) {
    const copy = COPY[status] ?? COPY[500];

    return (
        <>
            <Head title={copy.title} />
            <main id="kandungan" className="grid min-h-dvh place-items-center bg-ground px-5 py-16">
                <div className="w-full max-w-md rounded-(--radius-panel) border-2 border-rule-strong bg-panel shadow-(--shadow-lift)">
                    <div className="rounded-t-(--radius-panel) bg-module px-7 pt-6 pb-5">
                        <DigitDisplay value={String(status)} size="xl" label={`Ralat ${status}`} />
                    </div>
                    <div className="p-7">
                        <h1 className="text-3xl font-extrabold text-balance text-ink">{copy.title}</h1>
                        <p className="mt-2 text-base text-ink-soft">{copy.body}</p>
                        {/* A full page load leaves the error context cleanly. */}
                        <a
                            href="/"
                            className="mt-6 inline-flex h-12 items-center rounded-(--radius-control) bg-ink px-5 font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-ink-soft active:scale-[0.97]"
                        >
                            Kembali ke menu
                        </a>
                    </div>
                </div>
            </main>
        </>
    );
}
