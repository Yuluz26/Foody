import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { imageSrc, imageSrcSet } from '@/lib/format';

type AuthSplitScreenProps = {
    imageUrl: string;
    imageAlt: string;
    /** Restaurant name — the small persistent brand mark in the corner, linking back to the menu. */
    brandName: string;
    homeHref: string;
    /** Big evocative headline over the photo, distinct from the brand mark so the two don't repeat. */
    heroTitle: string;
    heroSubtitle: string;
    children: ReactNode;
};

/**
 * Cinematic split-screen shared by the customer login/register pages: a full-height hawker-stall
 * photo carrying the restaurant identity on one side, the form on a warm cream panel on the
 * other. Stacks (photo on top, shorter) below `lg`, where a 50/50 side-by-side split would
 * otherwise squeeze the form unusably narrow.
 */
export function AuthSplitScreen({ imageUrl, imageAlt, brandName, homeHref, heroTitle, heroSubtitle, children }: AuthSplitScreenProps) {
    return (
        <div className="grid min-h-dvh bg-ground lg:grid-cols-2">
            <div className="relative h-[38vh] min-h-64 overflow-hidden lg:h-auto lg:min-h-dvh">
                <img
                    src={imageSrc(imageUrl, 1440)}
                    srcSet={imageSrcSet(imageUrl)}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    alt={imageAlt}
                    fetchPriority="high"
                    className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/10" aria-hidden />
                <Link href={homeHref} className="on-module absolute top-[max(1.25rem,env(safe-area-inset-top))] left-5 rounded-(--radius-control) lg:top-8 lg:left-10">
                    <span className="text-lg font-extrabold text-white drop-shadow-sm lg:text-xl">{brandName}</span>
                </Link>
                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
                    <p className="font-heading max-w-md text-3xl leading-[1.05] font-extrabold text-white lg:text-5xl">{heroTitle}</p>
                    <p className="mt-3 max-w-sm text-[15px] text-white/85 lg:text-base">{heroSubtitle}</p>
                </div>
            </div>

            <div className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
