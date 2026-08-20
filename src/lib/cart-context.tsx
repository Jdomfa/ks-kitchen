'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Product } from './store-data';

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = { lines: CartLine[] };

type CartAction =
  | { type: 'ADD'; product: Product; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'SET_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; lines: CartLine[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.lines.find(
        (l) => l.productId === action.product.id,
      );
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.productId === action.product.id
              ? { ...l, quantity: l.quantity + action.quantity }
              : l,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            productId: action.product.id,
            slug: action.product.slug,
            name: action.product.name,
            price: action.product.price,
            image: action.product.image,
            quantity: action.quantity,
          },
        ],
      };
    }
    case 'REMOVE':
      return {
        lines: state.lines.filter((l) => l.productId !== action.productId),
      };
    case 'SET_QUANTITY':
      if (action.quantity <= 0) {
        return {
          lines: state.lines.filter((l) => l.productId !== action.productId),
        };
      }
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId
            ? { ...l, quantity: action.quantity }
            : l,
        ),
      };
    case 'CLEAR':
      return { lines: [] };
    case 'HYDRATE':
      return { lines: action.lines };
    default:
      return state;
  }
}

type CartContextValue = {
  lines: CartLine[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'ks-kitchen-store-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });

  // Hydrate from localStorage on mount (client-only — cart state can't
  // be known during SSR, so this intentionally runs after first render).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const lines = JSON.parse(raw) as CartLine[];
        dispatch({ type: 'HYDRATE', lines });
      }
    } catch {
      // Corrupt or inaccessible storage — start with an empty cart.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage unavailable (private browsing, quota, etc.) — cart still
      // works for the session, it just won't survive a reload.
    }
  }, [state.lines]);

  const addToCart = (product: Product, quantity = 1) =>
    dispatch({ type: 'ADD', product, quantity });
  const removeFromCart = (productId: string) =>
    dispatch({ type: 'REMOVE', productId });
  const setQuantity = (productId: string, quantity: number) =>
    dispatch({ type: 'SET_QUANTITY', productId, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const subtotal = useMemo(
    () => state.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [state.lines],
  );
  const itemCount = useMemo(
    () => state.lines.reduce((sum, l) => sum + l.quantity, 0),
    [state.lines],
  );

  return (
    <CartContext.Provider
      value={{
        lines: state.lines,
        addToCart,
        removeFromCart,
        setQuantity,
        clearCart,
        subtotal,
        count: itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
