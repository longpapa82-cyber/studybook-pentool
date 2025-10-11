/**
 * Text Editor Component
 * Phase 3-1: Text annotation tool
 */

import { useEffect, useRef, useState } from 'react';
import type { Point } from '@/types/pentool.types';

interface TextEditorProps {
  position: Point;
  initialText?: string;
  initialFontSize?: number;
  initialColor?: string;
  onComplete: (text: string, fontSize: number, fontFamily: string, fontStyle: 'normal' | 'italic', fontWeight: 'normal' | 'bold', align: 'left' | 'center' | 'right') => void;
  onCancel: () => void;
}

export function TextEditor({
  position,
  initialText = '',
  initialFontSize = 16,
  initialColor = '#000000',
  onComplete,
  onCancel,
}: TextEditorProps) {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [showToolbar, setShowToolbar] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    // Handle clicks outside to complete
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleComplete();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [text]);

  const handleComplete = () => {
    if (text.trim()) {
      onComplete(text, fontSize, fontFamily, fontStyle, fontWeight, align);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter to complete
      handleComplete();
    }
    // Allow normal Enter for multiline
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-50"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '200px',
      }}
    >
      {/* Toolbar */}
      <div className="bg-white rounded-t-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 text-sm">
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className="p-1 hover:bg-gray-100 rounded"
          title="도구 표시/숨김"
        >
          ⚙️
        </button>

        {showToolbar && (
          <>
            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={24}>24px</option>
              <option value={32}>32px</option>
            </select>

            {/* Font Family */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-2 py-1 border rounded"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times</option>
              <option value="Courier New">Courier</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>

            {/* Bold */}
            <button
              onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
              className={`px-2 py-1 rounded font-bold ${
                fontWeight === 'bold' ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              title="굵게"
            >
              B
            </button>

            {/* Italic */}
            <button
              onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
              className={`px-2 py-1 rounded italic ${
                fontStyle === 'italic' ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              title="기울임"
            >
              I
            </button>

            {/* Alignment */}
            <div className="flex gap-1 border-l pl-2">
              <button
                onClick={() => setAlign('left')}
                className={`px-2 py-1 rounded ${
                  align === 'left' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                title="왼쪽 정렬"
              >
                ≡
              </button>
              <button
                onClick={() => setAlign('center')}
                className={`px-2 py-1 rounded ${
                  align === 'center' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                title="가운데 정렬"
              >
                ≡
              </button>
              <button
                onClick={() => setAlign('right')}
                className={`px-2 py-1 rounded ${
                  align === 'right' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                title="오른쪽 정렬"
              >
                ≡
              </button>
            </div>
          </>
        )}

        {/* Complete button */}
        <button
          onClick={handleComplete}
          className="ml-auto px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="완료 (Ctrl+Enter)"
        >
          ✓
        </button>
      </div>

      {/* Text Input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[80px] p-3 border-x border-b border-gray-200 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          fontStyle,
          fontWeight,
          textAlign: align,
          color: initialColor,
        }}
        placeholder="텍스트를 입력하세요... (Ctrl+Enter: 완료, Esc: 취소)"
      />

      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-1">
        Ctrl+Enter: 완료 | Esc: 취소
      </div>
    </div>
  );
}
