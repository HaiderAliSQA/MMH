import React, { useRef, useState } from 'react';

interface LeaveFileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  return '📎';
};

const getFileIconClass = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'mmh-file-icon-pdf';
  if (mimeType.includes('image')) return 'mmh-file-icon-img';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'mmh-file-icon-doc';
  return '';
};

const getTypeName = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG Image';
  if (mimeType.includes('png')) return 'PNG Image';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'Word Document';
  return 'Document';
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const LeaveFileUpload: React.FC<LeaveFileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX';
    }
    if (file.size > MAX_SIZE) {
      return `File too large. Maximum size is 5MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
    }
    return '';
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      onFileSelect(null);
    } else {
      setError('');
      onFileSelect(file);
    }
  };

  return (
    <div className="mmh-leave-upload-container">
      {!selectedFile ? (
        <div
          className={`mmh-upload-zone ${isDragging ? 'mmh-upload-zone-drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mmh-upload-icon">📎</div>
          <div className="mmh-upload-title">Drop file here or click to browse</div>
          <div className="mmh-upload-sub">
            Upload a medical certificate, doctor note, or any supporting document
          </div>

          <div className="mmh-upload-types">
            {['PDF', 'JPG', 'PNG', 'DOC', 'DOCX'].map((t) => (
              <span key={t} className="mmh-upload-type-badge">
                {t}
              </span>
            ))}
          </div>

          <div className="mmh-upload-limit">Maximum file size: 5 MB</div>

          <div className="mmh-upload-btn">Browse file</div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="mmh-file-preview">
          <div className="mmh-file-preview-row">
            <div className={`mmh-file-icon ${getFileIconClass(selectedFile.type)}`}>
              {getFileIcon(selectedFile.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mmh-file-name">{selectedFile.name}</div>
              <div className="mmh-file-meta">
                {formatSize(selectedFile.size)} · {getTypeName(selectedFile.type)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="mmh-file-remove"
              title="Remove file"
            >
              ✕
            </button>
          </div>
          <div className="mmh-file-note">
            This document will be visible to admin when reviewing your leave request
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'var(--mmh-danger-soft)',
            border: '1px solid var(--mmh-danger-soft)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--mmh-danger)',
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default LeaveFileUpload;
