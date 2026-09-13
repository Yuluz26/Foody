import { CheckIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { duration, ease } from '@/lib/motion';

type Toast = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const reduce = useReducedMotion();

    const show = useCallback((message: string) => {
        window.clearTimeout(timer.current);
        setToast({ id: Date.now(), message });
        timer.current = window.setTimeout(() => setToast(null), 2600);
    }, []);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            {/* Polite live region: announces without stealing focus. Sits above the mobile cart strip. */}
            <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
                <AnimatePresence initial={false}>
                    {toast && (
                        <motion.p
                            key={toast.id}
                            className="flex items-center gap-2 rounded-(--radius-control) bg-ink px-4 py-3 text-[15px] font-medium text-white shadow-(--shadow-lift)"
                            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(16px)' }}
                            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(16px)' }}
                            transition={{ duration: duration.base, ease: ease.out }}
                        >
                            <CheckIcon size={18} weight="bold" className="text-amber" aria-hidden />
                            {toast.message}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): (message: string) => void {
    return useContext(ToastContext);
}
