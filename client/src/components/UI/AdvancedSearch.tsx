import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, Star, FileText, Users, Building, DollarSign } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'user' | 'document' | 'financial' | 'customer';
  path: string;
  icon: React.ReactNode;
  relevance: number;
  lastAccessed?: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect: (result: SearchResult) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  onClose,
  onResultSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'لوحة التحكم المالية',
      description: 'عرض الإحصائيات والتقارير المالية',
      type: 'financial',
      path: '/financial',
      icon: <DollarSign className="h-4 w-4" />,
      relevance: 95,
      lastAccessed: 'منذ 5 دقائق'
    },
    {
      id: '2',
      title: 'إدارة الحسابات',
      description: 'إدارة حسابات العملاء والموردين',
      type: 'financial',
      path: '/financial/accounts',
      icon: <Building className="h-4 w-4" />,
      relevance: 88,
      lastAccessed: 'منذ ساعة'
    },
    {
      id: '3',
      title: 'قيود اليومية',
      description: 'إنشاء وإدارة قيود اليومية',
      type: 'financial',
      path: '/financial/journal',
      icon: <FileText className="h-4 w-4" />,
      relevance: 82,
      lastAccessed: 'منذ ساعتين'
    },
    {
      id: '4',
      title: 'إدارة العملاء',
      description: 'إدارة بيانات العملاء والاتصالات',
      type: 'customer',
      path: '/financial/customers',
      icon: <Users className="h-4 w-4" />,
      relevance: 75,
      lastAccessed: 'منذ يوم'
    }
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            onResultSelect(results[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onResultSelect, onClose]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filteredResults);
      setIsLoading(false);
      setSelectedIndex(-1);
    }, 300);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      page: 'text-blue-600 bg-blue-50',
      user: 'text-green-600 bg-green-50',
      document: 'text-purple-600 bg-purple-50',
      financial: 'text-golden-600 bg-golden-50',
      customer: 'text-orange-600 bg-orange-50'
    };
    return colors[type as keyof typeof colors] || colors.page;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      page: 'صفحة',
      user: 'مستخدم',
      document: 'مستند',
      financial: 'مالي',
      customer: 'عميل'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div 
        ref={searchRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-golden-500 text-lg"
                placeholder="البحث في النظام..."
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">جاري البحث...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    index === selectedIndex
                      ? 'bg-golden-50 border border-golden-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onResultSelect(result)}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 space-x-reverse">
                        {result.lastAccessed && (
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 ml-1" />
                            {result.lastAccessed}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-gray-400">
                          <Star className="h-3 w-3 ml-1" />
                          {result.relevance}% تطابق
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد نتائج لـ "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-1">جرب كلمات بحث مختلفة</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ابدأ بالكتابة للبحث</p>
              <p className="text-sm text-gray-400 mt-1">يمكنك البحث في الصفحات والمستخدمين والمستندات</p>
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>استخدم ↑↓ للتنقل</span>
              <span>Enter للاختيار</span>
              <span>Esc للإغلاق</span>
            </div>
            <div>
              {results.length > 0 && (
                <span>{results.length} نتيجة</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
