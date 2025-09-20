import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Shield } from 'lucide-react';
import { Account } from '../../types/financial';

interface AccountTreeNode {
  account: Account;
  children: AccountTreeNode[];
  level: number;
}

interface AccountTreeProps {
  accounts: Account[];
  onAccountSelect?: (account: Account) => void;
}

const AccountTree: React.FC<AccountTreeProps> = ({ accounts, onAccountSelect }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build proper hierarchical tree structure
  const buildTree = (): AccountTreeNode[] => {
    // Create a map of all accounts by ID for quick lookup
    const accountMap = new Map<string, Account>();
    accounts.forEach(account => {
      accountMap.set(account.id, account);
    });

    // Create nodes for all accounts
    const nodeMap = new Map<string, AccountTreeNode>();
    accounts.forEach(account => {
      nodeMap.set(account.id, {
        account,
        children: [],
        level: account.level || 1
      });
    });

    // Build parent-child relationships
    const rootNodes: AccountTreeNode[] = [];

    accounts.forEach(account => {
      const node = nodeMap.get(account.id);
      if (!node) return;

      if (account.parentId) {
        // Add as child to parent
        const parentNode = nodeMap.get(account.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        // Add as root node
        rootNodes.push(node);
      }
    });

    // Sort children by account code
    const sortChildren = (node: AccountTreeNode) => {
      node.children.sort((a, b) => a.account.code.localeCompare(b.account.code));
      node.children.forEach(child => sortChildren(child));
    };

    rootNodes.forEach(node => sortChildren(node));
    rootNodes.sort((a, b) => a.account.code.localeCompare(b.account.code));

    return rootNodes;
  };

  const treeData = buildTree();

  const toggleNode = (accountId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'text-blue-600',
      liability: 'text-red-600',
      equity: 'text-green-600',
      revenue: 'text-purple-600',
      expense: 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return types[type as keyof typeof types] || type;
  };

  const renderTreeNode = (node: AccountTreeNode, isChild: boolean = false) => {
    const isExpanded = expandedNodes.has(node.account.id);
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.account.id} className="mb-1">
        <div
          className={`flex items-center py-2 px-2 sm:px-3 rounded-md hover:bg-golden-50 cursor-pointer transition-professional overflow-hidden ${
            onAccountSelect ? 'hover:bg-golden-100' : ''
          }`}
          onClick={() => onAccountSelect?.(node.account)}
          style={{ marginRight: `${isChild ? 20 : 0}px` }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.account.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" /> // Spacer for alignment
          )}
          
          <div className="flex-1 flex items-center">
            {/* Account Icon */}
            <div className="mr-2">
              {hasChildren ? (
                <Folder className={`h-4 w-4 ${getAccountTypeColor(node.account.type)}`} />
              ) : (
                <FileText className={`h-4 w-4 ${getAccountTypeColor(node.account.type)}`} />
              )}
            </div>
            
            {/* Account Code and Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1">
                <span className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                  {node.account.code}
                </span>
                <span className="text-gray-700 text-sm sm:text-base truncate">
                  {node.account.name}
                </span>
                {node.account.isSystemAccount && (
                  <Shield className="h-3 w-3 text-blue-600 flex-shrink-0" aria-label="حساب نظام أساسي" />
                )}
                {node.account.nameEn && (
                  <span className="text-gray-500 text-xs sm:text-sm truncate">
                    ({node.account.nameEn})
                  </span>
                )}
              </div>
              
              {/* Account Type and Children Info */}
              <div className="flex items-center flex-wrap gap-1 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getAccountTypeColor(node.account.type)} bg-opacity-10`}>
                  {getAccountTypeLabel(node.account.type)}
                </span>
                {node.account.parentId && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    حساب فرعي
                  </span>
                )}
                {hasChildren && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {node.children.length} حساب فرعي
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-gray-500 text-sm text-left flex-shrink-0 min-w-0">
            <div className="font-medium text-xs sm:text-sm truncate">
              {node.account.balance?.toLocaleString()} {node.account.currency}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {node.account.balance && node.account.balance >= 0 ? 'مدين' : 'دائن'}
            </div>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">شجرة الحسابات</h3>
        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
          <div className="flex items-center">
            <Folder className="h-3 w-3 mr-1" />
            <span>حساب رئيسي</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            <span>حساب فرعي</span>
          </div>
        </div>
      </div>
      
      {treeData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>لا توجد حسابات لعرضها</p>
        </div>
      ) : (
        <div className="space-y-1">
          {treeData.map(node => renderTreeNode(node))}
        </div>
      )}
    </div>
  );
};

export default AccountTree;