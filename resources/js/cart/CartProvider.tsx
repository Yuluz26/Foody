import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

export type CartAddOn = {
    id: number;
    name: string;
    price: number;
};

export type CartLine = {
    /** Identifies one distinct combination of product + add-ons, so the same dish with different add-ons keeps separate lines. */
    id: string;
    productId: number;
    name: string;
    price: number;
    imageUrl: string | null;
    addOns: CartAddOn[];
    quantity: number;
};

type Action =
    | { type: 'add'; line: Omit<CartLine, 'quantity' | 'id'>; quantity: number }
    | { type: 'set'; lineId: string; quantity: number }
    | { type: 'remove'; lineId: string }
    | { type: 'replace'; lines: CartLine[] }
    | { type: 'clear' };

// Bumped from v1: lines now carry an add-ons selection and a composite id, a shape older stored carts don't have.
const STORAGE_KEY = 'foody.cart.v2';
export const MAX_QUANTITY = 50;

const clamp = (quantity: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.round(quantity)));

/** One cart line per distinct product + add-ons combination. */
export function cartLineId(productId: number, addOns: Array<{ id: number }>): string {
    const addOnIds = addOns
        .map((addOn) => addOn.id)
        .sort((a, b) => a - b);

    return `${productId}:${addOnIds.join(',')}`;
}

function reducer(lines: CartLine[], action: Action): CartLine[] {
    switch (action.type) {
        case 'add': {
            const id = cartLineId(action.line.productId, action.line.addOns);
            const existing = lines.find((line) => line.id === id);

            if (existing) {
                return lines.map((line) => (line.id === id ? { ...line, ...action.line, id, quantity: clamp(line.quantity + action.quantity) } : line));
            }

            return [...lines, { ...action.line, id, quantity: clamp(action.quantity) }];
        }
        case 'set':
            return lines
                .map((line) => (line.id === action.lineId ? { ...line, quantity: clamp(action.quantity) } : line))
                .filter((line) => line.quantity > 0);
        case 'remove':
            return lines.filter((line) => line.id !== action.lineId);
        case 'replace':
            return action.lines;
        case 'clear':
            return [];
    }
}

function isCartAddOn(value: unknown): value is CartAddOn {
    const addOn = value as CartAddOn;

    return typeof addOn === 'object' && addOn !== null && Number.isInteger(addOn.id) && typeof addOn.name === 'string' && Number.isInteger(addOn.price);
}

function isCartLine(value: unknown): value is CartLine {
    const line = value as CartLine;

    return (
        typeof line === 'object' &&
        line !== null &&
        typeof line.id === 'string' &&
        Number.isInteger(line.productId) &&
        typeof line.name === 'string' &&
        Number.isInteger(line.price) &&
        Array.isArray(line.addOns) &&
        line.addOns.every(isCartAddOn) &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
    );
}

/** Storage can be unavailable (private mode, blocked site data); the cart then lives in memory only. */
function readStorage(): CartLine[] {
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');

        return Array.isArray(parsed) ? parsed.filter(isCartLine).map((line) => ({ ...line, quantity: clamp(line.quantity) })) : [];
    } catch {
        return [];
    }
}

type CartContextValue = {
    lines: CartLine[];
    count: number;
    subtotal: number;
    add: (line: Omit<CartLine, 'quantity' | 'id'>, quantity?: number) => void;
    setQuantity: (lineId: string, quantity: number) => void;
    remove: (lineId: string) => void;
    replace: (lines: CartLine[]) => void;
    clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, dispatch] = useReducer(reducer, [], readStorage);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        } catch {
            // Ignore: the cart still works for this page view.
        }
    }, [lines]);

    // Keep several open tabs in step.
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) {
                dispatch({ type: 'replace', lines: readStorage() });
            }
        };

        window.addEventListener('storage', onStorage);

        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Add-ons are a flat charge for the line, not per unit: 2x a dish with one add-on
    // costs (price x 2) + add-on, not (price + add-on) x 2.
    const lineTotal = (line: CartLine) => line.price * line.quantity + line.addOns.reduce((sum, addOn) => sum + addOn.price, 0);

    const value = useMemo<CartContextValue>(
        () => ({
            lines,
            count: lines.reduce((total, line) => total + line.quantity, 0),
            subtotal: lines.reduce((total, line) => total + lineTotal(line), 0),
            add: (line, quantity = 1) => dispatch({ type: 'add', line, quantity }),
            setQuantity: (lineId, quantity) => dispatch({ type: 'set', lineId, quantity }),
            remove: (lineId) => dispatch({ type: 'remove', lineId }),
            replace: (next) => dispatch({ type: 'replace', lines: next }),
            clear: () => dispatch({ type: 'clear' }),
        }),
        [lines],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside <CartProvider>.');
    }

    return context;
}
