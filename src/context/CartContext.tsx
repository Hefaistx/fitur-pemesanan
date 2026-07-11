'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  qty: number;
  categoryName?: string | null;
  imageUrl?: string | null;
}

interface CartState {
  storeId: number | null;
  storeSlug: string | null;
  storeName: string | null;
  waNumber: string | null;
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; payload: Omit<CartItem, 'qty'> & { storeId: number; storeSlug: string; storeName: string; waNumber: string } }
  | { type: 'REMOVE'; menuItemId: number }
  | { type: 'SET_QTY'; menuItemId: number; qty: number }
  | { type: 'CLEAR' };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const { storeId, storeSlug, storeName, waNumber, ...item } = action.payload;
      if (state.storeId && state.storeId !== storeId) {
        // ganti toko → reset cart
        return { storeId, storeSlug, storeName, waNumber, items: [{ ...item, qty: 1 }] };
      }
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return {
          ...state,
          storeId,
          storeSlug,
          storeName,
          waNumber,
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, storeId, storeSlug, storeName, waNumber, items: [...state.items, { ...item, qty: 1 }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.menuItemId !== action.menuItemId) };
    case 'SET_QTY':
      if (action.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.menuItemId !== action.menuItemId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, qty: action.qty } : i
        ),
      };
    case 'CLEAR':
      return { storeId: null, storeSlug: null, storeName: null, waNumber: null, items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalAmount: number;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    storeId: null,
    storeSlug: null,
    storeName: null,
    waNumber: null,
    items: [],
  });

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const totalAmount = state.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
