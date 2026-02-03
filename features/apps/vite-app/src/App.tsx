import { Sparkles, ArrowRight, Layers } from "lucide-react";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans selection:bg-blue-500/10">
      <main className="flex min-h-[90vh] w-full max-w-4xl flex-col items-center justify-between py-24 px-12 bg-white sm:items-start text-black">
        <div className="flex items-center gap-2 group">
          <div className="p-2 bg-blue-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Vibe.React</span>
        </div>

        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <h1 className="max-w-md text-5xl font-black leading-[1.1] tracking-tight text-black">
            Speed. Flow. <br />
            <span className="text-zinc-400">Excellence.</span>
          </h1>
          <p className="max-w-md text-xl leading-8 text-zinc-500 font-medium">
            Your high-performance React application is ready. Edit <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-black font-semibold">src/App.tsx</code> to bring your vision to life.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full sm:flex-row">
          <button
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 text-white font-bold transition-all hover:bg-blue-700 active:scale-95 shadow-xl shadow-blue-500/10 md:w-auto"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-8 font-bold text-black transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 md:w-auto"
          >
            <Layers className="w-4 h-4 opacity-40" />
            Component Library
          </button>
        </div>

        <div className="w-full pt-12 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
          <span>Powered by Vite & Vibe</span>
          <div className="flex gap-4">
            <span className="hover:text-black cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-black cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </main>
    </div>
  );
}
