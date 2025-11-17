import React from 'react';
import type { VisualizationView } from '../../types/visualization';

interface CarouselContainerProps {
  views: VisualizationView[];
  currentViewIndex: number;
  onNavigateToView: (viewIndex: number) => void;
  children: React.ReactNode;
}

const CarouselContainer: React.FC<CarouselContainerProps> = ({
  views,
  currentViewIndex,
  onNavigateToView,
  children
}) => {
  const translateX = -currentViewIndex * 100;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Carousel 트랙 */}
      <div 
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(${translateX}%)` }}
      >
        {children}
      </div>

      {/* 네비게이션 인디케이터 */}
      {views.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {views.map((view, index) => (
            <button
              key={view.id}
              onClick={() => onNavigateToView(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentViewIndex 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* 이전/다음 버튼 */}
      {views.length > 1 && (
        <>
          {/* 이전 버튼 */}
          {currentViewIndex > 0 && (
            <button
              onClick={() => onNavigateToView(currentViewIndex - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 다음 버튼 */}
          {currentViewIndex < views.length - 1 && (
            <button
              onClick={() => onNavigateToView(currentViewIndex + 1)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* 화면 정보 표시 */}
      {views.length > 1 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 z-10">
          <span className="text-sm text-gray-600">
            {currentViewIndex + 1} / {views.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default CarouselContainer;
