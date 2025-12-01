import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import ApiService from '../../services/apiService';

interface PaperUploadFormProps {
  onSuccess: (filename: string) => void;
  onCancel: () => void;
}

const PaperUploadForm: React.FC<PaperUploadFormProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [venue, setVenue] = useState('');
  const [citationCount, setCitationCount] = useState<string>('');
  const [tldr, setTldr] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 파일이 선택되면 파일명을 제목으로 자동 설정
  useEffect(() => {
    if (file && !title) {
      // 확장자 제거
      const name = file.name.replace(/\.[^/.]+$/, "");
      setTitle(name);
    }
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await ApiService.uploadFile(file, {
        title,
        authors,
        year: year ? parseInt(year) : undefined,
        venue: venue || undefined,
        citationCount: citationCount ? parseInt(citationCount) : undefined,
        tldr: tldr || undefined
      });
      
      // 성공 시 부모에게 알림
      onSuccess(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 파일 선택 영역 */}
      {!file ? (
        <div className="space-y-2">
            <FileUpload onFileSelect={handleFileSelect} />
            <div className="text-center">
                <button 
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    취소하고 돌아가기
                </button>
            </div>
        </div>
      ) : (
        /* 2. 선택된 파일 정보 및 메타데이터 입력 폼 */
        <div className="animate-fade-in">
            {/* 선택된 파일 표시 */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded shadow-sm">
                        <span className="text-2xl">📄</span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                            {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setFile(null);
                        setTitle('');
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded transition-colors"
                    disabled={isUploading}
                >
                    변경
                </button>
            </div>

            {/* 메타데이터 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        논문 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="논문 제목을 입력하세요"
                        required
                        disabled={isUploading}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            저자
                        </label>
                        <input
                            type="text"
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="예: Hong Gildong, Kim..."
                            disabled={isUploading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            발행 연도
                        </label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="예: 2024"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            disabled={isUploading}
                        />
                    </div>
                </div>

                {/* [추가] 상세 정보 입력 섹션 */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">저널/학회 (Venue)</label>
                    <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="예: Nature"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">인용 횟수</label>
                    <input
                    type="number"
                    value={citationCount}
                    onChange={(e) => setCitationCount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요약 (TL;DR)</label>
                <textarea
                    value={tldr}
                    onChange={(e) => setTldr(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="논문 핵심 요약"
                />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors font-medium"
                        disabled={isUploading}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={!file || !title.trim() || isUploading}
                        className={`px-6 py-2 rounded-md text-white font-medium transition-all shadow-sm ${
                            !file || !title.trim() || isUploading
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md transform active:scale-95'
                        }`}
                    >
                        {isUploading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                업로드 및 처리 중...
                            </div>
                        ) : (
                            '업로드'
                        )}
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default PaperUploadForm;