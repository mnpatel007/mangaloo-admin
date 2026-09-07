import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // MODIFIED: Added useNavigate
import { useAuth } from '../core/context/AuthContext';
import axiosInstance from '../core/utils/axios';
import OrderMonitoring from '../orders/components/OrderMonitoring';
import socketService from '../core/services/socket';
import Logo from '../core/components/Logo';
import './Dashboard.css';

const Dashboard = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate(); // ADDED: Initialized useNavigate hook
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    shopsCount: 0,
    productsCount: 0,
    ordersCount: 0,
    usersCount: 0,
    shoppersCount: 0,
    dailyOrders: 0,
    dailyDeliveredOrders: 0,
    dailyCancelledOrders: 0,
    dailyInquiries: 0,
    recentOrders: [],
    orderStatusDistribution: [],
    shopperStats: [],
    pendingShoppersCount: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shopperPeriod, setShopperPeriod] = useState('total');
  const [shopperDate, setShopperDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel order dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchStats = async (date = null) => {
      try {
        const url = date ? `/admin/dashboard?date=${date}` : '/admin/dashboard';
        const response = await axiosInstance.get(url);

        if (response.data.success) {
          const data = response.data.data;
          setStats({
            shopsCount: data.stats.totalShops || 0,
            productsCount: data.stats.totalProducts || 0,
            ordersCount: data.stats.totalOrders || 0,
            usersCount: data.stats.totalUsers || 0,
            shoppersCount: data.stats.totalShoppers || 0,
            pendingShoppersCount: data.stats.pendingShoppersCount || 0,
            dailyOrders: data.stats.dailyOrders || 0,
            dailyDeliveredOrders: data.stats.dailyDeliveredOrders || 0,
            dailyCancelledOrders: data.stats.dailyCancelledOrders || 0,
            recentOrders: data.recentOrders || [],
            orderStatusDistribution: data.orderStatusStats || [],
            shopperStats: data.shopperStats || [],
          });
        } else {
          setError(response.data.message || 'Failed to fetch dashboard statistics');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
        setLoading(false);
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
    // Fetch today's shopper stats by default
    fetchShopperStats('today');

    // Socket notifications
    socketService.connect();
    socketService.on('newShopperSignup', (data) => {
      console.log('🔔 New shopper registered socket signal:', data);
      // Refresh stats to get the latest pending count
      fetchStats();
      // Optional: Play a sound or show a more global notification if not on dashboard
    });

    return () => {
      socketService.off('newShopperSignup');
      // We might keep the socket connected for other real-time features
    };
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchOrderAnalytics(newDate);
  };

  const handleShopperPeriodChange = (period) => {
    setShopperPeriod(period);
    if (period === 'total') {
      fetchShopperStats('total');
    }
  };

  const handleShopperDateChange = (e) => {
    const newDate = e.target.value;
    setShopperDate(newDate);
    fetchShopperStats('date', newDate);
  };

  const fetchOrderAnalytics = async (date) => {
    try {
      const response = await axiosInstance.get(`/admin/dashboard?date=${date}`);
      if (response.data.success) {
        const data = response.data.data;
        setStats((prev) => ({
          ...prev,
          dailyOrders: data.stats.dailyOrders || 0,
          dailyDeliveredOrders: data.stats.dailyDeliveredOrders || 0,
          dailyCancelledOrders: data.stats.dailyCancelledOrders || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching order analytics:', err);
    }
  };

  const fetchShopperStats = async (period, date = null) => {
    try {
      const params = { shopperPeriod: period };
      if (date) params.date = date;
      const queryParams = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/admin/dashboard?${queryParams}`);
      if (response.data.success) {
        const data = response.data.data;
        setStats((prev) => ({
          ...prev,
          shopperStats: data.shopperStats || [],
        }));
      }
    } catch (err) {
      console.error('Error fetching shopper stats:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const response = await axiosInstance.put(`/admin/orders/${orderToCancel._id}/cancel`, {
        reason: cancelReason.trim(),
      });

      if (response.data.success) {
        // Update the order in the recent orders list
        setStats((prev) => ({
          ...prev,
          recentOrders: prev.recentOrders.map((order) =>
            order._id === orderToCancel._id
              ? {
                  ...order,
                  status: 'cancelled',
                  cancellationReason: cancelReason.trim(),
                  cancelledBy: 'admin',
                  cancelledAt: new Date(),
                }
              : order
          ),
        }));
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
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const handleOrderCancel = (order) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  // ADDED: Function to perform logout and redirect
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Loading...</p>
          </div>
          <div className="header-right">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
          </div>
        </header>
        <OrderMonitoring />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Logo size="large" showText={true} />
            <h1>Admin Dashboard</h1>
          </div>
          <div className="header-actions">
            <span>Welcome, {admin?.name || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <nav className="dashboard-nav">
          <Link to="/dashboard" className="nav-link active">
            Dashboard
          </Link>
          <Link to="/shops" className="nav-link">
            Shops
          </Link>
          <Link to="/products" className="nav-link">
            Products
          </Link>
          <Link to="/orders" className="nav-link">
            Orders
          </Link>
          <Link to="/users" className="nav-link">
            Users
          </Link>
          <Link to="/shoppers" className="nav-link">
            Shoppers
          </Link>
          <Link to="/shopper-performance" className="nav-link">
            📊 Shopper Performance
          </Link>
          <Link to="/notices" className="nav-link">
            📢 Notices
          </Link>
          <Link to="/delivery-discounts" className="nav-link">
            🏷️ Delivery Discounts
          </Link>
          <Link to="/commissions" className="nav-link">
            💰 Commissions
          </Link>
          <Link to="/convenience-charge" className="nav-link">
            🧾 Convenience Charge
          </Link>
          <Link to="/profit" className="nav-link">
            📈 Profit
          </Link>
          <Link to="/terms" className="nav-link">
            📋 Terms & Conditions
          </Link>
        </nav>

        <div className="dashboard-content">
          {stats.pendingShoppersCount > 0 && (
            <div
              className="notification-alert"
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeeba',
                color: '#856404',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                <div>
                  <strong style={{ display: 'block' }}>Action Required: Pending Shoppers</strong>
                  <span>
                    There are {stats.pendingShoppersCount} new personal shoppers waiting for your
                    approval.
                  </span>
                </div>
              </div>
              <Link
                to="/shoppers"
                className="action-btn"
                style={{
                  backgroundColor: '#856404',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                Review Now
              </Link>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>Total Shops</h3>
                <p className="stat-number">{stats.shopsCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>Total Products</h3>
                <p className="stat-number">{stats.productsCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-info">
                <h3>Total Orders</h3>
                <p className="stat-number">{stats.ordersCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛍️</div>
              <div className="stat-info">
                <h3>Personal Shoppers</h3>
                <p className="stat-number">{stats.shoppersCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📞</div>
              <div className="stat-info">
                <h3>Customer Inquiries</h3>
                <p className="stat-number">{stats.dailyInquiries || 0}</p>
                <small className="stat-subtitle">Today</small>
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <div className="recent-orders">
              <h2>Recent Orders</h2>
              {!stats.recentOrders || stats.recentOrders.length === 0 ? (
                <p>No recent orders</p>
              ) : (
                <div className="orders-list">
                  {stats.recentOrders.slice(0, 4).map((order) => (
                    <div key={order._id} className="order-item">
                      <div className="order-details">
                        <p className="order-id">
                          Order #{order.orderNumber || order._id?.slice(-8) || 'N/A'}
                        </p>
                        <p className="order-customer">{order.customerId?.name || 'Unknown'}</p>
                        <p className="order-shop">{order.shopId?.name || 'Unknown'}</p>
                      </div>
                      <div className="order-status">
                        <span className={`status-${order.status}`}>{order.status}</span>
                        {/* Show cancellation details if cancelled */}
                        {order.status === 'cancelled' &&
                          (order.cancellationReason || order.cancelledBy) && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#721c24',
                                marginTop: '4px',
                                backgroundColor: '#f8d7da',
                                padding: '4px 8px',
                                borderRadius: '3px',
                              }}
                            >
                              <div>
                                <strong>By:</strong> {order.cancelledBy}
                              </div>
                              {order.cancellationReason && (
                                <div>
                                  <strong>Reason:</strong> {order.cancellationReason}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="order-totals">
                        <div className="original-total">₹{order.orderValue?.total || 0}</div>
                        {order.revisedOrderValue && order.revisedOrderValue.total && (
                          <div className="revised-total">
                            Revised: ₹{order.revisedOrderValue.total}
                          </div>
                        )}
                      </div>
                      {/* Cancel button - only show if order can be cancelled */}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="order-actions">
                          <button
                            onClick={() => handleOrderCancel(order)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="analytics-right-panel">
              <div className="order-status-distribution">
                <h2>Order Status Distribution</h2>
                {!stats.orderStatusDistribution || stats.orderStatusDistribution.length === 0 ? (
                  <p>No order status data</p>
                ) : (
                  <div className="status-chart">
                    {stats.orderStatusDistribution.map((status) => (
                      <div key={status._id} className="status-bar">
                        <div className="status-label">{status._id}</div>
                        <div className="status-value">{status.count}</div>
                        <div className="status-progress">
                          <div
                            className="status-progress-fill"
                            style={{ width: `${(status.count / stats.ordersCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="order-metrics">
                <div className="order-analytics-header">
                  <h2>Order Analytics</h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="date-picker"
                  />
                </div>
                <div className="order-stats-grid">
                  <div className="order-stat">
                    <span className="order-stat-label">Daily Orders</span>
                    <span className="order-stat-value">{stats.dailyOrders}</span>
                  </div>
                  <div className="order-stat">
                    <span className="order-stat-label">Delivered</span>
                    <span className="order-stat-value">{stats.dailyDeliveredOrders}</span>
                  </div>
                  <div className="order-stat">
                    <span className="order-stat-label">Cancelled</span>
                    <span className="order-stat-value">{stats.dailyCancelledOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/shops" className="action-card">
                <div className="action-icon">🏪</div>
                <h3>Manage Shops</h3>
                <p>Add, edit, or remove shops</p>
              </Link>

              <Link to="/products" className="action-card">
                <div className="action-icon">📦</div>
                <h3>Manage Products</h3>
                <p>Add products to shops</p>
              </Link>

              <Link to="/orders" className="action-card">
                <div className="action-icon">🛒</div>
                <h3>Manage Orders</h3>
                <p>View and update orders</p>
              </Link>

              <div className="action-card" onClick={() => setActiveView('order-monitoring')}>
                <div className="action-icon">📊</div>
                <h3>Order Monitoring</h3>
                <p>Real-time order workflow tracking</p>
              </div>

              <Link to="/users" className="action-card">
                <div className="action-icon">👥</div>
                <h3>Manage Users</h3>
                <p>View and manage users</p>
              </Link>

              <Link to="/shoppers" className="action-card">
                <div className="action-icon">🛍️</div>
                <h3>Manage Shoppers</h3>
                <p>View and manage shoppers</p>
              </Link>

              <Link to="/shopper-performance" className="action-card">
                <div className="action-icon">📊</div>
                <h3>Shopper Performance</h3>
                <p>Analytics and performance metrics</p>
              </Link>

              <Link to="/delivery-discounts" className="action-card">
                <div className="action-icon">🏷️</div>
                <h3>Delivery Discounts</h3>
                <p>Manage delivery fee discounts</p>
              </Link>
            </div>
          </div>
        </div>
      </main>

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

export default Dashboard;
