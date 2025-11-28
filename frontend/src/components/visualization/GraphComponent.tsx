// src/components/visualization/GraphComponent.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { cytoscapeStyles } from '../../styles/cytoscapeStyles';
import type { PaperGraph } from '../../types/visualization';
import { calculateNodeSize, calculateForceParameters } from '../../utils/nodeSizeCalculator';
import * as d3 from 'd3-force';

class GraphUtils {
  static findConnectedNodes(startNodeId: string, cy: cytoscape.Core, lockedNodeIds: Set<string>): Set<string> {
    const connectedNodeIds = new Set<string>();
    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (!currentNodeId) continue;
      const currentNode = cy.getElementById(currentNodeId);
      
      if (lockedNodeIds.has(currentNodeId)) continue;
      
      const edges = currentNode.connectedEdges();
      for (const edge of edges.toArray()) {
        const source = edge.source();
        const target = edge.target();
        const neighbor = source.id() === currentNodeId ? target : source;
        const neighborId = neighbor.id();
        
        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          if (lockedNodeIds.has(neighborId)) break;
          connectedNodeIds.add(neighborId);
          queue.push(neighborId);
        }
      }
    }
    return connectedNodeIds;
  }

  static getLockedNodeIds(cy: cytoscape.Core): Set<string> {
    const lockedNodeIds = new Set<string>();
    cy.nodes().forEach(node => { if (node.locked()) lockedNodeIds.add(node.id()); });
    return lockedNodeIds;
  }

  static highlightConnectedNodes(cy: cytoscape.Core, connectedNodeIds: Set<string>): void {
    cy.batch(() => {
      cy.elements().removeClass('highlight');
      cy.nodes().forEach(node => { if (connectedNodeIds.has(node.id())) node.addClass('highlight'); });
    });
  }

  static clearHighlights(cy: cytoscape.Core): void {
    cy.batch(() => { cy.elements().removeClass('highlight'); cy.elements().removeClass('faded'); });
  }
}

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

const BASE_SIMULATION_CONFIG = {
  link: { strength: 0.8, distanceFactor: 50 },
  charge: { baseStrength: -600 },
  collide: { strength: 1.0 },
  alpha: { initial: 0.4, dragStart: 0.8, dragMove: 0.3, dragEnd: 0.1, decay: 0.02, velocityDecay: 0.2 }
} as const;

export interface GraphComponentProps {
  graphData: PaperGraph;
  onNodeClick?: (nodeData: any) => void;
  onNodeRightClick?: (nodeData: any) => void;
  selectedNodeIds?: string[];
  seedNodeId?: string | null;
  isExpanding?: boolean;
  searchMode?: 'internal' | 'external';
}

const GraphComponent: React.FC<GraphComponentProps> = ({
  graphData,
  onNodeClick,
  onNodeRightClick,
  selectedNodeIds = [],
  seedNodeId = null,
  isExpanding = false
}) => {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const [tooltip, setTooltip] = useState<TooltipInfo>({ visible: false, content: '', x: 0, y: 0 });

  const graph = graphData;

  const nodeSizeConfig = useMemo(() => calculateNodeSize(graph.nodes.length), [graph.nodes.length]);

  const elements = useMemo(() => {
    try {
      const cytoscapeElements: cytoscape.ElementDefinition[] = [];
      graph.nodes.forEach(node => {
        const fullTitle = node.data.title || 'Unknown';
        const maxLength = 15; // 최대 표시 길이 (조절 가능)
        const displayLabel = fullTitle.length > maxLength 
          ? fullTitle.substring(0, maxLength) + '...' 
          : fullTitle;
        cytoscapeElements.push({
          data: {
            ...node.data,
            id: node.id,
            label: fullTitle, // 툴팁용 전체 제목
            displayLabel: displayLabel, // 노드 표시용 짧은 제목
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
        }
      });
      return cytoscapeElements;
    } catch (error) {
      console.error('Error creating Cytoscape elements:', error);
      return [];
    }
  }, [graph, nodeSizeConfig]);

  const setupSimulation = useCallback((cy: cytoscape.Core) => {
    if (simulationRef.current) simulationRef.current.stop();

    const nodes: D3Node[] = graph.nodes.map(node => {
      const existingNode = cy.getElementById(node.id);
      let x = Math.random() * 400;
      let y = Math.random() * 400;
      
      if (existingNode.nonempty()) {
        const pos = existingNode.position();
        if (pos.x !== 0 || pos.y !== 0) {
            x = pos.x;
            y = pos.y;
        }
      }

      return {
        id: node.id, x, y,
        fx: node.locked ? x : null,
        fy: node.locked ? y : null,
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
          if (lockedNodeIds.has(d.source.id) || lockedNodeIds.has(d.target.id)) return 0;
          return BASE_SIMULATION_CONFIG.link.strength;
        })
      )
      .force("charge", d3.forceManyBody().strength(forceParams.chargeStrength).distanceMax(forceParams.distanceMax))
      .force("collide", d3.forceCollide().radius(forceParams.collisionRadius).strength(BASE_SIMULATION_CONFIG.collide.strength))
      .alpha(BASE_SIMULATION_CONFIG.alpha.initial)
      .alphaDecay(BASE_SIMULATION_CONFIG.alpha.decay)
      .velocityDecay(BASE_SIMULATION_CONFIG.alpha.velocityDecay);
    
    simulationRef.current = simulation;
    
    simulation.on("tick", () => {
      if (cy && !cy.destroyed()) {
        try {
          cy.batch(() => {
            nodes.forEach(node => {
              if (!node.locked && node.fx === null && node.fy === null) {
                const cyNode = cy.getElementById(node.id);
                if (cyNode.nonempty() && !cyNode.locked()) {
                  cyNode.position({ x: node.x, y: node.y });
                }
              }
            });
          });
        } catch (error) {
        }
      }
    });

    simulation.alpha(0.5).alphaTarget(0.0).restart();
  }, [graph, cy]);

  const handleMouseOver = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    node.addClass('hover');

    const nodeData = node.data();
    const authorNames = Array.isArray(nodeData.authors) 
      ? nodeData.authors.map((a: any) => a.name).join(', ') 
      : (nodeData.authors || 'N/A');

    setTooltip({ 
      visible: true, 
      content: `<strong>${nodeData.type === 'paper' ? '논문' : '저자'}:</strong> ${nodeData.label}<br><strong>저자:</strong> ${authorNames}<br><strong>연도:</strong> ${nodeData.publicationDate || 'N/A'}`,
      x: event.renderedPosition.x, y: event.renderedPosition.y 
    });
  }, []);

  const handleMouseOut = useCallback((event: cytoscape.EventObject) => {
    event.target.removeClass('hover');
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // 2. 엣지 마우스 오버 (툴팁)
  const handleEdgeMouseOver = useCallback((event: cytoscape.EventObject) => {
    const edge = event.target;
    edge.addClass('hover'); // 스타일 적용
    
    const data = edge.data();
    let content = '';
    
    if (data.type === 'citation') {
      content = `
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-slate-500"></span>
          <span class="font-semibold">인용 관계 (Citation)</span>
        </div>
      `;
    } else if (data.type === 'similarity') {
      const scorePercent = (data.score * 100).toFixed(1);
      content = `
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-slate-400"></span>
          <span class="font-semibold">벡터 유사도 점수: ${scorePercent}</span>
        </div>
      `;
    }

    if (content) {
      setTooltip({
        visible: true,
        content,
        x: event.renderedPosition.x,
        y: event.renderedPosition.y
      });
    }
  }, []);

  const handleEdgeMouseOut = useCallback((event: cytoscape.EventObject) => {
    event.target.removeClass('hover');
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleMouseMove = useCallback((event: cytoscape.EventObject) => {
    setTooltip(prev => ({ ...prev, x: event.renderedPosition.x, y: event.renderedPosition.y }));
  }, []);

  const handleTapStart = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    const node = event.target as cytoscape.NodeSingular;
    const d3Node = nodesRef.current.find(n => n.id === node.id());
    
    if (node.locked()) {
        node.unlock();
        if (d3Node) { d3Node.locked = false; d3Node.fx = null; d3Node.fy = null; }
    }
    if (d3Node) { d3Node.fx = node.position().x; d3Node.fy = node.position().y; }
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
    if (d3Node) { d3Node.fx = draggedPos.x; d3Node.fy = draggedPos.y; }
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragMove).restart();
  }, [cy]);

  const handleFree = useCallback((event: cytoscape.EventObject) => {
    if (!cy || !simulationRef.current) return;
    const node = event.target as cytoscape.NodeSingular;
    
    node.lock(); 
    node.addClass('pinned');

    const d3Node = nodesRef.current.find(n => n.id === node.id());
    if (d3Node) { 
      d3Node.fx = node.position().x; 
      d3Node.fy = node.position().y; 
      d3Node.locked = true; 
    }

    GraphUtils.clearHighlights(cy);
    simulationRef.current.alpha(BASE_SIMULATION_CONFIG.alpha.dragEnd).restart();
  }, [cy]);

  // 우클릭 핸들러
  const handleRightClick = useCallback((event: cytoscape.EventObject) => {
    if (!cy) return;
    const node = event.target;
    
    if (onNodeRightClick) {
      onNodeRightClick(node.data()); 
    }
    if (simulationRef.current) simulationRef.current.alpha(0.2).restart();
  }, [cy, onNodeRightClick]);

  // 단일 클릭 핸들러
  const handleTap = useCallback((event: cytoscape.EventObject) => {
    const node = event.target;
    if (node.isNode() && onNodeClick) {
        onNodeClick(node.data());
    }
  }, [onNodeClick]);

  useEffect(() => {
    if (cy) {
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
      cy.on('cxttap', 'node', handleRightClick);
      cy.on('tap', 'node', handleTap);

      // Edge Events
      cy.on('mouseover', 'edge', handleEdgeMouseOver);
      cy.on('mouseout', 'edge', handleEdgeMouseOut);
      cy.on('mousemove', 'edge', handleMouseMove); // 툴팁 위치 갱신용

      return () => {
        if (!cy.destroyed()) {
          cy.off('mouseover', 'node', handleMouseOver);
          cy.off('mouseout', 'node', handleMouseOut);
          cy.off('mousemove', 'node', handleMouseMove);
          cy.off('tapstart', 'node', handleTapStart);
          cy.off('grab', 'node', handleGrab);
          cy.off('drag', 'node', handleDrag);
          cy.off('free', 'node', handleFree);
          cy.off('cxttap', 'node', handleRightClick);
          cy.off('tap', 'node', handleTap);
          
          cy.off('mouseover', 'edge', handleEdgeMouseOver);
          cy.off('mouseout', 'edge', handleEdgeMouseOut);
          cy.off('mousemove', 'edge', handleMouseMove);

          try { simulationRef.current?.stop(); } catch {}
        }
      };
    }
  }, [cy, setupSimulation, handleMouseOver, handleMouseOut, handleMouseMove, handleTapStart, handleGrab, handleDrag, handleFree, handleRightClick, handleTap, isExpanding]);

  // 노드 스타일링 (초기화 로직 보강)
  useEffect(() => {
    if (cy) {
      cy.batch(() => {
        // 1. 기존 스타일 완전 초기화
        cy.nodes().removeClass('selected seed-node');
        cy.nodes().removeStyle(); // 중요: node.style()로 적용된 스타일 제거

        // 2. 선택된 노드 하이라이트 (클래스 적용)
        if (selectedNodeIds && selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(id => {
            const node = cy.getElementById(id);
            if (node.nonempty()) {
                node.addClass('selected');
            }
          });
        }

        // 3. 시드 노드 하이라이트 (강제 스타일 적용)
        if (seedNodeId) {
          const node = cy.getElementById(seedNodeId);
          if (node.nonempty()) {
            node.addClass('seed-node');
            node.style({
                'border-width': 6,
                'border-color': '#2563EB',
                'background-color': '#EFF6FF',
                'width': (node.data('nodeSize') || 30) * 1.2,
                'height': (node.data('nodeSize') || 30) * 1.2
            });
          }
        }
      });
    }
  }, [cy, selectedNodeIds, seedNodeId]);

  // 데이터가 로드되거나 노드 수가 변경되었을 때 그래프를 중앙에 맞춤
  useEffect(() => {
    if (cy && graphData.nodes.length > 0) {
      // 렌더링 및 시뮬레이션 안정화를 위해 약간의 지연 후 실행
      const timer = setTimeout(() => {
        cy.fit(undefined, 50); // 그래프 전체가 보이도록 맞춤 (padding: 50)
        cy.center();           // 화면 중앙 정렬
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [cy, graphData.nodes.length]); // 노드 개수가 변할 때(초기 로딩, 확장 등) 실행

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