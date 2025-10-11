import { useEffect, useRef } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';
import { useEbookStore } from '@/stores/ebookStore';

interface ContextMenuProps {
  x: number;
  y: number;
  annotationId: string;
  onClose: () => void;
}

export function ContextMenu({ x, y, annotationId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    copyAnnotation,
    pasteAnnotation,
    removeAnnotation,
    clipboardAnnotation,
    setPenColor,
    setStrokeWidth,
  } = usePentoolStore();

  const { currentPage } = useEbookStore();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 화면 경계 체크
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleCopy = () => {
    copyAnnotation(annotationId, currentPage);
    onClose();
  };

  const handlePaste = () => {
    pasteAnnotation(currentPage);
    onClose();
  };

  const handleDelete = () => {
    removeAnnotation(currentPage, annotationId);
    onClose();
  };

  const handleDuplicate = () => {
    copyAnnotation(annotationId, currentPage);
    pasteAnnotation(currentPage);
    onClose();
  };

  const handleChangeColor = (color: string) => {
    setPenColor(color);
    // TODO: 선택된 주석의 색상 변경 (updateAnnotation 사용)
    onClose();
  };

  const handleChangeStrokeWidth = (width: number) => {
    setStrokeWidth(width);
    // TODO: 선택된 주석의 굵기 변경
    onClose();
  };

  const colors = [
    { value: '#000000', label: '검정' },
    { value: '#EF4444', label: '빨강' },
    { value: '#F97316', label: '주황' },
    { value: '#EAB308', label: '노랑' },
    { value: '#22C55E', label: '초록' },
    { value: '#3B82F6', label: '파랑' },
    { value: '#A855F7', label: '보라' },
  ];

  const strokeWidths = [1, 2, 4, 6];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-50 min-w-[200px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 기본 작업 */}
      <div className="py-1 border-b border-gray-100">
        <MenuItem onClick={handleCopy} icon="📋" label="복사" shortcut="Ctrl+C" />
        <MenuItem
          onClick={handlePaste}
          icon="📄"
          label="붙여넣기"
          shortcut="Ctrl+V"
          disabled={!clipboardAnnotation}
        />
        <MenuItem onClick={handleDuplicate} icon="📑" label="복제" />
      </div>

      {/* 색상 변경 */}
      <div className="py-1 border-b border-gray-100">
        <div className="px-3 py-2 text-xs font-medium text-gray-500">색상 변경</div>
        <div className="px-3 py-2 flex gap-2 flex-wrap">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleChangeColor(color.value)}
              className="w-6 h-6 rounded-full hover:scale-110 transition-transform border border-gray-300"
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* 굵기 변경 */}
      <div className="py-1 border-b border-gray-100">
        <div className="px-3 py-2 text-xs font-medium text-gray-500">굵기 변경</div>
        <div className="px-3 py-2 flex gap-2">
          {strokeWidths.map((width) => (
            <button
              key={width}
              onClick={() => handleChangeStrokeWidth(width)}
              className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
              title={`${width}px`}
            >
              <div
                className="bg-gray-800 rounded-full"
                style={{
                  width: `${width * 2.5}px`,
                  height: `${width * 2.5}px`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 레이어 작업 (추후 구현) */}
      <div className="py-1 border-b border-gray-100">
        <MenuItem onClick={onClose} icon="⬆️" label="맨 앞으로" disabled />
        <MenuItem onClick={onClose} icon="⬇️" label="맨 뒤로" disabled />
      </div>

      {/* 삭제 */}
      <div className="py-1">
        <MenuItem
          onClick={handleDelete}
          icon="🗑️"
          label="삭제"
          shortcut="Delete"
          danger
        />
      </div>
    </div>
  );
}

interface MenuItemProps {
  onClick: () => void;
  icon: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
}

function MenuItem({ onClick, icon, label, shortcut, disabled, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-4
        transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
      `}
    >
      <span className="flex items-center gap-2">
        <span className="w-5 text-center">{icon}</span>
        <span>{label}</span>
      </span>
      {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
    </button>
  );
}
