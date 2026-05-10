import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../services/productService';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await productService.getProducts(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch products');
  }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return await productService.getProduct(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Product not found');
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    return await productService.getCategories();
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch categories');
  }
});

export const createProduct = createAsyncThunk('products/create', async (data, { rejectWithValue }) => {
  try {
    return await productService.createProduct(data);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await productService.deleteProduct(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete product');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    categories: [],
    total: 0,
    page: 1,
    pages: 1,
    loading: false,
    error: null,
    filters: { category: '', search: '', sort: '', page: 1 },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentProduct(state) {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchProduct.pending, (state) => { state.loading = true; })
      .addCase(fetchProduct.fulfilled, (state, action) => { state.loading = false; state.currentProduct = action.payload; })
      .addCase(fetchProduct.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })

      .addCase(createProduct.fulfilled, (state, action) => { state.items.unshift(action.payload); })

      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      });
  },
});

export const { setFilters, clearCurrentProduct } = productSlice.actions;

export const selectProducts = (state) => state.products.items;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectCategories = (state) => state.products.categories;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsMeta = (state) => ({
  total: state.products.total,
  page: state.products.page,
  pages: state.products.pages,
});

export default productSlice.reducer;
