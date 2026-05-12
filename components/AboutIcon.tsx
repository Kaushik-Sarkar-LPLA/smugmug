export function AboutIcon() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl px-8 py-10 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(214,181,109,0.24),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(116,185,255,0.20),transparent_26%),radial-gradient(circle_at_50%_92%,rgba(244,180,255,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-[#17130f]/10 bg-white/75 shadow-[0_24px_80px_rgba(71,52,24,0.14)] backdrop-blur-xl">
        <div className="absolute top-7 h-12 w-12 rounded-full border-[5px] border-[#a87921] bg-white" />
        <div className="absolute bottom-7 h-14 w-24 rounded-t-full border-[5px] border-[#17130f]/75 border-b-0 bg-white" />
        <div className="absolute -right-3 top-8 h-11 w-11 rounded-full bg-[#17130f] text-center text-2xl leading-10 text-white shadow-lg">✦</div>
        <div className="absolute -left-3 bottom-8 h-11 w-11 rounded-full bg-[#a87921] text-center text-xl leading-10 text-white shadow-lg">∞</div>
      </div>
      <p className="relative mt-7 text-xs uppercase tracking-[0.38em] text-[#17130f]/45">People • Stories • Moments</p>
    </div>
  );
}
