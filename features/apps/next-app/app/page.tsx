import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans selection:bg-primary/20">
      <main className="flex min-h-[90vh] w-full max-w-4xl flex-col items-center justify-between py-24 px-12 bg-white sm:items-start text-black">
        <div className="flex items-center gap-2 group">
          <div className="p-2 bg-black rounded-xl shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Vibe.Next</span>
        </div>

        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <h1 className="max-w-md text-5xl font-black leading-[1.1] tracking-tight text-black">
            Welcome to your <br />
            <span className="text-zinc-400">Next.js</span> project.
          </h1>
          <p className="max-w-md text-xl leading-8 text-zinc-500 font-medium">
            Step into the future of coding. Edit <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-black font-semibold">app/page.tsx</code> to start building your masterpiece.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full sm:flex-row">
          <a
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black px-8 text-white font-bold transition-all hover:bg-zinc-800 active:scale-95 shadow-xl shadow-black/10 md:w-auto"
            href="https://vibecoding.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Docs
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-8 font-bold text-black transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 md:w-auto"
            href="https://vibecoding.com/templates"
            target="_blank"
            rel="noopener noreferrer"
          >
            Browse Templates
            <ExternalLink className="w-4 h-4 opacity-30" />
          </a>
        </div>

        <div className="w-full pt-12 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
          <span>vibe-coding-platform@2.0</span>
          <div className="flex gap-4">
            <span className="hover:text-black cursor-pointer transition-colors">Github</span>
            <span className="hover:text-black cursor-pointer transition-colors">Discord</span>
          </div>
        </div>
      </main>
    </div>
  );
}
