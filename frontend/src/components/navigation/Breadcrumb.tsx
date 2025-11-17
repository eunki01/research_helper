import React from 'react';
import type { BreadcrumbItem } from '../../types/visualization';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (index: number) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <button
            onClick={() => onNavigate?.(index)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              index === items.length - 1
                ? 'bg-gray-100 text-gray-900 cursor-default'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            disabled={index === items.length - 1}
          >
            {item.title}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
