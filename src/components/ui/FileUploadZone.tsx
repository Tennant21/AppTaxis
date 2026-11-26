import React, { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { VerificationBadge } from './Badges';
import { IconButton } from './Button';

export interface UploadedFileMeta {
  fileName: string;
  fileSize: string;
  status: 'VERIFIED' | 'IN_PROGRESS';
}

interface FileUploadZoneProps {
  file?: UploadedFileMeta | null;
  onFileSelected: (meta: UploadedFileMeta) => void;
  onRemove?: () => void;
  accept?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  file,
  onFileSelected,
  onRemove,
  accept = '.pdf,.jpg,.jpeg,.png',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    onFileSelected({
      fileName: f.name,
      fileSize: formatBytes(f.size),
      status: 'IN_PROGRESS',
    });
    setTimeout(() => {
      onFileSelected({
        fileName: f.name,
        fileSize: formatBytes(f.size),
        status: 'VERIFIED',
      });
    }, 350);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#DCE4EF] bg-[#F7F9FC] p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF2FB] text-[#174EA6]">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#172B4D]">{file.fileName}</p>
            <div className="flex items-center gap-2 text-[12px] text-[#52627A]">
              <span>{file.fileSize}</span>
              <span aria-hidden="true">·</span>
              <VerificationBadge state={file.status} />
            </div>
          </div>
        </div>
        {onRemove && (
          <IconButton label="Supprimer le fichier" variant="danger" onClick={onRemove}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-[12px] border border-dashed p-5 text-center transition-colors ${
        dragging
          ? 'border-[#174EA6] bg-[#EAF2FB]'
          : 'border-[#D1D5DB] bg-[#F7F9FC] hover:border-[#174EA6]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#DCE4EF] text-[#174EA6]">
        <UploadCloud className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-2.5 text-[13px] font-medium text-[#172B4D]">
        Déposer un fichier ici ou{' '}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-[#174EA6] underline underline-offset-2 hover:text-[#123B72]"
        >
          cliquer pour parcourir
        </button>
      </p>
      <p className="mt-1 text-[12px] text-[#52627A]">PDF, JPG, PNG</p>
    </div>
  );
};
