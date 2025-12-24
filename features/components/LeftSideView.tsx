export default function LeftSideView() {
  return (
    <div className="h-full border-r border-white/10 bg-[#0c0c12]/50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
        Chat & Files
      </div>
      <div className="space-y-2">
        <div className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/5 border border-white/10" />
        <div className="h-10 rounded-lg bg-white/5 border border-white/10" />
      </div>
    </div>
  );
}
