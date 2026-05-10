import { useEffect } from 'react';
import { getSocket } from './socket';

/**
 * Subscribe to real-time status updates for a specific order.
 * @param {string} orderId
 * @param {function} onStatusUpdate - called with new status string
 */
export function useOrderTracking(orderId, onStatusUpdate) {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    if (!socket) return;

    // Join the order's room
    socket.emit('order:track', orderId);

    const handler = ({ orderId: id, status }) => {
      if (id === orderId) onStatusUpdate(status);
    };

    socket.on('order:statusUpdate', handler);

    return () => {
      socket.emit('order:untrack', orderId);
      socket.off('order:statusUpdate', handler);
    };
  }, [orderId, onStatusUpdate]);
}
