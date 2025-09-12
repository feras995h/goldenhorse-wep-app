import React, { useState, useEffect } from 'react';

interface LoginLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const LoginLogo: React.FC<LoginLogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  useEffect(() => {
    checkForCustomLogo();

    // Listen for logo update events
    const handleLogoUpdate = () => {
      checkForCustomLogo();
    };

    // Listen for custom logo update event
    window.addEventListener('logoUpdated', handleLogoUpdate);

    // Also check periodically in case of updates from other tabs
    const interval = setInterval(checkForCustomLogo, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
      clearInterval(interval);
    };
  }, []);

  const checkForCustomLogo = async () => {
    try {
      // For login page, we'll try to get the logo without authentication
      // but handle errors gracefully and fall back to default logo
      const timestamp = Date.now();
      const response = await fetch(`/api/settings/logo?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/*'
        }
      });

      if (response.ok) {
        // If we get a successful response, use the logo URL with timestamp
        setCustomLogoUrl(`/api/settings/logo?t=${timestamp}`);
        setLogoError(false);
      } else {
        // No custom logo available or authentication required, use default
        setCustomLogoUrl(null);
        setLogoError(false);
      }
    } catch (error) {
      // If there's an error (including network errors), use the default logo
      // Don't log the error to avoid console spam on login page
      setCustomLogoUrl(null);
      setLogoError(false);
    }
  };

  const handleLogoError = () => {
    setLogoError(true);
    setCustomLogoUrl(null);
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo - Custom or Default */}
      <div className={`${sizeClasses[size]} relative`}>
        {customLogoUrl && !logoError ? (
          <img
            src={customLogoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
            onError={handleLogoError}
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-2xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* خلفية دائرية ذهبية محسنة */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="url(#goldGradient)"
              stroke="url(#goldBorder)"
              strokeWidth="3"
            />
            
            {/* دائرة داخلية للعمق */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="url(#innerGold)"
              opacity="0.8"
            />

            {/* رأس الحصان المحسن */}
            <path
              d="M25 35 C30 20, 45 18, 50 30 C55 18, 70 20, 75 35 C75 48, 70 58, 65 63 C60 68, 55 72, 50 67 C45 72, 40 68, 35 63 C30 58, 25 48, 25 35 Z"
              fill="url(#horseDark)"
              stroke="#1F2937"
              strokeWidth="1.5"
            />

            {/* تفاصيل الوجه */}
            <ellipse cx="42" cy="42" rx="4" ry="3" fill="#F59E0B" />
            <ellipse cx="58" cy="42" rx="4" ry="3" fill="#F59E0B" />
            <circle cx="42" cy="42" r="1.5" fill="#FFFFFF" />
            <circle cx="58" cy="42" r="1.5" fill="#FFFFFF" />

            {/* عرف الحصان المحسن */}
            <path
              d="M35 20 C40 12, 45 15, 50 10 C55 15, 60 12, 65 20 C62 28, 57 25, 50 28 C43 25, 38 28, 35 20 Z"
              fill="url(#horseDark)"
              stroke="#1F2937"
              strokeWidth="1"
            />
            
            {/* أنف الحصان */}
            <ellipse cx="50" cy="55" rx="3" ry="2" fill="#374151" />
            
            {/* نمط زخرفي ذهبي */}
            <circle cx="50" cy="75" r="2" fill="#F59E0B" opacity="0.7" />
            <circle cx="45" cy="78" r="1" fill="#F59E0B" opacity="0.5" />
            <circle cx="55" cy="78" r="1" fill="#F59E0B" opacity="0.5" />

            {/* التدرجات المحسنة */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="25%" stopColor="#FCD34D" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="75%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              
              <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
              
              <linearGradient id="innerGold" x1="30%" y1="30%" x2="70%" y2="70%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
              
              <linearGradient id="horseDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="50%" stopColor="#1F2937" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
      
      {/* النص */}
      {showText && (
        <div className="mr-3">
          <div className={`font-bold bg-gradient-to-r from-golden-600 to-golden-800 bg-clip-text text-transparent ${textSizes[size]} drop-shadow-sm`}>
            الحصان الذهبي
          </div>
          {size !== 'sm' && (
            <div className={`text-golden-600 font-medium ${size === 'xl' ? 'text-sm' : 'text-xs'} drop-shadow-sm`}>
              Golden Horse
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginLogo;
