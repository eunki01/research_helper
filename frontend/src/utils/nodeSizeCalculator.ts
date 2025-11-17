/**
 * 노드 개수에 따른 반응형 크기 계산 유틸리티
 */

export interface NodeSizeConfig {
  minSize: number;
  maxSize: number;
  minLabelSize: number;
  maxLabelSize: number;
  minCollisionRadius: number;
  maxCollisionRadius: number;
}

export interface NodeSizeResult {
  nodeSize: number;
  labelSize: number;
  collisionRadius: number;
  fontSize: number;
}

/**
 * 노드 개수에 따른 크기 계산
 */
export function calculateNodeSize(
  nodeCount: number,
  config: NodeSizeConfig = {
    minSize: 20,
    maxSize: 80,
    minLabelSize: 12,
    maxLabelSize: 16,
    minCollisionRadius: 30,
    maxCollisionRadius: 100
  }
): NodeSizeResult {
  // 노드 개수에 따른 크기 조정 로직
  let sizeRatio: number;
  
  if (nodeCount <= 5) {
    // 5개 이하: 큰 크기
    sizeRatio = 1.0;
  } else if (nodeCount <= 10) {
    // 6-10개: 중간 크기
    sizeRatio = 0.8;
  } else if (nodeCount <= 20) {
    // 11-20개: 작은 크기
    sizeRatio = 0.6;
  } else if (nodeCount <= 50) {
    // 21-50개: 매우 작은 크기
    sizeRatio = 0.4;
  } else {
    // 50개 초과: 최소 크기
    sizeRatio = 0.2;
  }

  const nodeSize = Math.round(config.minSize + (config.maxSize - config.minSize) * sizeRatio);
  const labelSize = Math.round(config.minLabelSize + (config.maxLabelSize - config.minLabelSize) * sizeRatio);
  const collisionRadius = Math.round(config.minCollisionRadius + (config.maxCollisionRadius - config.minCollisionRadius) * sizeRatio);
  const fontSize = Math.max(8, Math.round(10 + (16 - 10) * sizeRatio));

  return {
    nodeSize,
    labelSize,
    collisionRadius,
    fontSize
  };
}

/**
 * 노드 개수에 따른 D3 force 파라미터 조정
 */
export function calculateForceParameters(nodeCount: number) {
  const sizeResult = calculateNodeSize(nodeCount);
  
  return {
    // 링크 거리 조정
    linkDistance: {
      min: Math.max(80, sizeResult.nodeSize * 2),
      max: Math.max(200, sizeResult.nodeSize * 4),
      base: Math.max(150, sizeResult.nodeSize * 3)
    },
    
    // 충돌 반경
    collisionRadius: sizeResult.collisionRadius,
    
    // 전하력 조정 (노드가 많을수록 더 강하게 밀어냄)
    chargeStrength: Math.min(-300, -200 - (nodeCount * 5)),
    
    // 최대 거리 제한
    distanceMax: Math.max(400, sizeResult.nodeSize * 6)
  };
}

/**
 * 노드 개수에 따른 시각화 영역 크기 조정
 */
export function calculateViewportSize(nodeCount: number) {
  if (nodeCount <= 10) {
    return { width: 800, height: 600 };
  } else if (nodeCount <= 30) {
    return { width: 1200, height: 800 };
  } else {
    return { width: 1600, height: 1000 };
  }
}

/**
 * 노드 개수에 따른 레이블 표시 여부 결정
 */
export function shouldShowLabels(nodeCount: number): boolean {
  return nodeCount <= 30; // 30개 이하일 때만 레이블 표시
}

/**
 * 노드 개수에 따른 엣지 표시 여부 결정
 */
export function shouldShowEdges(nodeCount: number): boolean {
  return nodeCount <= 100; // 100개 이하일 때만 엣지 표시
}


