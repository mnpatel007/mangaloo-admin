import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../core/utils/axios';
import './ConvenienceChargePage.css';

const ConvenienceChargePage = () => {
  const [charge, setCharge] = useState('');
  const [savedCharge, setSavedCharge] = useState(0);
  const [meta, setMeta] = useState({ updatedAt: null, updatedBy: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/settings');
      if (res.data && res.data.success) {
        const value = res.data.data.convenienceCharge || 0;
        setSavedCharge(value);
        setCharge(String(value));
        setMeta({ updatedAt: res.data.data.updatedAt, updatedBy: res.data.data.updatedBy });
      } else {
        setError((res.data && res.data.message) || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Could not load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const value = Number(charge);
    if (!Number.isFinite(value) || value < 0) {
      setError('Enter a valid amount of 0 or more.');
      return;
    }

    try {
      setSaving(true);
      const res = await axiosInstance.put('/admin/settings', { convenienceCharge: value });
      if (res.data && res.data.success) {
        const saved = res.data.data.convenienceCharge;
        setSavedCharge(saved);
        setCharge(String(saved));
        setMeta({ updatedAt: res.data.data.updatedAt, updatedBy: res.data.data.updatedBy });
        setMessage('Saved. This applies to all new orders from now on.');
      } else {
        setError((res.data && res.data.message) || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          'Could not save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);

  if (loading) {
    return (
      <div className="cc-page loading-container">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const isDirty = String(savedCharge) !== String(Number(charge));

  return (
    <div className="cc-page">
      <div className="page-header-container">
        <Link to="/dashboard" className="back-link">
          <span>&larr;</span> Back to Dashboard
        </Link>
        <div className="page-header">
          <h1>Convenience Charge</h1>
        </div>
      </div>

      <div className="cc-current">
        <span className="cc-current-label">Currently applied to every order</span>
        <span className="cc-current-value">{formatCurrency(savedCharge)}</span>
        {meta.updatedAt && (
          <span className="cc-current-meta">
            Last changed {new Date(meta.updatedAt).toLocaleString('en-IN')}
            {meta.updatedBy ? ' by ' + meta.updatedBy : ''}
          </span>
        )}
      </div>

      <form className="cc-card" onSubmit={handleSave}>
        <label htmlFor="convenienceCharge">Flat amount per order</label>
        <div className="cc-input-row">
          <span className="cc-prefix">&#8377;</span>
          <input
            id="convenienceCharge"
            type="number"
            min="0"
            step="0.5"
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
            placeholder="0"
          />
          <button type="submit" className="cc-save" disabled={saving || !isDirty}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <p className="cc-hint">
          Added once per order, on top of the item subtotal, delivery fee, taxes and packaging
          charges. Set it to 0 to switch it off. It is not taxed, and it does not change what the
          personal shopper earns.
        </p>

        <p className="cc-warning">
          Applies to new orders only &mdash; orders already placed keep the amount they were created
          with.
        </p>

        {message && <div className="cc-success">{message}</div>}
        {error && <div className="cc-error">{error}</div>}
      </form>
    </div>
  );
};

export default ConvenienceChargePage;
