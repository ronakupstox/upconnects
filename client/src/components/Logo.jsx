export default function Logo({ size = 'md' }) {
  const cfg = {
    sm: { wrap: 'gap-2', logo: 'text-2xl font-black', sub: 'text-xs' },
    md: { wrap: 'gap-2', logo: 'text-4xl font-black', sub: 'text-sm' },
    lg: { wrap: 'gap-3', logo: 'text-6xl font-black', sub: 'text-base' },
  }[size];

  return (
    <div className={`flex flex-col items-center ${cfg.wrap}`}>
      <div className={cfg.logo}>
        <span style={{ color: '#6C3EFF' }}>Up</span>
        <span className="text-white">stox</span>
      </div>
      <div className={`tracking-[0.25em] uppercase font-semibold text-upstox-muted ${cfg.sub}`}>
        UpConnects
      </div>
    </div>
  );
}
