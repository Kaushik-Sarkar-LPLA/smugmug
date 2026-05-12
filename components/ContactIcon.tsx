export function ContactIcon() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl px-8 py-10 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(214,181,109,0.24),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(116,185,255,0.20),transparent_26%),radial-gradient(circle_at_50%_92%,rgba(244,180,255,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-2xl border border-[#17130f]/10 bg-white/75 shadow-[0_24px_80px_rgba(71,52,24,0.14)] backdrop-blur-xl">
        <div className="relative h-20 w-24 rounded-xl border-[5px] border-[#17130f]/75 bg-white">
          <div className="absolute left-1/2 top-1/2 h-[5px] w-16 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] bg-[#a87921]" />
          <div className="absolute left-1/2 top-1/2 h-[5px] w-16 -translate-x-1/2 -translate-y-1/2 rotate-[28deg] bg-[#a87921]" />
        </div>
        <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#a87921] text-xl text-white shadow-lg">@</div>
        <div className="absolute -bottom-3 -left-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#17130f] text-lg text-white shadow-lg">✆</div>
      </div>
      <p className="relative mt-7 text-xs uppercase tracking-[0.38em] text-[#17130f]/45">Message • Call • Email</p>
    </div>
  );
}
