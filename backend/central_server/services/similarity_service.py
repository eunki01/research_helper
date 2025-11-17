# central_server/services/similarity_service.py
import numpy as np
from typing import List, Dict
from itertools import combinations
import logging

logger = logging.getLogger(__name__)

class SimilarityService:
    """
    논문 간의 벡터 유사도를 계산하는 서비스
    """
    
    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """두 벡터 간의 코사인 유사도를 계산합니다."""
        if not isinstance(vec_a, np.ndarray):
            vec_a = np.array(vec_a)
        if not isinstance(vec_b, np.ndarray):
            vec_b = np.array(vec_b)
        
        # 벡터 정규화
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        # 코사인 유사도 계산
        return np.dot(vec_a, vec_b) / (norm_a * norm_b)

    def calculate_similarity_graph(self, papers: List[Dict], threshold: float = 0.4) -> List[Dict]:
        """
        논문 리스트 내 모든 논문 쌍의 유사도를 계산하여 그래프 형태로 반환합니다.
        'papers' 리스트의 각 딕셔너리는 'paperId'와 'embedding' 키를 가져야 합니다.
        """
        graph = []
        
        # 논문 쌍의 모든 조합에 대해 반복
        for i, j in combinations(range(len(papers)), 2):
            paper1 = papers[i]
            paper2 = papers[j]

            # 임베딩 벡터가 있는지 확인
            if not paper1.get('embedding') or not paper2.get('embedding'):
                continue
            
            # 코사인 유사도 계산
            similarity = self._cosine_similarity(paper1['embedding'], paper2['embedding'])
            
            # 임계값 이상인 경우 그래프에 추가
            if similarity >= threshold:
                graph.append({
                    "source": paper1['paperId'],
                    "target": paper2['paperId'],
                    "similarity": round(similarity, 4)
                })
        
        logger.info(f"{len(graph)}개의 유사도 관계(엣지)를 찾았습니다.")
        return graph