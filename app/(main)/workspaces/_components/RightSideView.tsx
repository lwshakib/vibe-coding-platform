export default function RightSideView() {
  return (
    <div className="h-full bg-[#08080c] p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 animate-spin" />
        </div>
        <h3 className="text-white/80 font-medium">Ready to Preview</h3>
        <p className="text-xs text-white/40 mt-1">
          Select or create a file to see it in action.
        </p>
      </div>
    </div>
  );
}
