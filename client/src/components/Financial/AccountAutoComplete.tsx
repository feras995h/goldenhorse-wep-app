import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { financialAPI } from '../../services/api';

interface Account {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  level: number;
  isGroup: boolean;
  balance: number;
  currency: string;
  displayName: string;
  value: string;
  label: string;
}

interface AccountAutoCompleteProps {
  value?: string;
  onChange: (account: Account | null) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  subAccountsOnly?: boolean;
  accountType?: string;
  label?: string;
  showBalance?: boolean;
  allowClear?: boolean;
}

const AccountAutoComplete: React.FC<AccountAutoCompleteProps> = ({
  value,
  onChange,
  placeholder = "ابحث عن الحساب...",
  className = "",
  error,
  required = false,
  disabled = false,
  subAccountsOnly = false,
  accountType,
  label,
  showBalance = true,
  allowClear = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial account if value is provided
  useEffect(() => {
    if (value && !selectedAccount) {
      loadAccountById(value);
    }
  }, [value]);

  // Search for accounts when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchAccounts();
    } else {
      setAccounts([]);
    }
  }, [searchTerm, subAccountsOnly, accountType]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAccountById = async (accountId: string) => {
    try {
      const response = await financialAPI.get(`/accounts/${accountId}`);
      if (response.data.success) {
        const account = response.data.data;
        const formattedAccount: Account = {
          id: account.id,
          code: account.code,
          name: account.name,
          nameEn: account.nameEn,
          type: account.type,
          level: account.level,
          isGroup: account.isGroup,
          balance: parseFloat(account.balance || 0),
          currency: account.currency || 'LYD',
          displayName: `${account.code} - ${account.name}`,
          value: account.id,
          label: `${account.code} - ${account.name}`
        };
        setSelectedAccount(formattedAccount);
        setSearchTerm(formattedAccount.displayName);
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  const searchAccounts = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params: any = {
        search: searchTerm,
        limit: 20
      };

      if (subAccountsOnly) {
        params.subAccountsOnly = true;
      }

      if (accountType) {
        params.type = accountType;
      }

      const response = await financialAPI.get('/accounts/autocomplete', { params });
      
      if (response.data.success) {
        setAccounts(response.data.data || []);
        setHighlightedIndex(-1);
      }
    } catch (error) {
      console.error('Error searching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if input is cleared
    if (!newValue && selectedAccount) {
      setSelectedAccount(null);
      onChange(null);
    }
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setSearchTerm(account.displayName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(account);
  };

  const handleClear = () => {
    setSelectedAccount(null);
    setSearchTerm('');
    setAccounts([]);
    setIsOpen(false);
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < accounts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && accounts[highlightedIndex]) {
          handleAccountSelect(accounts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-purple-600';
      case 'revenue': return 'text-green-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return 'أصول';
      case 'liability': return 'التزامات';
      case 'equity': return 'حقوق ملكية';
      case 'revenue': return 'إيرادات';
      case 'expense': return 'مصروفات';
      default: return type;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          
          <div className="absolute left-2 top-2.5 flex items-center space-x-1">
            {loading && (
              <div className="animate-spin h-4 w-4 border-2 border-golden-500 border-t-transparent rounded-full"></div>
            )}
            
            {!loading && (
              <>
                {allowClear && selectedAccount && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                <Search className="h-4 w-4 text-gray-400" />
              </>
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && accounts.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {accounts.map((account, index) => (
              <button
                key={account.id}
                type="button"
                onClick={() => handleAccountSelect(account)}
                className={`w-full px-3 py-2 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex ? 'bg-golden-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="text-right flex-1">
                    <div className="font-medium text-gray-900">
                      {account.code} - {account.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center justify-end space-x-2 space-x-reverse">
                      <span className={getAccountTypeColor(account.type)}>
                        {getAccountTypeLabel(account.type)}
                      </span>
                      {account.level > 1 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          مستوى {account.level}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {showBalance && (
                    <div className="text-left ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {(isNaN(account.balance) || !isFinite(account.balance) ? 0 : account.balance).toLocaleString('ar-LY')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.currency}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && searchTerm.length >= 2 && accounts.length === 0 && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
            <p className="text-gray-500 text-center">لا توجد حسابات مطابقة</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default AccountAutoComplete;
