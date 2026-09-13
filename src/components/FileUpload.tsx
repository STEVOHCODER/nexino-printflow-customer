import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { UploadedFile } from '../lib/types';

interface FileUploadProps {
  uploadedFile: UploadedFile | null;
  uploadProgress: number;
  isLoading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  uploadedFile,
  uploadProgress,
  isLoading,
  onUpload,
  onRemove,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setRejectReason(null);
      if (rejections.length > 0) {
        const reason = rejections[0].errors[0]?.message || 'File rejected';
        console.warn('[FileUpload] Rejected:', reason, rejections);
        setRejectReason(reason);
        return;
      }
      if (acceptedFiles.length > 0) {
        console.log('[FileUpload] Accepted:', acceptedFiles[0].name, acceptedFiles[0].type, acceptedFiles[0].size);
        onUpload(acceptedFiles[0]);
      }
      setIsDragActive(false);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/x-pdf': ['.pdf'],
      'application/octet-stream': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    disabled: isLoading,
    validator: (file) => {
      const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
      const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
      if (!isPdfMime && !isPdfExt) {
        return { code: 'file-invalid-type', message: `Only PDF files accepted (got: ${file.type || 'unknown type'})` };
      }
      return null;
    },
  });

  if (uploadedFile) {
    return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-green-600">Uploaded</span>
              </div>
              <p className="font-medium text-gray-900 truncate">{uploadedFile.original_name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                <span>{uploadedFile.page_count} page{uploadedFile.page_count !== 1 ? 's' : ''}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{formatFileSize(uploadedFile.size)}</span>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        {...getRootProps()}
        className={clsx(
          'relative bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer',
          'active:scale-[0.98]',
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50',
          isLoading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <div className="w-full max-w-xs">
              <p className="text-sm font-medium text-gray-700 mb-2">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={clsx(
                'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                isDragActive ? 'bg-primary-100' : 'bg-gray-100'
              )}
            >
              <Upload
                className={clsx(
                  'w-8 h-8 transition-colors',
                  isDragActive ? 'text-primary-600' : 'text-gray-400'
                )}
              />
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">
                {isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag & drop or tap to browse
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">
              PDF only, max 50 MB
            </span>
          </div>
        )}
      </div>
      {rejectReason && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{rejectReason}</span>
        </div>
      )}
    </div>
  );
}
