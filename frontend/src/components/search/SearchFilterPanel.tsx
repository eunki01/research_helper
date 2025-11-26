import React from 'react';
import type { SearchFilters } from '../../types/search';

interface SearchFilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

const PUBLICATION_TYPES = ['Review', 'JournalArticle', 'Conference', 'Dataset', 'Book', 'Editorial'];
const FIELDS_OF_STUDY = ['Computer Science', 'Medicine', 'Biology', 'Physics', 'Mathematics', 'Psychology', 'Sociology'];

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({ filters, onChange, onClose }) => {
  
  const handleChange = (key: keyof SearchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = (key: 'publicationTypes' | 'fieldsOfStudy', item: string) => {
    const current = filters[key];
    const next = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange(key, next);
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-20 animate-fade-in-down">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
        <h3 className="font-bold text-gray-800">상세 필터 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 연도 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">연도 범위</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="시작 (YYYY)"
              value={filters.startYear}
              onChange={(e) => handleChange('startYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="종료 (YYYY)"
              value={filters.endYear}
              onChange={(e) => handleChange('endYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 저널/학회 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">저널/학회 (Venue)</label>
          <input
            type="text"
            placeholder="예: Nature, CVPR (콤마 구분)"
            value={filters.venues}
            onChange={(e) => handleChange('venues', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* 출판 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">출판 유형</label>
          <div className="flex flex-wrap gap-2">
            {PUBLICATION_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayItem('publicationTypes', type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.publicationTypes.includes(type)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 연구 분야 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">연구 분야</label>
          <div className="flex flex-wrap gap-2">
            {FIELDS_OF_STUDY.map(field => (
              <button
                key={field}
                type="button"
                onClick={() => toggleArrayItem('fieldsOfStudy', field)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.fieldsOfStudy.includes(field)
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 옵션 */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center">
        <label className="flex items-center cursor-pointer space-x-2">
          <input
            type="checkbox"
            checked={filters.isOpenAccess}
            onChange={(e) => handleChange('isOpenAccess', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Open Access (무료 PDF)만 검색</span>
        </label>
      </div>
    </div>
  );
};

export default SearchFilterPanel;