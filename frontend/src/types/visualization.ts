// 시각화 관련 타입 정의

import type { PaperGraph } from './paper';

export interface VisualizationState {
  currentViewIndex: number;
  views: VisualizationView[];
  maxViews: number;
}

export interface VisualizationView {
  id: string;
  title: string;
  graph: PaperGraph;
  createdAt: string;
  breadcrumbPath: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  id: string;
  title: string;
  query?: string;
  timestamp: string;
}

export interface NodeInteraction {
  nodeId: string;
  action: 'click' | 'hover' | 'drag';
  timestamp: string;
}

export interface GraphControls {
  zoom: number;
  pan: { x: number; y: number };
  showLabels: boolean;
  showEdges: boolean;
  nodeSize: 'small' | 'medium' | 'large';
}

export interface ThemeConfig {
  mode: 'internal' | 'external';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    background: string;
  };
}

// Re-export from paper.ts
export type { PaperGraph, PaperNode, PaperEdge } from './paper';
