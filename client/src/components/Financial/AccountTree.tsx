import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
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

  // Build tree structure from flat accounts array
  const buildTree = (): AccountTreeNode[] => {
    const accountMap = new Map<string, AccountTreeNode>();
    
    // Create nodes for all accounts
    accounts.forEach(account => {
      accountMap.set(account.id, {
        account,
        children: [],
        level: account.level || 1
      });
    });
    
    // Build parent-child relationships
    const rootNodes: AccountTreeNode[] = [];
    
    accounts.forEach(account => {
      const node = accountMap.get(account.id);
      if (!node) return;
      
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });
    
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

  const renderTreeNode = (node: AccountTreeNode) => {
    const isExpanded = expandedNodes.has(node.account.id);
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.account.id} className="mb-1">
        <div 
          className={`flex items-center py-2 px-3 rounded-md hover:bg-golden-50 cursor-pointer transition-professional ${
            onAccountSelect ? 'hover:bg-golden-100' : ''
          }`}
          onClick={() => onAccountSelect?.(node.account)}
          style={{ marginRight: `${(node.level - 1) * 20}px` }}
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
            <span className="font-medium text-gray-900 ml-2">
              {node.account.code}
            </span>
            <span className="text-gray-700">
              {node.account.name}
            </span>
            {node.account.nameEn && (
              <span className="text-gray-500 text-sm mr-2">
                ({node.account.nameEn})
              </span>
            )}
          </div>
          
          <div className="text-gray-500 text-sm">
            {node.account.balance?.toLocaleString()} {node.account.currency}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">شجرة الحسابات</h3>
      <div className="space-y-1">
        {treeData.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
};

export default AccountTree;