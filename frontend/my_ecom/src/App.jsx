import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuth, selectIsAdmin, selectNotifications } from './redux/userSlice';
import { useSocketHandlers } from './socket/socketHandler';
import { connectSocket } from './socket/socket';
import authService from './services/authService';

import Navbar from './components/Navbar/Navbar';
import HomePage from './components/HomePage/HomePage';
import Products from './components/Products/Products';
import IndividualProduct from './components/IndividualProduct/IndividualProduct';
import Cart from './components/Cart/Cart';
import Orders from './components/Orders/Orders';
import IndividualOrder from './components/IndividualOrder/IndividualOrder';
import LoginPage from './components/LoginPage/LoginPage';
import CreateAccount from './components/CreateAccount/CreateAccount';
import LoginOAuth from './components/LoginOAuth/LoginOAuth';
import AddProduct from './components/AddProduct/AddProduct';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import NotFound from './components/NotFound';
import NotificationToast from './components/Navbar/NotificationToast';

function PrivateRoute({ children }) {
  const isAuth = useSelector(selectIsAuth);
  return isAuth ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const isAdmin = useSelector(selectIsAdmin);
  const isAuth = useSelector(selectIsAuth);
  if (!isAuth) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const isAuth = useSelector(selectIsAuth);
  const notifications = useSelector(selectNotifications);

  // Re-connect socket on refresh if logged in
  useEffect(() => {
    if (isAuth) {
      const token = authService.getToken();
      if (token) connectSocket(token);
    }
  }, [isAuth]);

  useSocketHandlers();

  return (
    <>
      <Navbar />

      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.map((n) => <NotificationToast key={n.id} notification={n} />)}
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<IndividualProduct />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<CreateAccount />} />
        <Route path="/oauth/callback" element={<LoginOAuth />} />

        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><IndividualOrder /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/add-product" element={<AdminRoute><AddProduct /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
