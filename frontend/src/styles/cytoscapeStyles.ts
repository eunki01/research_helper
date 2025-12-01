// src/styles/cytoscapeStyles.ts

// 스타일 인터페이스 직접 정의
interface GraphStyle {
  selector: string;
  style: {
    [key: string]: string | number | number[] | ((node: any) => string | number);
  };
}

export const cytoscapeStyles: GraphStyle[] = [
  // 기본 노드 스타일 (반응형 크기)
  {
    selector: 'node',
    style: {
      'background-color': '#ffffff',
      'border-width': 2,
      'border-color': '#94a3b8', // slate-400
      'label': 'data(displayLabel)', // 짧은 제목 사용
      'text-valign': 'center',       // 수직 중앙 정렬 (노드 내부)
      'text-halign': 'center',       // 수평 중앙 정렬
      'text-wrap': 'wrap',           // 텍스트 줄바꿈 허용
      'text-max-width': '80px',      // 텍스트 최대 너비 제한
      'font-size': '10px',           // 내부 텍스트에 맞게 폰트 크기 조정
      'color': '#334155',            // 텍스트 색상
      'width': 'data(nodeSize)',
      'height': 'data(nodeSize)',
      'transition-property': 'background-color, border-color, border-width, width, height, shadow-opacity',
      'transition-duration': 200
    }
  },

  // 고정된(Pinned) 노드 스타일
  {
    selector: 'node.pinned',
    style: {
      'background-color': '#eff6ff', // blue-50
      'border-width': 4,
      'border-color': '#2563eb', // blue-600
      'color': '#1e40af', // blue-800
      'font-weight': 'bold',
      'z-index': 999
    }
  },

  // 기본 엣지 스타일
  {
    selector: 'edge',
    style: {
      'width': 2,
      'curve-style': 'bezier',
      'target-arrow-shape': 'none', // 기본 화살표 없음
      'line-color': '#cbd5e1',
      'target-arrow-color': '#cbd5e1'
    }
  },
  
  // 중앙 노드 스타일
  {
    selector: 'node[type="central"]',
    style: {
      'background-color': '#4f46e5',
      'width': '80px',
      'height': '80px',
      'font-size': '12px',
      'text-outline-color': '#3730a3'
    }
  },
  
  // 고정된 노드 스타일
  {
    selector: 'node:locked',
    style: {
      'border-width': '3px',
      'border-color': '#fbbf24'
    }
  },
  
  // 인용 관계 엣지 스타일
  {
    selector: 'edge[type="citation"]',
    style: {
      'width': 3,
      'line-style': 'solid',
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'target-arrow-shape': 'triangle', // 화살표 모양 (필수)
      'arrow-scale': 1.2
    }
  },
  
  // 유사성 관계 엣지 스타일
  {
    selector: 'edge[type="similarity"]',
    style: {
      'width': 'mapData(score, 0, 1, 1, 5)', // 유사도(0~1)에 따라 1px ~ 5px
      'line-style': 'dashed',
      'line-dash-pattern': [6, 3], // 점선 패턴
      'line-color': 'mapData(score, 0, 1, #cbd5e1, #059669)',
      'target-arrow-shape': 'none'
    }
  },
  
  // 높은 점수 엣지 스타일
  {
    selector: 'edge[score > 0.85]',
    style: {
      'width': 4
    }
  },
  
  // 하이라이트된 노드 스타일
  {
    selector: 'node.highlight',
    style: {
      'border-width': 3,
      'border-color': '#f59e0b',
      'background-color': '#f59e0b'
    }
  },
  
  // 하이라이트된 엣지 스타일
  {
    selector: 'edge.highlight',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      'width': 4
    }
  },
  
  // 페이드된 노드 스타일
  {
    selector: 'node.faded',
    style: {
      'opacity': 0.25
    }
  },
  
  // 페이드된 엣지 스타일
  {
    selector: 'edge.faded',
    style: {
      'opacity': 0.15
    }
  },
  
  // 클릭 효과
  {
    selector: 'node.clicked',
    style: {
      'border-width': '4px',
      'border-color': '#3B82F6',
      'background-color': '#DBEAFE',
      'transition-property': 'border-width, border-color, background-color',
      'transition-duration': '0.2s'
    }
  },
  
  // 호버 효과 (Cytoscape에서는 :hover 대신 클래스를 사용)
  {
    selector: 'node.hover',
    style: {
      'border-width': '3px',
      'border-color': '#6B7280',
      'background-color': '#F3F4F6'
    }
  },
  
  // 선택된 노드 스타일
  {
    selector: 'node.selected',
    style: {
      'border-width': '4px',
      'border-color': '#10B981',
      'background-color': '#D1FAE5'
    }
  }
];

// 테마별 스타일 정의
export const themes = {
  light: {
    nodeBackground: '#94a3b8',
    nodeText: '#ffffff',
    nodeOutline: '#64748b',
    edgeColor: '#cbd5e1',
    centralNode: '#4f46e5',
    lockedNode: '#fbbf24',
    highlight: '#f59e0b',
    citation: '#2563eb',
    similarity: '#16a34a'
  },
  dark: {
    nodeBackground: '#374151',
    nodeText: '#f9fafb',
    nodeOutline: '#1f2937',
    edgeColor: '#4b5563',
    centralNode: '#6366f1',
    lockedNode: '#f59e0b',
    highlight: '#f97316',
    citation: '#3b82f6',
    similarity: '#10b981'
  }
};

// 테마 적용 함수
export const applyTheme = (theme: keyof typeof themes) => {
  const themeColors = themes[theme];
  
  return cytoscapeStyles.map(style => {
    if (style.selector === 'node') {
      return {
        ...style,
        style: {
          ...style.style,
          'background-color': themeColors.nodeBackground,
          'color': themeColors.nodeText,
          'text-outline-color': themeColors.nodeOutline
        }
      };
    }
    
    if (style.selector === 'edge') {
      return {
        ...style,
        style: {
          ...style.style,
          'line-color': themeColors.edgeColor,
          'target-arrow-color': themeColors.edgeColor
        }
      };
    }
    
    if (style.selector === 'node[type="central"]') {
      return {
        ...style,
        style: {
          ...style.style,
          'background-color': themeColors.centralNode
        }
      };
    }
    
    if (style.selector === 'node:locked') {
      return {
        ...style,
        style: {
          ...style.style,
          'border-color': themeColors.lockedNode
        }
      };
    }
    
    if (style.selector === 'node.highlight') {
      return {
        ...style,
        style: {
          ...style.style,
          'border-color': themeColors.highlight,
          'background-color': themeColors.highlight
        }
      };
    }
    
    if (style.selector === 'edge.highlight') {
      return {
        ...style,
        style: {
          ...style.style,
          'line-color': themeColors.highlight,
          'target-arrow-color': themeColors.highlight
        }
      };
    }
    
    if (style.selector === 'edge[type="citation"]') {
      return {
        ...style,
        style: {
          ...style.style,
          'line-color': themeColors.citation,
          'target-arrow-color': themeColors.citation
        }
      };
    }
    
    if (style.selector === 'edge[type="similarity"]') {
      return {
        ...style,
        style: {
          ...style.style,
          'line-color': themeColors.similarity,
          'target-arrow-color': themeColors.similarity
        }
      };
    }
    
    return style;
  });
};

