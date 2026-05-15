export function FormIcon() {
  return (
    <div className="mx-auto mb-14 max-w-4xl px-5 md:px-8">
      <div className="glass-panel relative overflow-hidden rounded-2xl px-8 py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,181,109,0.24),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(116,185,255,0.20),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(244,180,255,0.18),transparent_30%)]" />
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-[#17130f]/10 bg-white/70 shadow-[0_24px_80px_rgba(71,52,24,0.14)] backdrop-blur-xl">
          <div className="h-20 w-28 rounded-xl border-[6px] border-[#17130f]/75 bg-white shadow-inner">
            <div className="mx-auto mt-4 h-9 w-9 rounded-full border-[6px] border-[#a87921] bg-white" />
          </div>
          <div className="absolute right-8 top-10 h-4 w-8 rounded-sm bg-[#17130f]/75" />
          <div className="absolute -right-2 bottom-8 h-10 w-10 rounded-full border border-[#17130f]/10 bg-[#a87921]/90" />
        </div>
        <p className="relative mt-7 text-xs uppercase tracking-[0.38em] text-[#17130f]/45">Get Started • Book • Enquire • Message • Release</p>
      </div>
    </div>
  );
}