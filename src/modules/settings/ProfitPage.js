import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../core/utils/axios';
import './ProfitPage.css';

const ProfitPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('monthly');

  useEffect(() => {
    fetchProfit();
  }, []);

  const fetchProfit = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/admin/profit');
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setError((res.data && res.data.message) || 'Failed to load profit data');
      }
    } catch (err) {
      console.error('Error loading profit:', err);
      setError('Could not load profit data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const money = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const monthName = (m) => {
    const d = new Date();
    d.setMonth(m - 1);
    return d.toLocaleString('default', { month: 'long' });
  };

  const prettyDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="profit-page loading-container">
        <div className="spinner"></div>
        <p>Calculating convenience fee earnings...</p>
      </div>
    );
  }

  const rows = view === 'monthly' ? data?.monthlyBreakdown || [] : data?.dailyBreakdown || [];

  return (
    <div className="profit-page">
      <div className="page-header-container">
        <Link to="/dashboard" className="back-link">
          <span>&larr;</span> Back to Dashboard
        </Link>
        <div className="page-header">
          <h1>Profit</h1>
          <div className="view-mode-toggle">
            <button
              className={'toggle-btn ' + (view === 'monthly' ? 'active' : '')}
              onClick={() => setView('monthly')}
            >
              Monthly
            </button>
            <button
              className={'toggle-btn ' + (view === 'daily' ? 'active' : '')}
              onClick={() => setView('daily')}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {error && <div className="profit-error">{error}</div>}

      {data && (
        <>
          <div className="profit-hero">
            <span className="ph-label">Earned from convenience fees</span>
            <span className="ph-value">{money(data.totalEarned)}</span>
            <span className="ph-meta">
              across {data.totalOrders} delivered order
              {data.totalOrders === 1 ? '' : 's'}
              {data.since ? ' since ' + prettyDate(data.since) : ''}
            </span>
          </div>

          <div className="profit-stats">
            <div className="stat-card">
              <span className="label">This Month</span>
              <span className="value">{money(data.thisMonth?.earned)}</span>
              <span className="sub">
                {data.thisMonth?.orders || 0} order{data.thisMonth?.orders === 1 ? '' : 's'}
              </span>
            </div>
            <div className="stat-card">
              <span className="label">Today</span>
              <span className="value">{money(data.today?.earned)}</span>
              <span className="sub">
                {data.today?.orders || 0} order{data.today?.orders === 1 ? '' : 's'}
              </span>
            </div>
            <div className="stat-card">
              <span className="label">Current Charge</span>
              <span className="value">{money(data.currentCharge)}</span>
              <span className="sub">
                <Link to="/convenience-charge">per order &mdash; change</Link>
              </span>
            </div>
          </div>

          <div className="profit-table-wrap">
            <div className="ptw-head">
              <h2>{view === 'monthly' ? 'Month by month' : 'Last 30 days'}</h2>
            </div>

            {rows.length === 0 ? (
              <div className="profit-empty">
                <h3>Nothing earned yet</h3>
                <p>
                  Convenience fee earnings appear here once orders carrying the charge have been
                  delivered. Orders placed before the charge was switched on are not counted.
                </p>
              </div>
            ) : (
              <table className="profit-table">
                <thead>
                  <tr>
                    <th>{view === 'monthly' ? 'Month' : 'Date'}</th>
                    <th className="num">Orders</th>
                    <th className="num">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={view === 'monthly' ? r.year + '-' + r.month : r.date}>
                      <td>
                        {view === 'monthly'
                          ? monthName(r.month) + ' ' + r.year
                          : new Date(r.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                      </td>
                      <td className="num">{r.orders}</td>
                      <td className="num strong">{money(r.earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="profit-note">
            Counts delivered orders only, so cancelled orders are excluded. The total starts from
            the first order that actually carried a convenience charge &mdash; everything ordered
            before that is ignored.
          </p>
        </>
      )}
    </div>
  );
};

export default ProfitPage;
