import { XIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import { useMediaQuery } from '@/lib/useMediaQuery';

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    hideTitle?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    /** Desktop width of the centered panel. */
    width?: 'md' | 'lg';
};

/**
 * Bottom sheet on phones, centered panel from 768px.
 * Built on the native <dialog> so focus containment, Escape and inert background come from the browser.
 */
export function Sheet(props: SheetProps) {
    return <AnimatePresence>{props.open && <SheetDialog key="sheet" {...props} />}</AnimatePresence>;
}

function SheetDialog({ onClose, title, hideTitle = false, children, footer, width = 'md' }: SheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const reduce = useReducedMotion();
    const desktop = useMediaQuery('(min-width: 768px)');
    const dragControls = useDragControls();

    useEffect(() => {
        const dialog = dialogRef.current;
        const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflow;
            returnFocusTo?.focus({ preventScroll: true });
        };
    }, []);

    const onDragEnd = (_: PointerEvent, info: PanInfo) => {
        if (info.offset.y > 120 || info.velocity.y > 700) {
            onClose();
        }
    };

    const panelMotion = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : desktop
          ? {
                initial: { opacity: 0, scale: 0.96 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.97, transition: { duration: duration.exit, ease: ease.out } },
            }
          : {
                initial: { y: '100%' },
                animate: { y: 0 },
                exit: { y: '100%', transition: { duration: 0.26, ease: ease.drawer } },
            };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className="fixed inset-0 m-0 flex h-dvh max-h-none w-full max-w-none items-end overflow-hidden bg-transparent p-0 backdrop:bg-transparent md:items-center md:justify-center md:p-6"
        >
            <motion.div
                aria-hidden
                className="absolute inset-0 bg-ink/55"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.exit } }}
                transition={{ duration: duration.base, ease: ease.out }}
            />
            <motion.div
                {...panelMotion}
                transition={{ duration: desktop ? duration.base : duration.sheet, ease: desktop ? ease.out : ease.drawer }}
                drag={desktop || reduce ? false : 'y'}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={onDragEnd}
                className={cn(
                    'relative flex max-h-[92dvh] w-full flex-col rounded-t-(--radius-panel) border-t-4 border-amber bg-panel text-ink shadow-(--shadow-sheet) md:max-h-[88dvh] md:rounded-(--radius-panel) md:border-t-0 md:shadow-(--shadow-lift)',
                    width === 'lg' ? 'md:max-w-2xl' : 'md:max-w-xl',
                )}
            >
                {/* Grab area for drag-to-dismiss on touch; the close button is the keyboard and pointer path. */}
                <div
                    className="flex h-5 shrink-0 touch-none items-center justify-center md:hidden"
                    onPointerDown={(event) => dragControls.start(event)}
                    aria-hidden
                >
                    <span className="h-1 w-10 bg-rule-strong" />
                </div>
                <div className={cn('flex shrink-0 items-start justify-between gap-4 px-5 md:px-6', hideTitle ? 'absolute inset-x-0 top-0 z-10 pt-2 md:pt-3' : 'pt-1 pb-3 md:pt-5')}>
                    <h2 id={titleId} className={cn('text-2xl font-bold text-ink', hideTitle && 'sr-only')}>
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={cn(
                            'ml-auto grid size-11 shrink-0 place-items-center rounded-(--radius-control) transition-[transform,background-color] duration-150 ease-out hover:scale-110 active:scale-90',
                            hideTitle ? 'bg-panel text-ink shadow-(--shadow-lift) hover:bg-ground' : 'hover:bg-rule/70',
                        )}
                        aria-label="Tutup"
                    >
                        <XIcon size={20} weight="bold" aria-hidden />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer && <div className="shrink-0 border-t border-rule bg-panel px-5 pt-3 pb-safe md:px-6 md:pb-5">{footer}</div>}
            </motion.div>
        </dialog>
    );
}
