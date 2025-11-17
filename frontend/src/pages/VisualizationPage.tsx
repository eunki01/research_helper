import React from 'react';
import CarouselContainer from '../components/carousel/CarouselContainer';
import VisualizationSlide from '../components/carousel/VisualizationSlide';
import type { VisualizationView } from '../types/visualization';

interface VisualizationPageProps {
  views: VisualizationView[];
  currentViewIndex: number;
  onNodeClick: (nodeId: string) => Promise<void>;
  onNavigateToView: (viewIndex: number) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({
  views,
  currentViewIndex,
  onNodeClick,
  onNavigateToView
}) => {
  return (
    <CarouselContainer
      views={views}
      currentViewIndex={currentViewIndex}
      onNavigateToView={onNavigateToView}
    >
      {views.map((view, index) => (
        <VisualizationSlide
          key={view.id}
          view={view}
          onNodeClick={onNodeClick}
        />
      ))}
    </CarouselContainer>
  );
};

export default VisualizationPage;
