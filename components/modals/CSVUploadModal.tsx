import React from 'react';
import { X, Upload } from 'lucide-react';
import { TableDefinition } from '../../types';

interface CSVUploadModalProps {
  isOpen: boolean;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  onCancel: () => void;
  selectedFile: File | null;
  activeTable: TableDefinition | null;
  isUploading: boolean;
}

/**
 * CSVUploadModal - Upload CSV data to table
 * Handles file selection and preview
 */
export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  isOpen,
  onFileSelect,
  onUpload,
  onCancel,
  selectedFile,
  activeTable,
  isUploading
}) => {
  if (!isOpen || !activeTable) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">CSV 업로드</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Table Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>테이블:</strong> {activeTable.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>컬럼:</strong> {activeTable.columns.map(c => c.name).join(', ')}
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CSV 파일 선택 *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">CSV 파일을 선택하세요</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors">
                파일 선택
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>선택된 파일:</strong> {selectedFile.name}
              </p>
              <p className="text-sm text-green-700">
                <strong>크기:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">업로드 가이드:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• CSV 파일의 첫 행은 컬럼명이어야 합니다</li>
              <li>• 테이블의 컬럼과 일치해야 합니다</li>
              <li>• UTF-8 인코딩을 권장합니다</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={onUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  );
};
