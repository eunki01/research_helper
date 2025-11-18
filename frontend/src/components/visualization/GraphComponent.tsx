// src/components/visualization/GraphComponent.tsx

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { cytoscapeStyles } from '../../styles/cytoscapeStyles';
import type { PaperGraph } from '../../types/visualization'; // PaperEdge import
import { calculateNodeSize, calculateForceParameters } from '../../utils/nodeSizeCalculator';
import * as d3 from 'd3-force';

// ==================== 타입 정의 ====================
interface TooltipInfo {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface D3Node {
  id: string;
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
  locked: boolean;
  data: any;
}

interface D3Link {
  source: string;
  target: string;
  score: number; // D3에서는 score로 사용 (similarity 값을 복사)
  type: string;
}

// ==================== 상수 정의 ====================
const BASE_SIMULATION_CONFIG = {
  link: {
    strength: 0.8,
    distanceFactor: 50
  },
  charge: {
    baseStrength: -600
  },
  collide: {
    strength: 1.0
  },
  alpha: {
    initial: 0.4,
    dragStart: 0.8,
    dragMove: 0.3,
    dragEnd: 0.1,
    decay: 0.02,
    velocityDecay: 0.2
  }
} as const;

// ==================== 유틸리티 함수들 (변경 없음) ====================
class GraphUtils {
  static findConnectedNodes(
    startNodeId: string,
    cy: cytoscape.Core,
    lockedNodeIds: Set<string>
  ): Set<string> {
    const connectedNodeIds = new Set<string>();
    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (!currentNodeId) continue;
      
      const currentNode = cy.getElementById(currentNodeId);
      
      if (lockedNodeIds.has(currentNodeId)) {
        continue;
      }
      
      if (!lockedNodeIds.has(currentNodeId)) {
        const edges = currentNode.connectedEdges();
        for (const edge of edges.toArray()) { // .toArray() for iteration
          const source = edge.source();
          const target = edge.target();
          const neighbor = source.id() === currentNodeId ? target : source;
          const neighborId = neighbor.id();
          
          if (neighborId && !visited.has(neighborId)) {
            visited.add(neighborId);
            
            if (lockedNodeIds.has(neighborId)) {
              break;
            }
            
            connectedNodeIds.add(neighborId);
            queue.push(neighborId);
          }
        }
      }
    }
    
    return connectedNodeIds;
  }

  static getLockedNodeIds(cy: cytoscape.Core): Set<string> {
    const lockedNodeIds = new Set<string>();
    cy.nodes().forEach(node => {
      if (node.locked()) {
        lockedNodeIds.add(node.id());
      }
    });
    return lockedNodeIds;
  }

  static highlightConnectedNodes(cy: cytoscape.Core, connectedNodeIds: Set<string>): void {
    cy.batch(() => {
      cy.elements().removeClass('highlight');
      cy.nodes().forEach(node => {
        if (connectedNodeIds.has(node.id())) {
          node.addClass('highlight');
        }
      });
    });
  }

  static clearHighlights(cy: cytoscape.Core): void {
    cy.batch(() => {
      cy.elements().removeClass('highlight');
      cy.elements().removeClass('faded');
    });
  }
}

// ==================== 메인 컴포넌트 ====================
interface GraphComponentProps {
  graph: PaperGraph;
  onNodeClick?: (nodeId: string) => void; 
  selectedNodeId?: string;
  searchMode?: 'internal' | 'external';
  isExpanding: boolean; // ⭐️ 2. isExpanding prop 추가 (VisualizationSlide에서 받음)
}

const GraphComponent: React.FC<GraphComponentProps> = ({
  graph,
  onNodeClick, // ⭐️ 3. prop 받기
  selectedNodeId, // ⭐️ 4. prop 받기
  isExpanding
}) => {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const [tooltip, setTooltip] = useState<TooltipInfo>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  const nodeSizeConfig = useMemo(() => {
    return calculateNodeSize(graph.nodes.length);
  }, [graph.nodes.length]);

  const createCytoscapeElements = useCallback(() => {
    try {
      const cytoscapeElements: cytoscape.ElementDefinition[] = [];
      graph.nodes.forEach(node => {
        cytoscapeElements.push({
          data: {
            ...node.data,
            id: node.id,
            label: node.data.title,
            type: node.data.type,
            nodeSize: nodeSizeConfig.nodeSize,
            labelSize: nodeSizeConfig.labelSize,
            fontSize: nodeSizeConfig.fontSize
          }
        });
      });
      
      const nodeIds = new Set(graph.nodes.map(node => node.id));
      
      graph.edges.forEach(edge => {
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
          cytoscapeElements.push({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              score: edge.similarity,
              type: edge.type
            }
          });
        } else {
          console.warn(`Invalid edge skipped: ${edge.source} -> ${edge.target} (node not found)`);
        }
      });
      
      return cytoscapeElements;
    } catch (error) {
      console.error('Error creating Cytoscape elements:', error);
      return [];
    }
  }, [graph, nodeSizeConfig]);

  const elements = useMemo(() => createCytoscapeElements(), [createCytoscapeElements]);

  const setupSimulation = useCallback((cy: cytoscape.Core) => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const nodes: D3Node[] = graph.nodes.map(node => {
      const existingNode = cy.getElementById(node.id);
      let x = Math.random() * 400;
      let y = Math.random() * 400;
      
      if (existingNode.nonempty()) {
        const pos = existingNode.position();
        x = pos.x;
        y = pos.y;
      }

      return {
        id: node.id, x, y,
        fx: node.locked ? x : null, // ⭐️ 고정된 노드 위치 반영
        fy: node.locked ? y : null, // ⭐️ 고정된 노드 위치 반영
        locked: node.locked || false,
        data: node.data
      };
    });
    
    const links: D3Link[] = graph.edges
      .filter(edge => {
        const sourceExists = nodes.some(node => node.id === edge.source);
        const targetExists = nodes.some(node => node.id === edge.target);
        return sourceExists && targetExists;
      })
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        score: edge.similarity,
        type: edge.type
      }));
    
    nodesRef.current = nodes;
    linksRef.current = links;
    
    const forceParams = calculateForceParameters(graph.nodes.length);
    const lockedNodeIds = GraphUtils.getLockedNodeIds(cy);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          const score = d.score || 0.8;
          return Math.max(
            forceParams.linkDistance.min, 
            Math.min(
              forceParams.linkDistance.max, 
              forceParams.linkDistance.base - BASE_SIMULATION_CONFIG.link.distanceFactor * score
            )
          );
        })
        .strength((d: any) => {
          if (lockedNodeIds.has(d.source.id) || lockedNodeIds.has(d.target.id)) {
            return 0;
          }
          return BASE_SIMULATION_CONFIG.link.strength;
        })
      )
      .force("charge", d3.forceManyBody()
        .strength(forceParams.chargeStrength)
        .distanceMax(forceParams.distanceMax)
      )
      .force("collide", d3.forceCollide()
        .radius(forceParams.collisionRadius)
        .strength(BASE_SIMULATION_CONFIG.collide.strength)
      )
      .alpha(BASE_SIMULATION_CONFIG.alpha.initial)
      .alphaDecay(BASE_SIMULATION_CONFIG.alpha.decay)
      .velocityDecay(BASE_SIMULATION_CONFIG.alpha.velocityDecay);
    
    simulationRef.current = simulation;
    
    simulation.on("tick", () => {
      if (cy && !cy.destroyed()) {
        try {
          cy.batch(() => {
            nodes.forEach(node => {
              // ⭐️ 고정(locked)되었거나, D3에서 고정(fx/fy)된 노드는 위치 업데이트 안 함
              if (!node.locked && node.fx === null && node.fy === null) {
                const cyNode = cy.getElementById(node.id);
                if (cyNode.nonempty() && !cyNode.locked()) { // ⭐️ Cy 노드도 lock 확인
                  cyNode.position({ x: node.x, y: node.y });
                }
              }
            });
          });
        } catch (error) {
          console.warn('Cytoscape batch update failed:', error);
        }
      }
    });

    simulation.alpha(0.8).alphaTarget(0.05).restart();
  }, [graph, cy]); // ⭐️ cy를 의존성 배열에 추가

  // ==================== 이벤트 핸들러들 ====================
  const handleMouseOver = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    if (node.locked()) return;
    node.addClass('hover');
    
    const nodeData = node.data();
    // ⭐️ authors가 배열인지 확인 (eunki 브랜치 타입 호환성)
    const authorNames = Array.isArray(nodeData.authors) 
      ? nodeData.authors.map((a: any) => a.name).join(', ') 
      : (nodeData.authors || 'N/A');

    setTooltip({ 
      visible: true, 
      content: `<strong>${nodeData.type === 'paper' ? '논문' : '저자'}:</strong> ${nodeData.label}<br><strong>저자:</strong> ${authorNames}<br><strong>연도:</strong> ${nodeData.publicationDate || nodeData.publication_date || 'N/A'}`, // ⭐️ camelCase 우선
      x: event.renderedPosition.x, 
      y: event.renderedPosition.y 
    });
  }, []);

  const handleMouseOut = useCallback((event: cytoscape.EventObject) => {
    event.target.removeClass('hover');
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleMouseMove = useCallback((event: cytoscape.EventObject) => {
    setTooltip(prev => ({ ...prev, x: event.renderedPosition.x, y: event.renderedPosition.y }));
  }, []);

  const handleTapStart = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    const node = event.target as cytoscape.NodeSingular;
    
    // ⭐️ d3Node 찾기
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    
    // ⭐️ 고정된 노드를 드래그 시작하면 고정 해제
    if (node.locked()) {
        node.unlock();
        if (d3Node) {
            d3Node.locked = false; 
            d3Node.fx = null; 
            d3Node.fy = null;
        }
    }
    
    if (d3Node) {
      d3Node.fx = node.position().x;
      d3Node.fy = node.position().y;
    }
  }, [cy]);

  const handleGrab = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragStart).restart();
    
    const lockedNodeIds = GraphUtils.getLockedNodeIds(cy);
    const connectedNodeIds = GraphUtils.findConnectedNodes(node.id(), cy, lockedNodeIds);
    GraphUtils.highlightConnectedNodes(cy, connectedNodeIds);
  }, [cy]);

  const handleDrag = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    const draggedPos = node.position();
    
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) {
      d3Node.fx = draggedPos.x;
      d3Node.fy = draggedPos.y;
    }
    
    // ... (연결된 노드 힘 적용 로직 - 복잡도 증가로 일단 생략, d3Node 위치 고정만으로도 동작함)
    
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragMove).restart();
  }, [cy]);

  const handleFree = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    if (!node.locked()) node.lock(); // ⭐️ 드래그 끝나면 고정
    
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) {
      // ⭐️ D3 노드도 고정 상태(locked)로 업데이트
      d3Node.fx = node.position().x; // ⭐️ 고정 위치 업데이트
      d3Node.fy = node.position().y; // ⭐️ 고정 위치 업데이트
      d3Node.locked = true;
    }
    
    GraphUtils.clearHighlights(cy);
    
    // ... (링크 강도 복원 로직 - 일단 생략)
    
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragEnd).restart();
  }, [cy]);

  // ⭐️ 7. onNodeClick을 사용하는 dblclick 핸들러
  const handleDblClick = useCallback((event: cytoscape.EventObject) => {
    if (!cy) return;
    const node = event.target;
    
    // ⭐️ 8. 노드 확장 기능 호출 (prop이 있을 경우)
    if (onNodeClick) {
      onNodeClick(node.id()); // 비동기 함수 호출 (Promise)
    }
    
    // 더블클릭 시 고정/해제 토글 기능 (선택적: 필요하면 주석 해제)
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (node.locked()) {
      node.unlock();
      if (d3Node) { 
        d3Node.fx = null; 
        d3Node.fy = null; 
        d3Node.locked = false; 
      }
    } else {
      node.lock();
      if (d3Node) { 
        d3Node.fx = node.position().x; 
        d3Node.fy = node.position().y; 
        d3Node.locked = true; 
      }
    }
    if (simulationRef.current) {
      simulationRef.current.alpha(0.2).restart();
    }
  }, [cy, onNodeClick]); // ⭐️ onNodeClick 의존성 추가

  // ⭐️ 9. 단일 클릭(tap) 핸들러 (사이드바 정보 표시용)
  const handleNodeSingleClick = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    
    // ⭐️ 'selected' 클래스 사용 (스타일시트에 'node.selected' 정의됨)
    // node.addClass('selected');
    // setTimeout(() => {
    //   node.removeClass('selected');
    // }, 300);
    
    // 'selectedNodeId' prop으로 제어되므로 여기서는 이벤트만 방출
    
    const customEvent = new CustomEvent('nodeSelect', { 
      detail: { nodeId: node.id(), nodeData: node.data() } 
    });
    window.dispatchEvent(customEvent);
  }, []);

  // ==================== 이벤트 리스너 등록 ====================
  useEffect(() => {
    if (cy) {
      // ⭐️ 10. isExpanding prop으로 상호작용 제어
      if (isExpanding) {
        cy.userPanningEnabled(false);
        cy.userZoomingEnabled(false);
        cy.boxSelectionEnabled(false);
        cy.nodes().ungrabify();
      } else {
        cy.userPanningEnabled(true);
        cy.userZoomingEnabled(true);
        cy.boxSelectionEnabled(true);
        cy.nodes().grabify();
      }

      setupSimulation(cy);
      
      cy.on('mouseover', 'node', handleMouseOver);
      cy.on('mouseout', 'node', handleMouseOut);
      cy.on('mousemove', 'node', handleMouseMove);
      cy.on('tapstart', 'node', handleTapStart);
      cy.on('grab', 'node', handleGrab);
      cy.on('drag', 'node', handleDrag);
      cy.on('free', 'node', handleFree);
      cy.on('dblclick', 'node', handleDblClick); // ⭐️ dblclick 핸들러 등록
      cy.on('tap', 'node', handleNodeSingleClick); // ⭐️ tap 핸들러 등록

      return () => {
        if (!cy.destroyed()) {
          cy.off('mouseover', 'node', handleMouseOver);
          cy.off('mouseout', 'node', handleMouseOut);
          cy.off('mousemove', 'node', handleMouseMove);
          cy.off('tapstart', 'node', handleTapStart);
          cy.off('grab', 'node', handleGrab);
          cy.off('drag', 'node', handleDrag);
          cy.off('free', 'node', handleFree);
          cy.off('dblclick', 'node', handleDblClick); // ⭐️ 클린업
          cy.off('tap', 'node', handleNodeSingleClick); // ⭐️ 클린업
          
          try { 
            simulationRef.current?.stop();
          } catch {}
        }
      };
    }
    // ⭐️ 11. 의존성 배열에 핸들러, isExpanding, onNodeClick 추가
  }, [cy, setupSimulation, handleMouseOver, handleMouseOut, handleMouseMove, handleTapStart, handleGrab, handleDrag, handleFree, handleDblClick, handleNodeSingleClick, isExpanding, onNodeClick]);

  // ⭐️ 12. selectedNodeId prop에 따라 노드 스타일 변경
  useEffect(() => {
    if (cy) {
      cy.batch(() => {
        cy.nodes().removeClass('selected-permanent'); // 'selected'는 tap 효과일 수 있으니 다른 클래스명 사용
        if (selectedNodeId) {
          cy.getElementById(selectedNodeId).addClass('selected-permanent');
        }
      });
      // 'selected' 클래스 스타일을 cytoscapeStyles.ts에 'selected-permanent'로 복사/수정 필요
      //
      /*
      {
        selector: 'node.selected-permanent', // 'node.selected'와 동일한 스타일
        style: {
          'border-width': '4px',
          'border-color': '#10B981',
          'background-color': '#D1FAE5'
        }
      }
      */
    }
  }, [cy, selectedNodeId]); // ⭐️ selectedNodeId 변경 시 실행

  // ==================== 스타일 정의 ====================
  const stylesheet = useMemo(() => cytoscapeStyles, []);

  const handleCy = useCallback((cyInstance: cytoscape.Core) => { 
    if (cy !== cyInstance) {
      setCy(cyInstance);
      cyInstance.ready(() => {
        cyInstance.fit(undefined, 50);
      });
    }
  }, [cy]);

  return (
    <div className="relative w-full h-full bg-gray-50">
      {tooltip.visible && (
        <div 
          className="absolute p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm z-50 max-w-sm" 
          style={{ 
            left: `${tooltip.x + 15}px`, 
            top: `${tooltip.y + 15}px`, 
            pointerEvents: 'none', 
            transition: 'opacity 0.2s' 
          }} 
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={stylesheet}
        cy={handleCy}
      />
    </div>
  );
};

export default GraphComponent;