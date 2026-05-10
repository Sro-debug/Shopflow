import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from './socket';
import { addNotification } from '../redux/userSlice';
import { updateOrderStatus } from '../redux/cartSlice';

export function useSocketHandlers() {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOrderCreated = (order) => {
      dispatch(addNotification({ type: 'success', message: `Order #${order._id?.slice(-8).toUpperCase()} placed!` }));
    };

    const onOrderPaid = (order) => {
      dispatch(addNotification({ type: 'success', message: 'Payment confirmed!' }));
    };

    const onOrderStatusUpdate = ({ orderId, status }) => {
      dispatch(updateOrderStatus({ orderId, status }));
      dispatch(addNotification({ type: 'info', message: `Order status updated: ${status}` }));
    };

    const onNotification = (data) => {
      dispatch(addNotification(data));
    };

    const onCacheDegraded = ({ node }) => {
      dispatch(addNotification({ type: 'warning', message: `Cache node degraded: ${node}` }));
    };

    const onCacheRecovered = ({ node }) => {
      dispatch(addNotification({ type: 'success', message: `Cache node recovered: ${node}` }));
    };

    socket.on('order:created', onOrderCreated);
    socket.on('order:paid', onOrderPaid);
    socket.on('order:statusUpdate', onOrderStatusUpdate);
    socket.on('notification', onNotification);
    socket.on('cache:degraded', onCacheDegraded);
    socket.on('cache:recovered', onCacheRecovered);

    return () => {
      socket.off('order:created', onOrderCreated);
      socket.off('order:paid', onOrderPaid);
      socket.off('order:statusUpdate', onOrderStatusUpdate);
      socket.off('notification', onNotification);
      socket.off('cache:degraded', onCacheDegraded);
      socket.off('cache:recovered', onCacheRecovered);
    };
  }, [dispatch]);
}
