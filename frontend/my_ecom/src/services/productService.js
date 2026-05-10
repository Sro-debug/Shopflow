import api from './api';

const productService = {
  async getProducts(params = {}) {
    const { data } = await api.get('/products', { params });
    return data;
  },

  async getProduct(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  async getCategories() {
    const { data } = await api.get('/products/meta/categories');
    return data;
  },

  async createProduct(productData) {
    const { data } = await api.post('/products', productData);
    return data;
  },

  async updateProduct(id, updates) {
    const { data } = await api.put(`/products/${id}`, updates);
    return data;
  },

  async deleteProduct(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

export default productService;
