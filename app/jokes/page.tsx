"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Quote, Github } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function JokesPage() {
  const [joke, setJoke] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJoke = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jokes');
      const data = await response.json();
      setJoke(data.joke);
    } catch (error) {
      console.error("Failed to fetch joke:", error);
      setJoke("Oops! Failed to fetch a joke. Maybe the server is too tired?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl z-10"
      >
        <div className="text-center mb-12 space-y-4">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            AI-Engineered Humor
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground bg-clip-text">
            Vibe <span className="text-primary italic">Jokes</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            A premium demonstration of API integration in Next.js.
          </p>
        </div>

        <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="pb-0 pt-8 px-8 text-center">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                <Quote className="text-primary w-6 h-6" />
             </div>
             <CardTitle className="text-xl font-bold">The Punchline Engine</CardTitle>
             <CardDescription>Click below to fetch a random joke from our API.</CardDescription>
          </CardHeader>

          <CardContent className="p-8 flex flex-col items-center gap-8">
            <div className="min-h-[120px] w-full flex items-center justify-center text-center px-4 relative">
              <AnimatePresence mode="wait">
                {joke ? (
                  <motion.p
                    key={joke}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-2xl font-medium text-foreground leading-snug tracking-tight"
                  >
                    "{joke}"
                  </motion.p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground/50 italic"
                  >
                    Waiting for your command...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button
              size="lg"
              onClick={fetchJoke}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all group overflow-hidden"
            >
               <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                )}
                {isLoading ? "Fetching Humor..." : "Get Random Joke"}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </CardContent>
        </Card>

        <div className="mt-12 flex justify-between items-center px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Status: Operational
           </div>
           <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                Documentation
              </a>
              <span>•</span>
              <a href="https://github.com/vibe-org/vibe-coding-platform" target="_blank" className="hover:text-primary transition-colors flex items-center gap-1">
                <Github size={12} /> Source
              </a>
           </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium tracking-[0.2em] text-foreground lowercase">
          built with obsession by vibe
        </p>
      </div>
    </div>
  );
}
