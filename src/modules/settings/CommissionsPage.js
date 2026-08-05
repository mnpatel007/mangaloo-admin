import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../core/utils/axios';
import './CommissionsPage.css';

const CommissionsPage = () => {
  const [summary, setSummary] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'monthly' or 'daily'
  const [viewMode, setViewMode] = useState('monthly');
  // Selected date for daily view: 'YYYY-MM-DD'
  const [selectedDates, setSelectedDates] = useState({});
  // Selected month for monthly view: { [shopId]: monthIndex }
  const [selectedMonths, setSelectedMonths] = useState({});
  // Per-shop commission percentage: { [shopId]: percentage }
  const [percentages, setPercentages] = useState({});
  // Per-shop calculated amount: { [shopId]: amount }
  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/revenue');
      if (response.data && response.data.success) {
        const { summary = {}, shops = [] } = response.data.data || {};

        setSummary(summary);
        setShops(Array.isArray(shops) ? shops : []);

        // Initialize selected months and dates
        const initialMonths = {};
        const initialDates = {};
        if (Array.isArray(shops)) {
          const todayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
          shops.forEach((shop) => {
            if (shop.monthlyBreakdown && shop.monthlyBreakdown.length > 0) {
              initialMonths[shop.shopId] = 0;
            }
            if (shop.dailyBreakdown && shop.dailyBreakdown.length > 0) {
              // Default to today if exists, else most recent
              const hasToday = shop.dailyBreakdown.find((d) => d.date === todayStr);
              initialDates[shop.shopId] = hasToday ? todayStr : shop.dailyBreakdown[0].date;
            }
          });
        }
        setSelectedMonths(initialMonths);
        setSelectedDates(initialDates);
      } else {
        setError(response.data?.message || 'Failed to fetch revenue data');
      }
    } catch (err) {
      console.error('Error fetching revenue:', err);
      setError('Error connecting to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (shopId, index) => {
    setSelectedMonths({ ...selectedMonths, [shopId]: parseInt(index) });
    setCalculations({ ...calculations, [shopId]: undefined });
  };

  const handleDateChange = (shopId, date) => {
    setSelectedDates({ ...selectedDates, [shopId]: date });
    setCalculations({ ...calculations, [shopId]: undefined });
  };

  const handlePercentageChange = (shopId, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setPercentages({ ...percentages, [shopId]: num });
  };

  const calculateCommission = (shopId, revenue) => {
    const pct = percentages[shopId] || 0;
    const amount = (revenue * pct) / 100;
    setCalculations({ ...calculations, [shopId]: amount });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="commissions-page loading-container">
        <div className="spinner"></div>
        <p>Synchronizing global revenue data...</p>
      </div>
    );
  }

  return (
    <div className="commissions-page">
      <div className="page-header-container">
        <Link to="/dashboard" className="back-link">
          <span>←</span> Back to Dashboard
        </Link>
        <div className="page-header">
          <h1>Shop Commissions</h1>
          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="stats-overview">
          <div className="stat-card">
            <span className="label">Managed Revenue</span>
            <div className="stat-main">
              <span className="value">{formatCurrency(summary.totalRevenue || 0)}</span>
              <span className="sub-label">Cumulative Gross</span>
            </div>
            <div className="stat-comparison">
              <div className="comparison-item">
                <span className="comp-value">
                  {formatCurrency(summary.currentMonthRevenue || 0)}
                </span>
                <span className="comp-label">This Month</span>
              </div>
              <div className="comparison-item">
                <span className="comp-value">{formatCurrency(summary.todayRevenue || 0)}</span>
                <span className="comp-label">Today</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <span className="label">Delivered Orders</span>
            <div className="stat-main">
              <span className="value">{(summary.totalOrders || 0).toLocaleString()}</span>
              <span className="sub-label">Success Rate Checked</span>
            </div>
            <div className="stat-comparison">
              <div className="comparison-item">
                <span className="comp-value">{summary.currentMonthOrders || 0}</span>
                <span className="comp-label">This Month</span>
              </div>
              <div className="comparison-item">
                <span className="comp-value">{summary.todayOrders || 0}</span>
                <span className="comp-label">Today</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <span className="label">Partnered Shops</span>
            <div className="stat-main">
              <span className="value">{summary.partnerShops || 0}</span>
              <span className="sub-label">Excluding Test Accounts</span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="revenue-grid">
        {Array.isArray(shops) && shops.length > 0 ? (
          shops.map((shop) => {
            let selectedData = null;
            let selector = null;

            if (viewMode === 'monthly') {
              const mIndex = selectedMonths[shop.shopId] ?? -1;
              selectedData =
                mIndex !== -1 && shop.monthlyBreakdown && shop.monthlyBreakdown[mIndex];
              if (shop.monthlyBreakdown && shop.monthlyBreakdown.length > 0) {
                selector = (
                  <select
                    className="selector-dropdown"
                    value={mIndex}
                    onChange={(e) => handleMonthChange(shop.shopId, e.target.value)}
                  >
                    {shop.monthlyBreakdown.map((m, idx) => (
                      <option key={`${shop.shopId}_${m.month}_${m.year}`} value={idx}>
                        {getMonthName(m.month)} {m.year}
                      </option>
                    ))}
                  </select>
                );
              }
            } else {
              const sDate = selectedDates[shop.shopId];
              selectedData =
                shop.dailyBreakdown && shop.dailyBreakdown.find((d) => d.date === sDate);
              if (shop.dailyBreakdown && shop.dailyBreakdown.length > 0) {
                selector = (
                  <select
                    className="selector-dropdown"
                    value={sDate}
                    onChange={(e) => handleDateChange(shop.shopId, e.target.value)}
                  >
                    {shop.dailyBreakdown.map((d) => (
                      <option key={`${shop.shopId}_${d.date}`} value={d.date}>
                        {formatDate(d.date)}
                      </option>
                    ))}
                  </select>
                );
              }
            }

            return (
              <div key={shop.shopId} className="revenue-card">
                <div className="card-header-row">
                  <div className="shop-identity">
                    <h3>
                      {shop.shopName}
                      <span className={`visibility-badge ${shop.isVisible ? 'visible' : 'hidden'}`}>
                        {shop.isVisible ? 'Live' : 'Hidden'}
                      </span>
                      {shop.hasTax && <span className="tax-badge">Taxes Added</span>}
                    </h3>
                    <span className="all-time-badge">
                      All-time: {formatCurrency(shop.allTimeRevenue)}
                    </span>
                  </div>

                  <div className="selector-wrapper">{selector}</div>
                </div>

                {selectedData ? (
                  <div className="card-stats-display">
                    <div className="stat-box primary">
                      <span className="amount">{formatCurrency(selectedData.revenue)}</span>
                      <span className="desc">
                        {viewMode === 'monthly' ? 'Monthly Revenue' : 'Daily Revenue'}
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="amount">{selectedData.orders}</span>
                      <span className="desc">Orders</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-history">No sales history detected for this period.</div>
                )}

                {selectedData && (
                  <div className="commission-engine">
                    <div className="engine-header">
                      <span>⚙️</span> Commission Tool
                    </div>
                    <div className="engine-controls">
                      <div className="input-container">
                        <input
                          type="number"
                          placeholder="0.0"
                          min="0"
                          max="100"
                          step="0.1"
                          value={percentages[shop.shopId] || ''}
                          onChange={(e) => handlePercentageChange(shop.shopId, e.target.value)}
                        />
                        <span className="percentage-symbol">%</span>
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => calculateCommission(shop.shopId, selectedData.revenue)}
                      >
                        Calculate
                      </button>
                    </div>

                    {calculations[shop.shopId] !== undefined && (
                      <div className="engine-result">
                        <span className="result-tag">Projected Share:</span>
                        <span className="result-val">
                          {formatCurrency(calculations[shop.shopId])}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-data-overall">
            <h3>No eligible shops found for commission tracking.</h3>
            <p>Verify that your shops have recorded delivered orders.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionsPage;
