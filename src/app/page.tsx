import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative">
      {/* Grid Lines Background */}
      <div className="absolute inset-0 pointer-events-none z-0 grid-lines opacity-100" />

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 pt-24 md:pt-32">

        {/* Dynamic Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-between relative px-6">

          {/* Top Left Text - Desktop Only */}
          <div className="hidden md:block max-w-[200px] mt-44 text-xs font-medium tracking-widest uppercase opacity-70 animate-reveal-up delay-200">
            <p>Persistent Memory</p>
            <p>For AI Agents</p>
          </div>

          {/* Mobile Hero Layout */}
          <div className="flex flex-col md:hidden mt-8">
            <h1 className="text-[14vw] leading-[1] tracking-tight font-semibold animate-reveal-up delay-200">
              Meet <span className="text-stroke">Echo</span>
            </h1>
            <p className="text-lg font-normal leading-relaxed mt-8 animate-reveal-up delay-300">
              Echo redefines <span className="font-semibold">design, workflows,</span> empowering you to scale creative, protect what matters, and launch faster—unlocking your <span className="text-stroke font-medium">memory potential.</span>
            </p>
          </div>

          {/* Desktop Hero Grid */}
          <div className="hidden md:grid grid-cols-2 items-end mt-auto relative z-10 border-t border-border/50">
            {/* Huge Headline */}
            <div className="pt-12 pb-12 border-r border-border/50 pr-8">
              <h1 className="text-[8vw] leading-[0.85] tracking-tighter font-semibold -ml-[0.05em] animate-reveal-up delay-200">
                <span className="text-foreground">Meet</span> <span className="text-stroke">Echo</span>
              </h1>
            </div>

            {/* Description Block */}
            <div className="pt-12 pb-12 pl-14 md:pl-32 flex flex-col animate-reveal-up delay-400">
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 px-6 py-3 border border-border text-lg font-medium tracking-wider uppercase hover:border-[#4ade80] hover:text-[#4ade80] transition-colors w-fit mb-6"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <p className="text-xl md:text-5xl font-normal leading-snug mb-0">
                Your AI's long-term memory. Store, search, and recall context with <span className="text-stroke font-medium">human-like precision.</span>
              </p>
            </div>
          </div>

        </section>

        {/* Abilities Section */}
        <section id="abilities" className="border-t border-border/50 relative mt-20 md:mt-32">

          {/* Section Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border/50">
            <div className="p-6 md:p-12 md:border-r border-border/50">
              <span className="text-sm md:text-base font-medium tracking-widest uppercase text-foreground">Abilities</span>
            </div>
            <div className="p-6 md:p-12">
              <h2 className="text-2xl md:text-4xl font-medium leading-tight">
                Everything you need to give your AI <span className="text-stroke">perfect recall</span>
              </h2>
            </div>
          </div>

          {/* Abilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

            {/* Ability 1 - Memory Graph */}
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-border/50 flex flex-col min-h-[280px] md:min-h-[350px] hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors group">
              <span className="text-6xl md:text-7xl font-light text-foreground/10 group-hover:text-[#4ade80]/30 transition-colors">01</span>
              <div className="mt-auto">
                <h3 className="text-xl md:text-2xl font-medium mb-3">Memory Graph</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">Auto-links related memories. Extends, contradicts, or connects—relationships form automatically.</p>
              </div>
            </div>

            {/* Ability 2 - Smart Filtering */}
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-border/50 flex flex-col min-h-[280px] md:min-h-[350px] hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors group">
              <span className="text-6xl md:text-7xl font-light text-foreground/10 group-hover:text-[#4ade80]/30 transition-colors">02</span>
              <div className="mt-auto">
                <h3 className="text-xl md:text-2xl font-medium mb-3">Smart Filtering</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">AI classifies memories as persistent, ephemeral, or irrelevant. Only store what matters.</p>
              </div>
            </div>

            {/* Ability 3 - User Profiles */}
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-r border-border/50 flex flex-col min-h-[280px] md:min-h-[350px] hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors group">
              <span className="text-6xl md:text-7xl font-light text-foreground/10 group-hover:text-[#4ade80]/30 transition-colors">03</span>
              <div className="mt-auto">
                <h3 className="text-xl md:text-2xl font-medium mb-3">User Profiles</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">Separates static facts from dynamic context. Permanent info stays, temporary state evolves.</p>
              </div>
            </div>

            {/* Ability 4 - Importance Ranking */}
            <div className="p-6 md:p-10 border-b md:border-b-0 border-border/50 flex flex-col min-h-[280px] md:min-h-[350px] hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors group">
              <span className="text-6xl md:text-7xl font-light text-foreground/10 group-hover:text-[#4ade80]/30 transition-colors">04</span>
              <div className="mt-auto">
                <h3 className="text-xl md:text-2xl font-medium mb-3">Importance Ranking</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">Scores by similarity, recency, importance, and decay. Surface what matters most.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Big CTA */}
        <section className="py-32 px-6 border-t border-border/50 text-center">
          <h2 className="text-5xl md:text-8xl font-medium tracking-tight mb-8 animate-reveal-up">
            Ready to <span className="text-stroke">Start?</span>
          </h2>
          <Link
            href="/signup"
            className="inline-block px-12 py-5 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-[#4ade80] hover:text-black transition-all"
          >
            Get 100 Free Memories
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t-4 border-[#4ade80] px-6 py-6 flex flex-col md:flex-row justify-between items-end gap-6 text-xs font-medium tracking-widest uppercase text-foreground-muted">
          <div className="flex flex-col gap-2">
            <span>© 2026 Peargent Echo</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Twitter</Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
