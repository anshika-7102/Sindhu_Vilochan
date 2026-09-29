
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  const sizeMap = {
    sm: { width: 44, height: 32, text: 'text-sm', sub: 'text-[9px]' },
    md: { width: 54, height: 38, text: 'text-base', sub: 'text-[10px]' },
    lg: { width: 72, height: 50, text: 'text-xl', sub: 'text-xs' },
    xl: { width: 100, height: 68, text: 'text-4xl', sub: 'text-sm' },
  };

  const s = sizeMap[size];
  const sindhuColor = variant === 'light' ? 'text-white' : 'text-navy';
  const vilochanColor = variant === 'light' ? 'text-ocean-200' : 'text-ocean';
  const subColor = variant === 'light' ? 'text-ocean-200/70' : 'text-navy-300';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0 bg-[#011931] border border-navy-200/50 shadow-xs"
        style={{
          width: s.width,
          height: s.height,
        }}
      >
        <img
          src="/logo.png"
          alt="SINDHU VILOCHAN Logo"
          className="w-full h-full object-contain select-none"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black font-montserrat tracking-wider ${s.text}`}>
            <span className={sindhuColor}>SINDHU</span>
            <span className={vilochanColor}> VILOCHAN</span>
          </div>
          <div className={`${s.sub} ${subColor} tracking-[0.18em] uppercase font-medium mt-1`}>
            Marine Debris Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
