import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { CartProvider } from '@/cart/CartProvider';
import { ToastProvider } from '@/components/Toaster';

type CustomerLayoutProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

export function CustomerLayout({ title, description, children }: CustomerLayoutProps) {
    return (
        <CartProvider>
            <ToastProvider>
                <Head>
                    <title>{title}</title>
                    {description && <meta head-key="description" name="description" content={description} />}
                    {description && <meta head-key="og:description" property="og:description" content={description} />}
                    <meta head-key="og:title" property="og:title" content={title} />
                </Head>
                <a
                    href="#kandungan"
                    className="sr-only z-60 rounded-(--radius-control) bg-ink px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
                >
                    Langkau ke kandungan
                </a>
                {children}
            </ToastProvider>
        </CartProvider>
    );
}
