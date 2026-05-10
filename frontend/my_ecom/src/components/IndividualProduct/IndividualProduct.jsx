import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct, selectCurrentProduct, selectProductsLoading } from '../../redux/productSlice';
import { addToCart } from '../../redux/cartSlice';
import { selectIsAuth } from '../../redux/userSlice';
import styles from './IndividualProduct.module.css';

export default function IndividualProduct() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const product = useSelector(selectCurrentProduct);
  const loading = useSelector(selectProductsLoading);
  const isAuth = useSelector(selectIsAuth);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => { dispatch(fetchProduct(id)); }, [dispatch, id]);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) dispatch(addToCart(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isAuth) return navigate('/login');
    handleAddToCart();
    navigate('/cart');
  };

  if (loading || !product) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonWrap}>
          <div className={styles.skeletonImg} />
          <div className={styles.skeletonInfo}>
            {[80, 40, 60, 100].map((w, i) => <div key={i} className={styles.skeletonLine} style={{ width: `${w}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Images */}
        <div className={styles.images}>
          <div className={styles.mainImg}>
            {product.images?.[selectedImg]
              ? <img src={product.images[selectedImg]} alt={product.name} />
              : <span className={styles.imgPlaceholder}>📦</span>
            }
          </div>
          {product.images?.length > 1 && (
            <div className={styles.thumbs}>
              {product.images.map((img, i) => (
                <button key={i} className={`${styles.thumb} ${i === selectedImg ? styles.thumbActive : ''}`} onClick={() => setSelectedImg(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.name}>{product.name}</h1>

          <div className={styles.meta}>
            <span className={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
            <span className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : ''}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <p className={styles.description}>{product.description}</p>

          {product.stock > 0 && (
            <div className={styles.actions}>
              <div className={styles.qty}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className={styles.qtyBtn}>−</button>
                <span className={styles.qtyVal}>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className={styles.qtyBtn}>+</button>
              </div>

              {isAuth ? (
                <>
                  <button className={`${styles.btnCart} ${added ? styles.added : ''}`} onClick={handleAddToCart}>
                    {added ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>
                  <button className={styles.btnBuy} onClick={handleBuyNow}>Buy Now</button>
                </>
              ) : (
                <button className={styles.btnCart} onClick={() => navigate('/login')}>
                  Sign in to Purchase
                </button>
              )}
            </div>
          )}

          {/* Details */}
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Category</span>
              <span className={styles.detailVal}>{product.category}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Stock</span>
              <span className={styles.detailVal}>{product.stock} units</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Free Shipping</span>
              <span className={styles.detailVal}>{product.price >= 500 ? 'Yes ✓' : 'On orders above ₹500'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Secure Payment</span>
              <span className={styles.detailVal}>Razorpay Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
