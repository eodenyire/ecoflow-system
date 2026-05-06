import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, Truck, BarChart3, Coins, ShieldCheck, Leaf, MapPin, Users, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TakaFlow — Smart Circular Waste Management for African Cities" },
      { name: "description", content: "Request pickups, track every kilogram from source to recycler, and earn rewards. Built for citizens, collectors, and city authorities." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" width={1600} height={1100} className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28 md:pb-40">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground/80">
              <Leaf className="h-3.5 w-3.5 text-accent" /> Smart Circular Waste Ecosystem
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-7xl">
              Turn waste into a <span className="bg-gradient-leaf bg-clip-text text-transparent">traceable, optimised, monetised</span> resource.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              TakaFlow connects households, informal collectors, recyclers and city authorities on a single platform — from request to recycling, every kilogram is tracked.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-leaf text-primary-foreground shadow-glow hover:opacity-95">
                <Link to="/auth">Request a pickup <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#ecosystem">Explore the ecosystem</a>
              </Button>
            </div>
            <dl className="mt-14 grid grid-cols-3 gap-6 max-w-xl">
              {[
                { k: "50%", v: "Collection efficiency" },
                { k: "100%", v: "Traceable waste" },
                { k: "1×", v: "Tap to schedule" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border/50 bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">A single loop. Three roles. Zero friction.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">From the citizen tapping a button to the recycler closing the loop — every actor sees what matters, in real time.</p>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Citizens", desc: "Request scheduled or on-demand pickups, segregate by type, and earn rewards for every recycled kilogram." },
              { icon: Truck, title: "Collectors", desc: "Receive optimised jobs, navigate routes, confirm with photo proof, and track earnings transparently." },
              { icon: BarChart3, title: "Authorities", desc: "Live operational dashboards, illegal-dumping heatmaps, and end-to-end material flow analytics." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:shadow-elegant">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-leaf text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">0{i + 1}</div>
                <h3 className="font-display text-2xl font-semibold">{title}</h3>
                <p className="mt-3 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section id="ecosystem" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-accent">The ecosystem</span>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">Six layers, one circular system.</h2>
              <p className="mt-4 text-muted-foreground">TakaFlow blends the best of SWaCH, Singapore NEA, Sweden's circular model and TakaTaka Solutions — adapted for the realities of Nairobi and beyond.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { i: Recycle, t: "Circular processing" },
                  { i: MapPin, t: "Smart routing" },
                  { i: Coins, t: "M-Pesa & rewards" },
                  { i: Factory, t: "Recycler marketplace" },
                  { i: ShieldCheck, t: "Compliance & traceability" },
                  { i: Users, t: "Informal sector inclusion" },
                ].map(({ i: I, t }) => (
                  <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
                    <I className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl border border-border bg-gradient-hero p-8 text-primary-foreground shadow-elegant">
                <div className="text-xs font-mono uppercase tracking-widest text-accent">Live snapshot</div>
                <div className="mt-6 grid gap-6">
                  {[
                    { label: "Pickups today", value: "1,284", trend: "+18%" },
                    { label: "Kg diverted from landfill", value: "9,402", trend: "+24%" },
                    { label: "Active collectors", value: "317", trend: "+6%" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-end justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="text-xs uppercase tracking-wider opacity-70">{s.label}</div>
                        <div className="mt-1 font-display text-3xl font-bold">{s.value}</div>
                      </div>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">{s.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="impact" className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-balance">Build the city that runs on its own waste.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Sign up as a citizen, collector, or city partner. Start with a single pickup — scale to a national infrastructure.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-leaf text-primary-foreground shadow-glow">
              <Link to="/auth">Create your account <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-accent" /> TakaFlow © {new Date().getFullYear()}</div>
          <div>Built for African cities. Designed for the world.</div>
        </div>
      </footer>
    </div>
  );
}
