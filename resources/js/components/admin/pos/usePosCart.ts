import { useCallback, useMemo, useState } from 'react';
import type { AddOn, MenuProduct } from '@/types';

export type PosProduct = MenuProduct & { stockQuantity: number | null };

export type PosLine = {
    /** Same dish with different add-ons stays on separate lines, like the server groups them. */
    id: string;
    productId: number;
    name: string;
    imageUrl: string | null;
    price: number;
    quantity: number;
    addOns: AddOn[];
    /** Most the shelf can give for this dish, or null when the dish isn't counted. */
    limit: number | null;
};

const MAX_PER_LINE = 50;

const lineId = (productId: number, addOns: AddOn[]) => `${productId}:${addOns.map((addOn) => addOn.id).sort((a, b) => a - b).join(',')}`;

export const lineTotal = (line: PosLine): number => line.price * line.quantity + line.addOns.reduce((sum, addOn) => sum + addOn.price, 0);

/** The counter's basket. Lives only on this screen: a refresh starts a fresh order. */
export function usePosCart() {
    const [lines, setLines] = useState<PosLine[]>([]);

    /** Returns false when the shelf had nothing more to give, so the screen can say so. */
    const add = useCallback((product: PosProduct, quantity: number, addOns: AddOn[] = []): boolean => {
        const id = lineId(product.id, addOns);
        let accepted = true;

        setLines((current) => {
            const existing = current.find((line) => line.id === id);
            // Other lines of the same dish share the same shelf.
            const elsewhere = current.filter((line) => line.productId === product.id && line.id !== id).reduce((sum, line) => sum + line.quantity, 0);
            const cap = Math.min(MAX_PER_LINE, product.stockQuantity === null ? MAX_PER_LINE : Math.max(0, product.stockQuantity - elsewhere));
            const next = Math.min(cap, (existing?.quantity ?? 0) + quantity);

            accepted = next >= (existing?.quantity ?? 0) + quantity;

            if (next <= 0) {
                return current;
            }

            if (existing) {
                return current.map((line) => (line.id === id ? { ...line, quantity: next } : line));
            }

            return [...current, { id, productId: product.id, name: product.name, imageUrl: product.imageUrl, price: product.price, quantity: next, addOns, limit: product.stockQuantity }];
        });

        return accepted;
    }, []);

    const setQuantity = useCallback((id: string, quantity: number) => {
        setLines((current) =>
            current
                .map((line) => {
                    if (line.id !== id) {
                        return line;
                    }

                    const elsewhere = current.filter((other) => other.productId === line.productId && other.id !== id).reduce((sum, other) => sum + other.quantity, 0);
                    const cap = Math.min(MAX_PER_LINE, line.limit === null ? MAX_PER_LINE : Math.max(0, line.limit - elsewhere));

                    return { ...line, quantity: Math.min(cap, quantity) };
                })
                .filter((line) => line.quantity > 0),
        );
    }, []);

    const clear = useCallback(() => setLines([]), []);

    const totals = useMemo(
        () => ({
            count: lines.reduce((sum, line) => sum + line.quantity, 0),
            total: lines.reduce((sum, line) => sum + lineTotal(line), 0),
            countOf: (productId: number) => lines.filter((line) => line.productId === productId).reduce((sum, line) => sum + line.quantity, 0),
        }),
        [lines],
    );

    return { lines, add, setQuantity, clear, ...totals };
}
