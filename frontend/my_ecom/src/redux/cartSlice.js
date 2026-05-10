import { createSlice } from '@reduxjs/toolkit';

const loadCartFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
    shippingAddress: JSON.parse(localStorage.getItem('shippingAddress') || 'null'),
    orderStatuses: {},
  },
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, product.stock || 99);
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
      saveCartToStorage(state.items);
    },

    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i._id !== action.payload);
      saveCartToStorage(state.items);
    },

    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i._id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      saveCartToStorage(state.items);
    },

    clearCart(state) {
      state.items = [];
      localStorage.removeItem('cart');
    },

    saveShippingAddress(state, action) {
      state.shippingAddress = action.payload;
      localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
    },

    updateOrderStatus(state, action) {
      const { orderId, status } = action.payload;
      state.orderStatuses[orderId] = status;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  saveShippingAddress,
  updateOrderStatus,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectShippingAddress = (state) => state.cart.shippingAddress;

export default cartSlice.reducer;
