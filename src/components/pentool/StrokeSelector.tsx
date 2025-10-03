import { usePentoolStore } from '@/stores/pentoolStore';

const STROKE_WIDTHS = [
  { label: '가늘게', value: 1 },
  { label: '보통', value: 2 },
  { label: '두껍게', value: 4 },
  { label: '아주 두껍게', value: 6 },
];

export function StrokeSelector() {
  const { strokeWidth, setStrokeWidth } = usePentoolStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">굵기:</span>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {STROKE_WIDTHS.map((stroke) => (
          <button
            key={stroke.value}
            onClick={() => setStrokeWidth(stroke.value)}
            className={`px-3 py-2 rounded transition-all flex items-center justify-center ${
              strokeWidth === stroke.value
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title={stroke.label}
          >
            <div
              className="bg-current rounded-full"
              style={{
                width: `${stroke.value * 3}px`,
                height: `${stroke.value * 3}px`,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
