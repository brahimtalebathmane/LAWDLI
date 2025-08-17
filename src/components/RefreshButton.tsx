import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing = false,
  showText = true,
  size = 'md',
  variant = 'ghost'
}) => {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  };

  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        flex items-center gap-2 rounded-lg transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${variantClasses[variant]}
      `}
      title={t('refresh')}
    >
      <RefreshCw 
        className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {showText && (
        <span className="hidden sm:inline">
          {isRefreshing ? t('refreshing') : t('refresh')}
        </span>
      )}
    </button>
  );
};

export default RefreshButton;