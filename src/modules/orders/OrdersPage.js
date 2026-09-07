import React, { useState, useEffect } from 'react';
import axiosInstance from '../core/utils/axios';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'detailed'

  // Cancel order dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const calculateOrderTotal = (order) => {
    // Priority 1: Revised Order Value (if order was edited)
    if (order.revisedOrderValue?.total) return order.revisedOrderValue.total;

    // Priority 2: Standard Order Value
    if (order.orderValue?.total) return order.orderValue.total;

    // Try different total field names (Legacy/Fallback)
    if (order.totalAmount) return order.totalAmount;
    if (order.total) return order.total;
    if (order.grandTotal) return order.grandTotal;
    if (order.finalAmount) return order.finalAmount;
    if (order.amount) return order.amount;

    // Calculate from items if available
    if (order.items && Array.isArray(order.items)) {
      const itemsTotal = order.items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);
      const deliveryFee = order.deliveryFee || 30;
      // Include taxes if available in order value
      const taxes = order.orderValue?.taxes || 0;
      return itemsTotal + deliveryFee + taxes;
    }

    // Default fallback
    return 150;
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, activeSearchTerm, statusFilter, sortBy, sortOrder]);

  // Apply sorting and filtering whenever orders, sortBy, sortOrder, searchTerm, or statusFilter changes
  useEffect(() => {
    applySortingAndFiltering();
  }, [orders, sortBy, sortOrder, searchTerm, statusFilter]);

  const applySortingAndFiltering = () => {
    let filtered = [...orders];

    // Apply search filter
    if (activeSearchTerm.trim()) {
      const term = activeSearchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const customerName = order.customerId?.name?.toLowerCase() || '';
        const customerPhone =
          order.deliveryAddress?.contactPhone?.toLowerCase() ||
          order.customerId?.phone?.toLowerCase() ||
          '';
        const shopperName = order.personalShopperId?.name?.toLowerCase() || '';
        const shopperPhone = order.personalShopperId?.phone?.toLowerCase() || '';
        const orderNumber = order.orderNumber?.toLowerCase() || '';
        const shopName = order.shopId?.name?.toLowerCase() || '';

        return (
          customerName.includes(term) ||
          customerPhone.includes(term) ||
          shopperName.includes(term) ||
          shopperPhone.includes(term) ||
          orderNumber.includes(term) ||
          shopName.includes(term)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'customerName':
          aValue = a.customerId?.name || '';
          bValue = b.customerId?.name || '';
          break;
        case 'customerPhone':
          aValue = a.deliveryAddress?.contactPhone || a.customerId?.phone || '';
          bValue = b.deliveryAddress?.contactPhone || b.customerId?.phone || '';
          break;
        case 'shopperName':
          aValue = a.personalShopperId?.name || '';
          bValue = b.personalShopperId?.name || '';
          break;
        case 'shopperPhone':
          aValue = a.personalShopperId?.phone || '';
          bValue = b.personalShopperId?.phone || '';
          break;
        case 'orderNumber':
          aValue = a.orderNumber || '';
          bValue = b.orderNumber || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'total':
          aValue = calculateOrderTotal(a);
          bValue = calculateOrderTotal(b);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      // If searching, filtering, or sorting, get all orders; otherwise use pagination
      const needAllOrders =
        activeSearchTerm ||
        statusFilter !== 'all' ||
        sortBy !== 'createdAt' ||
        sortOrder !== 'desc';
      const url = needAllOrders ? '/admin/orders?limit=10000' : `/admin/orders?page=${page}`;
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        const orders = response.data.data.orders || [];
        console.log('Orders data:', orders);
        if (orders.length > 0) {
          console.log('First order structure:', orders[0]);
        }
        setOrders(orders);
        setTotalPages(response.data.data.pagination?.pages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch orders');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders');
      setLoading(false);
      console.error('Error fetching orders:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    // If status is cancelled, show dialog for reason
    if (status === 'cancelled') {
      const order = orders.find((o) => o._id === orderId);
      setOrderToCancel(order);
      setShowCancelDialog(true);
      return;
    }

    try {
      const response = await axiosInstance.put(`/admin/orders/${orderId}/status`, { status });

      if (response.data.success) {
        // Update the order in the state
        setOrders(orders.map((order) => (order._id === orderId ? { ...order, status } : order)));
        setError(''); // Clear any previous errors
      } else {
        setError(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      console.log('🔄 Sending cancel request for order:', orderToCancel._id);
      console.log('🔄 Cancel reason:', cancelReason.trim());
      console.log('🔄 Request URL:', `/admin/orders/${orderToCancel._id}/cancel`);

      const response = await axiosInstance.put(`/admin/orders/${orderToCancel._id}/cancel`, {
        reason: cancelReason.trim(),
      });

      console.log('✅ Response received:', response);

      if (response.data.success) {
        // Update the order in the state
        setOrders(
          orders.map((order) =>
            order._id === orderToCancel._id
              ? {
                  ...order,
                  status: 'cancelled',
                  cancellationReason: cancelReason.trim(),
                  cancelledBy: 'admin',
                  cancelledAt: new Date(),
                }
              : order
          )
        );
        setError(''); // Clear any previous errors

        // Close dialog and reset
        setShowCancelDialog(false);
        setOrderToCancel(null);
        setCancelReason('');
      } else {
        setError(response.data.message || 'Failed to cancel order');
      }
    } catch (err) {
      setError('Failed to cancel order');
      console.error('Error cancelling order:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // Show more specific error message
      if (err.response?.data?.message) {
        alert(`Failed to cancel order: ${err.response.data.message}`);
      } else if (err.response?.status === 404) {
        alert(
          'Cancel order endpoint not found. Please check if the backend route is properly configured.'
        );
      } else {
        alert(`Failed to cancel order: ${err.message}`);
      }
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <div className="orders-page">Loading orders...</div>;
  }

  if (error) {
    return <div className="orders-page error">{error}</div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Manage Orders</h1>
        <div
          className="duplicate-orders-info"
          style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '10px',
            margin: '10px 0',
            fontSize: '14px',
          }}
        >
          <strong>🚫 Duplicate Order Prevention:</strong> Customers are now prevented from placing
          similar orders within 5 minutes to reduce shopper confusion.
        </div>
      </div>

      {/* Controls Section */}
      <div className="orders-controls">
        <div className="controls-row">
          {/* Search */}
          <div className="control-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              placeholder="Search by customer, shopper, order number, or shop... (Press Enter to search)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearchTerm(searchTerm);
                  setCurrentPage(1);
                }
              }}
              className="search-input"
            />
          </div>

          {/* Sort By */}
          <div className="control-group">
            <label htmlFor="sortBy">Sort By:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="createdAt">Order Date</option>
              <option value="customerName">Customer Name</option>
              <option value="customerPhone">Customer Phone</option>
              <option value="shopperName">Shopper Name</option>
              <option value="shopperPhone">Shopper Phone</option>
              <option value="orderNumber">Order Number</option>
              <option value="status">Status</option>
              <option value="total">Total Amount</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="control-group">
            <label htmlFor="sortOrder">Order:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="control-group">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending_shopper">Pending Shopper</option>
              <option value="accepted_by_shopper">Accepted</option>
              <option value="shopping_in_progress">Shopping</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="control-group">
            <label>View:</label>
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
              >
                📋 Compact
              </button>
              <button
                className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                onClick={() => setViewMode('detailed')}
              >
                📄 Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
          {activeSearchTerm && (
            <span className="search-info">• Filtered by: "{activeSearchTerm}"</span>
          )}
          {statusFilter !== 'all' && <span className="filter-info">• Status: {statusFilter}</span>}
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`order-card ${viewMode === 'compact' ? 'compact-view' : 'detailed-view'}`}
            >
              <div className="order-header">
                <h3>Order #{order.orderNumber || order._id?.slice(-8) || 'N/A'}</h3>
                <span className="order-time">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A'}
                </span>
                <div className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {viewMode === 'compact' ? (
                // Compact View - Essential Information Only
                <div className="compact-order-details">
                  <div className="compact-info-grid">
                    <div className="compact-info-item">
                      <span className="compact-label">Customer:</span>
                      <span className="compact-value">{order.customerId?.name || 'Unknown'}</span>
                    </div>
                    <div className="compact-info-item">
                      <span className="compact-label">Phone:</span>
                      <span className="compact-value">
                        {order.deliveryAddress?.permanentContactPhone &&
                          order.deliveryAddress?.permanentContactPhone !==
                            order.deliveryAddress?.contactPhone && (
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '2px' }}>
                              Reg: {order.deliveryAddress?.permanentCountryCode || '+91'}{' '}
                              {order.deliveryAddress.permanentContactPhone}
                            </div>
                          )}
                        {order.deliveryAddress?.contactPhone || order.customerId?.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="compact-info-item">
                      <span className="compact-label">Shopper:</span>
                      <span className="compact-value">
                        {order.personalShopperId?.name || 'Not Assigned'}
                      </span>
                    </div>
                    <div className="compact-info-item">
                      <span className="compact-label">Shop:</span>
                      <span className="compact-value">{order.shopId?.name || 'Unknown'}</span>
                    </div>
                    <div className="compact-info-item">
                      <span className="compact-label">Total:</span>
                      <span className="compact-value">
                        ₹{calculateOrderTotal(order).toFixed(2)}
                      </span>
                    </div>
                    <div className="compact-info-item">
                      <span className="compact-label">Date:</span>
                      <span className="compact-value">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Detailed View - Full Information

                <div className="order-details">
                  <div className="order-basic-info">
                    <div className="info-section">
                      <h5>Customer Information</h5>
                      <p>
                        <strong>Name:</strong>{' '}
                        {order.customerId?.name || order.customer?.name || 'Unknown'}
                      </p>
                      {order.deliveryAddress?.permanentContactPhone &&
                        order.deliveryAddress?.permanentContactPhone !==
                          order.deliveryAddress?.contactPhone && (
                          <p>
                            <strong>Registered Phone:</strong>{' '}
                            {order.deliveryAddress?.permanentCountryCode || '+91'}{' '}
                            {order.deliveryAddress.permanentContactPhone}
                          </p>
                        )}
                      <p>
                        <strong>Contact Number:</strong>{' '}
                        {order.deliveryAddress?.contactPhone || order.customerId?.phone || 'N/A'}
                      </p>
                      <p>
                        <strong>Email:</strong> {order.customerId?.email || 'N/A'}
                      </p>
                    </div>

                    <div className="info-section">
                      <h5>Delivery Information</h5>
                      <p>
                        <strong>Address:</strong> {order.deliveryAddress?.street || 'N/A'},{' '}
                        {order.deliveryAddress?.city || 'N/A'},{' '}
                        {order.deliveryAddress?.state || 'N/A'}{' '}
                        {order.deliveryAddress?.zipCode || ''}
                      </p>
                      {order.deliveryAddress?.instructions && (
                        <p>
                          <strong>Instructions:</strong> {order.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>

                    <div className="info-section">
                      <h5>Shop Information</h5>
                      <p>
                        <strong>Shop:</strong> {order.shopId?.name || order.shop?.name || 'Unknown'}
                      </p>
                      <p>
                        <strong>Shop Address:</strong> {order.shopId?.address?.street || 'N/A'},{' '}
                        {order.shopId?.address?.city || 'N/A'}
                      </p>
                    </div>

                    <div className="info-section">
                      <h5>Shopper Information</h5>
                      <p>
                        <strong>Name:</strong>{' '}
                        {order.personalShopperId?.name || order.shopper?.name || 'Not Assigned'}
                      </p>
                      <p>
                        <strong>Phone:</strong>{' '}
                        {order.personalShopperId?.phone || order.shopper?.phone || 'N/A'}
                      </p>
                      <p>
                        <strong>Rating:</strong> {order.personalShopperId?.rating?.average || 'N/A'}
                      </p>
                    </div>

                    <div className="info-section">
                      <h5>Order Timeline</h5>
                      <p>
                        <strong>Order Placed:</strong>{' '}
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`status-${order.status}`}>
                          {order.status || 'pending'}
                        </span>
                      </p>

                      {/* Show cancellation details if order is cancelled */}
                      {order.status === 'cancelled' && (
                        <div
                          style={{
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            padding: '0.75rem',
                            marginTop: '0.5rem',
                          }}
                        >
                          <p
                            style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#721c24' }}
                          >
                            ❌ Order Cancelled
                          </p>
                          <p
                            style={{ margin: '0 0 0.25rem 0', fontSize: '14px', color: '#721c24' }}
                          >
                            <strong>Cancelled by:</strong> {order.cancelledBy || 'Unknown'}
                          </p>

                          {/* Show cancellation reason. Prefer explicit `cancellationReason`,
                                                        otherwise for shopper-initiated cancellations try extracting
                                                        the reason from the timeline note entry. */}
                          {(order.cancellationReason ||
                            order.reason ||
                            order.cancelledBy === 'shopper') && (
                            <p
                              style={{
                                margin: '0 0 0.25rem 0',
                                fontSize: '14px',
                                color: '#721c24',
                              }}
                            >
                              <strong>Reason:</strong>{' '}
                              {order.cancellationReason ||
                                order.reason ||
                                (() => {
                                  const cancelTimeline = order.timeline?.find(
                                    (t) =>
                                      t.status === 'cancelled' &&
                                      t.note?.includes('Order cancelled by shopper:')
                                  );
                                  if (cancelTimeline) {
                                    return cancelTimeline.note.replace(
                                      'Order cancelled by shopper: ',
                                      ''
                                    );
                                  }
                                  return 'No reason provided';
                                })()}
                            </p>
                          )}
                          {order.cancelledAt && (
                            <p style={{ margin: '0', fontSize: '14px', color: '#721c24' }}>
                              <strong>Date:</strong>{' '}
                              {new Date(order.cancelledAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {order.deliveredAt && (
                        <p>
                          <strong>Delivered At:</strong>{' '}
                          {new Date(order.deliveredAt).toLocaleString()}
                        </p>
                      )}
                      {order.actualDeliveryTime && (
                        <p>
                          <strong>Actual Delivery Time:</strong>{' '}
                          {new Date(order.actualDeliveryTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Original Order Details */}
                  <div className="order-breakdown">
                    <div className="original-order">
                      <h4>Original Order</h4>
                      {order.items && order.items.length > 0 ? (
                        <div className="items-list">
                          {order.items.map((item, index) => (
                            <div key={index} className="item-row">
                              <span className="item-name">{item.name || 'Unknown Item'}</span>
                              <span className="item-details">
                                {item.quantity || 1} × ₹{item.price || 0} = ₹
                                {(item.quantity || 1) * (item.price || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No items found</p>
                      )}
                      <div className="order-totals">
                        <div className="total-row">
                          <span>Subtotal:</span>
                          <span>₹{order.orderValue?.subtotal || 0}</span>
                        </div>
                        <div className="total-row">
                          <span>Delivery Fee:</span>
                          <span>₹{order.orderValue?.deliveryFee || 0}</span>
                        </div>
                        {order.orderValue?.convenienceCharge > 0 && (
                          <div className="total-row">
                            <span>Convenience Charge:</span>
                            <span>₹{order.orderValue.convenienceCharge}</span>
                          </div>
                        )}
                        <div className="total-row grand-total">
                          <span>Total:</span>
                          <span>₹{order.orderValue?.total || calculateOrderTotal(order)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revised Order Details (if exists) */}
                    {order.revisedOrderValue && (
                      <div className="revised-order">
                        <h4>Revised Order</h4>
                        {order.revisedItems && order.revisedItems.length > 0 ? (
                          <div className="items-list">
                            {order.revisedItems.map((item, index) => (
                              <div key={index} className="item-row">
                                <span className="item-name">
                                  {item.name || 'Unknown Item'}
                                  {item.isAvailable === false && (
                                    <span className="unavailable"> (Unavailable)</span>
                                  )}
                                </span>
                                <span className="item-details">
                                  {item.revisedQuantity !== undefined
                                    ? item.revisedQuantity
                                    : item.quantity || 1}{' '}
                                  × ₹
                                  {item.revisedPrice !== undefined
                                    ? item.revisedPrice
                                    : item.price || 0}{' '}
                                  = ₹
                                  {(item.revisedQuantity !== undefined
                                    ? item.revisedQuantity
                                    : item.quantity || 1) *
                                    (item.revisedPrice !== undefined
                                      ? item.revisedPrice
                                      : item.price || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : order.items && order.items.length > 0 ? (
                          <div className="items-list">
                            {order.items.map((item, index) => (
                              <div key={index} className="item-row">
                                <span className="item-name">
                                  {item.name || 'Unknown Item'}
                                  {item.isAvailable === false && (
                                    <span className="unavailable"> (Unavailable)</span>
                                  )}
                                </span>
                                <span className="item-details">
                                  {item.revisedQuantity !== undefined
                                    ? item.revisedQuantity
                                    : item.quantity || 1}{' '}
                                  × ₹
                                  {item.revisedPrice !== undefined
                                    ? item.revisedPrice
                                    : item.price || 0}{' '}
                                  = ₹
                                  {(item.revisedQuantity !== undefined
                                    ? item.revisedQuantity
                                    : item.quantity || 1) *
                                    (item.revisedPrice !== undefined
                                      ? item.revisedPrice
                                      : item.price || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No revised items</p>
                        )}
                        <div className="order-totals">
                          <div className="total-row">
                            <span>Subtotal:</span>
                            <span>₹{order.revisedOrderValue?.subtotal || 0}</span>
                          </div>
                          <div className="total-row">
                            <span>Delivery Fee:</span>
                            <span>
                              ₹
                              {order.revisedOrderValue?.deliveryFee ||
                                order.orderValue?.deliveryFee ||
                                0}
                            </span>
                          </div>
                          <div className="total-row">
                            <span>Taxes:</span>
                            <span>₹{order.revisedOrderValue?.taxes || 0}</span>
                          </div>
                          {(order.revisedOrderValue?.convenienceCharge ??
                            order.orderValue?.convenienceCharge) > 0 && (
                            <div className="total-row">
                              <span>Convenience Charge:</span>
                              <span>
                                ₹
                                {order.revisedOrderValue?.convenienceCharge ??
                                  order.orderValue?.convenienceCharge}
                              </span>
                            </div>
                          )}
                          <div className="total-row grand-total">
                            <span>Total:</span>
                            <span>₹{order.revisedOrderValue?.total || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shopper Commission */}
                    <div className="shopper-commission">
                      <h4>Shopper Earnings</h4>
                      <div className="total-row">
                        <span>Commission:</span>
                        <span>
                          ₹{order.shopperCommission || order.orderValue?.deliveryFee || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 &&
        !activeSearchTerm &&
        statusFilter === 'all' &&
        sortBy === 'createdAt' &&
        sortOrder === 'desc' && (
          <div className="pagination">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

      {/* Cancel Order Dialog */}
      {showCancelDialog && orderToCancel && (
        <div
          className="cancel-dialog-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="cancel-dialog"
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>❌ Cancel Order</h3>

            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to cancel <strong>Order #{orderToCancel.orderNumber}</strong>?
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Reason for cancellation: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                maxLength={500}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                {cancelReason.length}/500 characters
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDialogClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: cancelReason.trim() ? '#dc3545' : '#ccc',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
