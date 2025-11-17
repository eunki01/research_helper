import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { cytoscapeStyles } from '../../styles/cytoscapeStyles';
import type { PaperGraph } from '../../types/visualization';
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
  score: number;
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

// ==================== 유틸리티 함수들 ====================
class GraphUtils {
  /**
   * 고정된 노드를 고려하여 연결된 노드들을 찾는 BFS 함수
   */
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
      
      // 현재 노드가 고정된 노드라면 더 이상 탐색하지 않음
      if (lockedNodeIds.has(currentNodeId)) {
        continue;
      }
      
      // 고정된 노드가 아닌 경우에만 연결된 엣지들을 탐색
      if (!lockedNodeIds.has(currentNodeId)) {
        const edges = currentNode.connectedEdges();
        for (const edge of edges) {
          const source = edge.source();
          const target = edge.target();
          const neighbor = source.id() === currentNodeId ? target : source;
          const neighborId = neighbor.id();
          
          if (neighborId && !visited.has(neighborId)) {
            visited.add(neighborId);
            
            // 고정된 노드라면 추가하지 않고 탐색도 중단
            if (lockedNodeIds.has(neighborId)) {
              // 고정된 노드는 visited에만 추가하고 더 이상 탐색하지 않음
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

  /**
   * 고정된 노드들의 ID를 수집
   */
  static getLockedNodeIds(cy: cytoscape.Core): Set<string> {
    const lockedNodeIds = new Set<string>();
    cy.nodes().forEach(node => {
      if (node.locked()) {
        lockedNodeIds.add(node.id());
      }
    });
    return lockedNodeIds;
  }

  /**
   * 연결된 노드들만 하이라이트
   */
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

  /**
   * 모든 하이라이트 제거
   */
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
  isExpanding: boolean;
}

const GraphComponent: React.FC<GraphComponentProps> = ({
  graph,
  onNodeClick,
  selectedNodeId,
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

  // 노드 크기 계산
  const nodeSizeConfig = useMemo(() => {
    return calculateNodeSize(graph.nodes.length);
  }, [graph.nodes.length]);

  // Cytoscape elements 생성 함수
  const createCytoscapeElements = useCallback(() => {
    try {
      const cytoscapeElements: cytoscape.ElementDefinition[] = [];
      
      // 노드 추가
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
      
      // 노드 ID 집합 생성
      const nodeIds = new Set(graph.nodes.map(node => node.id));
      
      // 엣지 추가 (유효한 엣지만)
      graph.edges.forEach(edge => {
        // source와 target이 모두 존재하는지 확인
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
          cytoscapeElements.push({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              score: edge.similarity, // 두 필드 모두 지원
              type: edge.type
            }
          });
        } else {
          console.warn(`Invalid edge skipped: ${edge.source} -> ${edge.target} (node not found)`);
        }
      });
      
      return cytoscapeElements;
    } catch (error) {
      console.error('Cytoscape elements 생성 중 오류:', error);
      return [];
    }
  }, [graph, nodeSizeConfig]);

  // Cytoscape elements 생성
  const elements = useMemo(() => createCytoscapeElements(), [createCytoscapeElements]);

  // ==================== D3 시뮬레이션 설정 ====================
  const setupSimulation = useCallback((cy: cytoscape.Core) => {
    // 기존 시뮬레이션 정리
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 노드와 링크 데이터 준비
    const nodes: D3Node[] = graph.nodes.map(node => {
      // 기존 Cytoscape에서 노드 위치 가져오기
      const existingNode = cy.getElementById(node.id);
      let x: number;
      let y: number;
      
      if (existingNode.nonempty()) {
        const pos = existingNode.position();
        x = pos.x;
        y = pos.y;
      } else {
        // 새 노드의 경우 화면 중앙 근처에 생성
        const angle = Math.random() * 2 * Math.PI;
        const radius = 80 + Math.random() * 80; // 화면 중앙에서 80-160px 반경
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }

      return {
        id: node.id,
        x,
        y,
        fx: null,
        fy: null,
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
    
    // 노드 개수에 따른 force 파라미터 계산
    const forceParams = calculateForceParameters(graph.nodes.length);
    
    // D3 시뮬레이션 생성 (고정된 노드 고려)
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
          // 고정된 노드를 거친 링크는 완전히 차단
          if (lockedNodeIds.has(d.source.id) || lockedNodeIds.has(d.target.id)) {
            return 0; // 고정된 노드를 거친 링크는 힘을 0으로 설정
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
    
    // Cytoscape 위치 업데이트
    simulation.on("tick", () => {
      if (cy && !cy.destroyed()) {
        try {
          cy.batch(() => {
            nodes.forEach(node => {
              if (!node.locked && node.fx === null && node.fy === null) {
                const cyNode = cy.getElementById(node.id);
                if (cyNode.nonempty()) {
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

    // 시뮬레이션 시작 - 더 강하게 시작하고 더 오래 실행되도록
    simulation.alpha(0.8).alphaTarget(0.05).restart();
  }, [graph, cy]);

  // ==================== 이벤트 핸들러들 ====================
  const handleMouseOver = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    if (node.locked()) return;
    
    // 호버 클래스 추가
    node.addClass('hover');
    
    const nodeData = node.data();
    setTooltip({ 
      visible: true, 
      content: `<strong>${nodeData.type === 'paper' ? '논문' : '저자'}:</strong> ${nodeData.label}<br><strong>저자:</strong> ${nodeData.authors?.map((a: any) => a.name).join(', ') || 'N/A'}<br><strong>연도:</strong> ${nodeData.publication_date || 'N/A'}`, 
      x: event.renderedPosition.x, 
      y: event.renderedPosition.y 
    });
  }, []);

  const handleMouseOut = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    // 호버 클래스 제거
    node.removeClass('hover');
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleMouseMove = useCallback((event: cytoscape.EventObject) => {
    setTooltip(prev => ({ ...prev, x: event.renderedPosition.x, y: event.renderedPosition.y }));
  }, []);

  const handleTapStart = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    if (node.locked()) node.unlock();
    
    // D3 노드 위치 고정 (드래그 준비만)
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) {
      d3Node.fx = node.position().x;
      d3Node.fy = node.position().y;
      d3Node.locked = false;
    }
    
    // 클릭만으로는 시뮬레이션 재시작하지 않음
    // 실제 드래그가 시작될 때만 재시작
  }, [cy]);

  const handleGrab = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    
    // 실제 드래그가 시작될 때만 시뮬레이션 재시작 및 하이라이트
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragStart).restart();
    
    // 연결된 노드들 하이라이트
    const lockedNodeIds = GraphUtils.getLockedNodeIds(cy);
    const connectedNodeIds = GraphUtils.findConnectedNodes(node.id(), cy, lockedNodeIds);
    GraphUtils.highlightConnectedNodes(cy, connectedNodeIds);
  }, [cy]);

  const handleDrag = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    
    // 고정된 노드를 드래그할 때 자동으로 고정 해제
    if (node.locked()) {
      node.unlock();
      const d3Node = nodesRef.current.find(n => n.id === node.id());
      if (d3Node) { 
        d3Node.locked = false; 
      }
    }
    
    const draggedPos = node.position();
    
    // D3 노드 위치 업데이트
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) {
      d3Node.fx = draggedPos.x;
      d3Node.fy = draggedPos.y;
    }
    
    // 연결된 노드들에 대해 강한 링크 힘 적용
    const lockedNodeIds = GraphUtils.getLockedNodeIds(cy);
    const connectedNodeIds = GraphUtils.findConnectedNodes(node.id(), cy, lockedNodeIds);
    
    const forceParams = calculateForceParameters(graph.nodes.length);
    simulationRef.current.force("link", d3.forceLink(linksRef.current)
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
        // 고정된 노드를 거친 링크는 완전히 차단
        if (lockedNodeIds.has(d.source.id) || lockedNodeIds.has(d.target.id)) {
          return 0; // 고정된 노드를 거친 링크는 힘을 0으로 설정
        }
        
        // 드래그 중인 노드와 연결된 엣지는 더 강한 힘 적용
        if (connectedNodeIds.has(d.source.id) || connectedNodeIds.has(d.target.id)) {
          return 1.2;
        }
        return 0.3;
      })
    );
    
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragMove).restart();
  }, [cy]);

  const handleFree = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    
    const node = event.target as cytoscape.NodeSingular;
    
    // 드래그된 노드 고정
    if (!node.locked()) node.lock();
    
    // D3 노드 위치 해제
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) {
      d3Node.fx = null;
      d3Node.fy = null;
      d3Node.locked = true;
    }
    
    // 하이라이트 제거
    GraphUtils.clearHighlights(cy);
    
    // 링크 강도 복원 및 시뮬레이션 정리 (고정된 노드 고려)
    const lockedNodeIds = GraphUtils.getLockedNodeIds(cy);
    const forceParams = calculateForceParameters(graph.nodes.length);
    simulationRef.current.force("link", d3.forceLink(linksRef.current)
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
        // 고정된 노드를 거친 링크는 완전히 차단
        if (lockedNodeIds.has(d.source.id) || lockedNodeIds.has(d.target.id)) {
          return 0; // 고정된 노드를 거친 링크는 힘을 0으로 설정
        }
        return BASE_SIMULATION_CONFIG.link.strength;
      })
    );
    
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragEnd).restart();
  }, [cy]);

  const handleDblClick = useCallback((event: cytoscape.EventObject) => {
    if (!cy) return;
    
    const node = event.target;
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
  }, [cy]);


  // 단일 클릭으로 사이드 패널 정보 표시
  const handleNodeSingleClick = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    // 사이드 패널에 노드 정보 표시 (확장하지 않음)
    node.addClass('selected');
    setTimeout(() => {
      node.removeClass('selected');
    }, 300);
    
    // 사이드 패널 정보 업데이트를 위한 이벤트 발생
    const customEvent = new CustomEvent('nodeSelect', { 
      detail: { nodeId: node.id(), nodeData: node.data() } 
    });
    window.dispatchEvent(customEvent);
  }, []);

  // ==================== 이벤트 리스너 등록 ====================
  useEffect(() => {
    if (cy) {
      // 로딩 중일 때는 사용자 상호작용 비활성화
      if (isExpanding) {
        cy.userPanningEnabled(false);
        cy.userZoomingEnabled(false);
        cy.boxSelectionEnabled(false);
        cy.nodes().ungrabify(); // 노드 드래그 비활성화
      } else {
        cy.userPanningEnabled(true);
        cy.userZoomingEnabled(true);
        cy.boxSelectionEnabled(true);
        cy.nodes().grabify(); // 노드 드래그 활성화
      }

      setupSimulation(cy);
      
      // 이벤트 리스너 등록
      cy.on('mouseover', 'node', handleMouseOver);
      cy.on('mouseout', 'node', handleMouseOut);
      cy.on('mousemove', 'node', handleMouseMove);
      cy.on('tapstart', 'node', handleTapStart);
      cy.on('grab', 'node', handleGrab);
      cy.on('drag', 'node', handleDrag);
      cy.on('free', 'node', handleFree);
      cy.on('dblclick', 'node', handleDblClick);
      cy.on('tap', 'node', handleNodeSingleClick);

      // 클린업
      return () => {
        if (!cy.destroyed()) {
          cy.off('mouseover', 'node', handleMouseOver);
          cy.off('mouseout', 'node', handleMouseOut);
          cy.off('mousemove', 'node', handleMouseMove);
          cy.off('tapstart', 'node', handleTapStart);
          cy.off('grab', 'node', handleGrab);
          cy.off('drag', 'node', handleDrag);
          cy.off('free', 'node', handleFree);
          cy.off('dblclick', 'node', handleDblClick);
          cy.off('tap', 'node', handleNodeSingleClick);
          
          try { 
            simulationRef.current?.stop();
          } catch {}
        }
      };
    }
  }, [cy, setupSimulation, handleMouseOver, handleMouseOut, handleMouseMove, handleTapStart, handleGrab, handleDrag, handleFree, handleDblClick]);

  // ==================== 그래프 변경 시 시뮬레이션 재시작 ====================
  useEffect(() => {
    if (cy && !isExpanding) {
      // 그래프가 변경될 때마다 시뮬레이션 재시작 (로딩 중이 아닐 때만)
      setupSimulation(cy);
      
      // 새로운 노드들이 추가되면 화면 중앙으로 맞춤
      setTimeout(() => {
        cy.fit(undefined, 50);
      }, 100); // 시뮬레이션이 시작된 후 약간의 지연을 두고 맞춤
    }
  }, [graph.nodes.length, graph.edges.length, cy, setupSimulation, isExpanding]);

  // ==================== 스타일 정의 ====================
  const stylesheet = useMemo(() => cytoscapeStyles, []);

  const handleCy = useCallback((cyInstance: cytoscape.Core) => { 
    if (cy !== cyInstance) {
      setCy(cyInstance);
      
      // Cytoscape가 준비되면 화면 중앙으로 맞춤
      cyInstance.ready(() => {
        cyInstance.fit(undefined, 50); // 50px 패딩으로 모든 노드를 화면 중앙에 맞춤
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
