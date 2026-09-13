import { ForkKnifeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { cn, imageSrc, imageSrcSet } from '@/lib/format';

type FoodImageProps = {
    url: string | null;
    /** Empty string when the dish name is already next to the image. */
    alt: string;
    sizes: string;
    className?: string;
    priority?: boolean;
};

export function FoodImage({ url, alt, sizes, className, priority = false }: FoodImageProps) {
    const [failed, setFailed] = useState(false);

    if (!url || failed) {
        return (
            <div
                className={cn('flex items-center justify-center bg-amber-tint text-amber-deep', className)}
                role={alt ? 'img' : undefined}
                aria-label={alt || undefined}
                aria-hidden={alt ? undefined : true}
            >
                <ForkKnifeIcon size={28} weight="bold" aria-hidden />
            </div>
        );
    }

    return (
        <img
            src={imageSrc(url, 720)}
            srcSet={imageSrcSet(url)}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setFailed(true)}
            className={cn('bg-rule object-cover', className)}
        />
    );
}
