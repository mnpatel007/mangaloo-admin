import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/core/context/AuthContext';
import ErrorBoundary from './modules/core/components/ErrorBoundary';
import LoginPage from './modules/auth/LoginPage';
import Dashboard from './modules/dashboard/Dashboard';
import ShopsPage from './modules/shops/ShopsPage';
import ProductsPage from './modules/products/ProductsPage';
import OrdersPage from './modules/orders/OrdersPage';
import UsersPage from './modules/users/UsersPage';
import ShoppersPage from './modules/shoppers/ShoppersPage';
import ShopperPerformancePage from './modules/shoppers/ShopperPerformancePage';
import NoticesPage from './modules/communication/NoticesPage';
import TermsAndConditionsPage from './modules/settings/TermsAndConditionsPage';
import DeliveryDiscountsPage from './modules/settings/DeliveryDiscountsPage';
import CommissionsPage from './modules/settings/CommissionsPage';
import ConvenienceChargePage from './modules/settings/ConvenienceChargePage';
import './App.css';

// Private route component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shops"
                element={
                  <PrivateRoute>
                    <ShopsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <ProductsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <OrdersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute>
                    <UsersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shoppers"
                element={
                  <PrivateRoute>
                    <ShoppersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shopper-performance"
                element={
                  <PrivateRoute>
                    <ShopperPerformancePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notices"
                element={
                  <PrivateRoute>
                    <NoticesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/terms"
                element={
                  <PrivateRoute>
                    <TermsAndConditionsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/delivery-discounts"
                element={
                  <PrivateRoute>
                    <DeliveryDiscountsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/commissions"
                element={
                  <PrivateRoute>
                    <CommissionsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/convenience-charge"
                element={
                  <PrivateRoute>
                    <ConvenienceChargePage />
                  </PrivateRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
