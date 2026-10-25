export default function Crest({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4deA0" />
          <stop offset="1" stopColor="#b8892b" />
        </linearGradient>
      </defs>
      <path d="M8 46 L4 18 L20 30 L32 10 L44 30 L60 18 L56 46 Z" fill="url(#g)" />
      <rect x="8" y="50" width="48" height="6" rx="2" fill="url(#g)" />
      <circle cx="32" cy="10" r="3" fill="#f4deA0" />
      <circle cx="4" cy="18" r="2.5" fill="#f4deA0" />
      <circle cx="60" cy="18" r="2.5" fill="#f4deA0" />
    </svg>
  );
}
