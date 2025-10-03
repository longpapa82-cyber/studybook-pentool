import { usePentoolStore } from '@/stores/pentoolStore';

const COLORS = [
  { name: '검정', value: '#000000' },
  { name: '빨강', value: '#EF4444' },
  { name: '주황', value: '#F97316' },
  { name: '노랑', value: '#EAB308' },
  { name: '초록', value: '#22C55E' },
  { name: '청록', value: '#14B8A6' },
  { name: '파랑', value: '#3B82F6' },
  { name: '남색', value: '#6366F1' },
  { name: '보라', value: '#A855F7' },
  { name: '분홍', value: '#EC4899' },
  { name: '회색', value: '#6B7280' },
  { name: '흰색', value: '#FFFFFF' },
];

export function ColorPicker() {
  const { penColor, setPenColor } = usePentoolStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">색상:</span>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setPenColor(color.value)}
            className={`w-7 h-7 rounded transition-all ${
              penColor === color.value
                ? 'ring-2 ring-primary-500 ring-offset-1 scale-110'
                : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: color.value,
              border: color.value === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
            }}
            title={color.name}
            aria-label={color.name}
          />
        ))}
      </div>
    </div>
  );
}
