import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../redux/productSlice';
import { addNotification } from '../../redux/userSlice';
import styles from './AddProduct.module.css';

const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home & Kitchen', 'Sports', 'Beauty', 'Toys', 'Grocery', 'Other'];

export default function AddProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', stock: '', images: [''],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageChange = (i, value) => {
    const images = [...form.images];
    images[i] = value;
    setForm((f) => ({ ...f, images }));
  };

  const addImageField = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));
  const removeImageField = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) {
      dispatch(addNotification({ type: 'error', message: 'Please fill all required fields' }));
      return;
    }
    setLoading(true);
    try {
      const productData = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        images: form.images.filter((img) => img.trim()),
      };
      await dispatch(createProduct(productData)).unwrap();
      dispatch(addNotification({ type: 'success', message: 'Product created successfully!' }));
      navigate('/products');
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err || 'Failed to create product' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Add New Product</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Product Name *</label>
              <input name="name" className={styles.input} value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" required />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Category *</label>
              <select name="category" className={styles.input} value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Price (₹) *</label>
              <input name="price" type="number" min="0" step="0.01" className={styles.input} value={form.price} onChange={handleChange} placeholder="999.00" required />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Stock</label>
              <input name="stock" type="number" min="0" className={styles.input} value={form.stock} onChange={handleChange} placeholder="100" />
            </div>
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Description *</label>
            <textarea name="description" className={`${styles.input} ${styles.textarea}`} value={form.description} onChange={handleChange} placeholder="Describe the product..." rows={4} required />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Image URLs</label>
            {form.images.map((img, i) => (
              <div key={i} className={styles.imageRow}>
                <input
                  className={styles.input}
                  value={img}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {form.images.length > 1 && (
                  <button type="button" className={styles.removeImg} onClick={() => removeImageField(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addImgBtn} onClick={addImageField}>+ Add another image</button>
          </div>

          {/* Preview */}
          {form.images[0] && (
            <div className={styles.preview}>
              <label className={styles.label}>Preview</label>
              <img src={form.images[0]} alt="preview" className={styles.previewImg} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={() => navigate('/products')}>Cancel</button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
