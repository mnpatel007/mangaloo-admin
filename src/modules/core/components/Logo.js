import React from 'react';
import './Logo.css';

const Logo = ({
  size = 'medium',
  showText = true,
  className = '',
  onClick = null,
  variant = 'default', // 'default', 'white', 'dark'
}) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large',
    xlarge: 'logo-xlarge',
  };

  const variantClasses = {
    default: 'logo-default',
    white: 'logo-white',
    dark: 'logo-dark',
  };

  const logoClasses = ['logo', sizeClasses[size], variantClasses[variant], className]
    .filter(Boolean)
    .join(' ');

  const LogoIcon = () => (
    <div className="logo-icon">
      <img
        src="/mangaloo-logo.jpg"
        alt="Mangaloo Logo"
        className="logo-img"
        onError={(e) => {
          console.error('Failed to load logo:', e);
          e.target.style.display = 'none';
        }}
      />
    </div>
  );

  const LogoText = () => <span className="logo-text">Mangaloo</span>;

  const LogoContent = () => (
    <>
      <LogoIcon />
      {showText && <LogoText />}
    </>
  );

  if (onClick) {
    return (
      <button className={`${logoClasses} logo-button`} onClick={onClick} aria-label="Mangaloo Logo">
        <LogoContent />
      </button>
    );
  }

  return (
    <div className={logoClasses}>
      <LogoContent />
    </div>
  );
};

export default Logo;
