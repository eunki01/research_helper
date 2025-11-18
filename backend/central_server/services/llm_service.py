# services/llm_service.py
import logging
from openai import AsyncOpenAI
from core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
    async def get_final_response(self, context: str, query: str) -> str:
        """
        LLM에 요청을 보내고 전체 답변을 반환합니다.
        """
        prompt = f"""
        You are a professional and helpful research assistant. Your task is to provide a concise and accurate answer to the user's question based ONLY on the provided context.

        **Instructions:**
        - Read the provided context carefully.
        - If the context contains the answer, synthesize a clear and concise response.
        - If the context does not contain the answer, you MUST state that the information is not available in the provided sources. Do not make up any information.
        - Structure your answer professionally, starting with a summary and using bullet points for key details if appropriate.

        **Context:**
        {context}

        위 자료를 참고하여 질문에 대한 답변을 한국어로 작성해 주세요.

        **User Question:**
        {query}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4", # 또는 다른 LLM 모델
                messages=[
                    {"role": "system", "content": "You are a helpful research assistant."},
                    {"role": "user", "content": prompt}
                ],
                stream=False
            )
            
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM 호출 실패: {str(e)}")
            return "LLM 호출 중 오류가 발생했습니다."
        
    async def expand_query(self, query: str) -> str:
        """
        LLM을 사용해 사용자 쿼리에서 핵심 키워드를 추출하고 확장합니다.
        """
        prompt = f"""s
        사용자의 질문은 다음과 같습니다: "{query}"

        이 질문의 핵심 키워드를 추출하고, 검색에 유용한 동의어나 관련 용어 하나를 '|'로 구분하여 한 줄로 나열해 주세요.
        예시: "최신 트랜스포머 아키텍처" -> "Transformer architecture|attention mechanism"
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4.1", # 더 빠르거나 저렴한 모델을 사용하거나 gpt-4를 사용할 수 있습니다.
                messages=[
                    {"role": "system", "content": "You are a helpful assistant specialized in extracting keywords for academic search."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"키워드 확장 실패: {str(e)}")
            # 오류 발생 시 원본 쿼리를 그대로 반환
            return query