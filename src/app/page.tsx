import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EAE5D9] text-[#1a1a1a] font-sans overflow-x-hidden relative">
      {/* Grid Lines Background */}
      <div className="fixed inset-0 pointer-events-none z-0 grid-lines opacity-100" />

      {/* Fixed Header Elements */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-start text-xs font-medium tracking-widest uppercase">
        <div className="flex items-center gap-2 animate-reveal-up">
          <div className="w-3 h-3 bg-[#4ade80] rounded-sm animate-pulse" /> {/* Pear Green Accent */}
          <span>Echo</span>
        </div>

        <div className="flex gap-6 animate-reveal-up delay-100">
          <Link href="/login" className="hover:text-[#4ade80] transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-[#4ade80] transition-colors">Sign Up</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">

        {/* Dynamic Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-between relative px-6">

          {/* Top Left Text */}
          <div className="max-w-[200px] mt-12 md:mt-0 text-xs font-medium tracking-widest uppercase opacity-70 animate-reveal-up delay-200">
            <p>Memory</p>
            <p>Powered by Code</p>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute right-6 top-[40%] text-xs font-medium tracking-widest uppercase hidden md:block animate-reveal-up delay-300">
            Scroll Down
          </div>

          {/* Massive Typography Hero */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-8 mt-auto relative z-10 pb-12">

            {/* Huge Headline */}
            <div className="col-span-12 md:col-span-8">
              <h1 className="text-huge leading-[0.75] tracking-tighter text-[#1a1a1a] font-medium mix-blend-multiply opacity-90 animate-reveal-up delay-200">
                Meet<br />
                <span className="text-[#4ade80]">Echo</span>
              </h1>
            </div>

            {/* Description Block */}
            <div className="col-span-12 md:col-span-4 md:pb-4 md:pl-8 animate-reveal-up delay-400">
              <h2 className="text-2xl font-medium leading-tight mb-6">
                Redefining AI workflows.<br />
                Protect what matters,<br />
                remember forever.
              </h2>
              <p className="text-[#555] text-sm leading-relaxed mb-8 max-w-sm">
                The persistent memory layer for your AI applications. Store, search, and retrieve context with semantic understanding.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 text-sm font-medium uppercase tracking-wider hover:text-[#4ade80] transition-colors group"
              >
                Start using Echo
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Selected Works / Abilities Grid */}
        <section id="abilities" className="border-t border-[#d6d1c750] relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#d6d1c750]">

            {/* Ability 1 */}
            <div className="p-8 md:p-12 min-h-[350px] flex flex-col justify-between hover:bg-[#E6E1D5] transition-colors group">
              <div className="w-8 h-8 rounded-full border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#4ade80] group-hover:bg-[#4ade80] transition-colors">
                <span className="block w-2 h-2 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium mb-2">Semantic Search</h3>
                <p className="text-sm text-[#555]">Find by meaning, not just keywords.</p>
              </div>
            </div>

            {/* Ability 2 */}
            <div className="p-8 md:p-12 min-h-[350px] flex flex-col justify-between hover:bg-[#E6E1D5] transition-colors group">
              <div className="w-8 h-8 rounded-full border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#4ade80] group-hover:bg-[#4ade80] transition-colors">
                <span className="block w-2 h-2 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium mb-2">Auto-Extraction</h3>
                <p className="text-sm text-[#555]">Entities extracted automatically.</p>
              </div>
            </div>

            {/* Ability 3 */}
            <div className="p-8 md:p-12 min-h-[350px] flex flex-col justify-between hover:bg-[#E6E1D5] transition-colors group">
              <div className="w-8 h-8 rounded-full border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#4ade80] group-hover:bg-[#4ade80] transition-colors">
                <span className="block w-2 h-2 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium mb-2">Smart Decay</h3>
                <p className="text-sm text-[#555]">Forget the noise, keep the signal.</p>
              </div>
            </div>

            {/* Ability 4 */}
            <div className="p-8 md:p-12 min-h-[350px] flex flex-col justify-between hover:bg-[#E6E1D5] transition-colors group">
              <div className="w-8 h-8 rounded-full border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#4ade80] group-hover:bg-[#4ade80] transition-colors">
                <span className="block w-2 h-2 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium mb-2">Secure Storage</h3>
                <p className="text-sm text-[#555]">Enterprise-grade encryption.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Big CTA */}
        <section className="py-32 px-6 border-t border-[#d6d1c750] text-center">
          <h2 className="text-5xl md:text-8xl font-medium tracking-tight mb-8 animate-reveal-up">
            Ready to <span className="text-[#4ade80]">Start?</span>
          </h2>
          <Link
            href="/signup"
            className="inline-block px-12 py-5 bg-[#1a1a1a] text-[#EAE5D9] text-sm uppercase tracking-widest font-medium hover:bg-[#4ade80] hover:text-[#1a1a1a] transition-all"
          >
            Get 100 Free Credits
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#d6d1c750] px-6 py-12 flex flex-col md:flex-row justify-between items-end gap-6 text-xs font-medium tracking-widest uppercase text-[#555]">
          <div className="flex flex-col gap-2">
            <span>© 2024 Peargent Echo</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-[#1a1a1a]">Privacy</Link>
            <Link href="#" className="hover:text-[#1a1a1a]">Terms</Link>
            <Link href="#" className="hover:text-[#1a1a1a]">Twitter</Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
