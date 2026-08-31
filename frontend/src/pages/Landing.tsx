import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout, BarChart3, HeartPulse, FileBarChart, Bell,
  ArrowRight, Shield, Zap, TrendingUp,
  Boxes, Users,
} from 'lucide-react';
import { Reveal } from '../components/Reveal';

const features = [
  { icon: Sprout, title: 'Plant Inventory', description: 'Track unlimited plants with images, categories, and live stock.' },
  { icon: HeartPulse, title: 'Health Monitoring', description: 'Log health checks and growth stages, get alerts in real time.' },
  { icon: BarChart3, title: 'Stock Management', description: 'Record movements, set thresholds, and approve adjustments.' },
  { icon: FileBarChart, title: 'Reports & Analytics', description: 'Generate CSV exports and visualize nursery performance.' },
  { icon: Bell, title: 'Smart Notifications', description: 'Instant alerts for low stock, health issues, and tasks.' },
  { icon: Users, title: 'Role-Based Access', description: 'Admin, supervisor, staff, and auditor permissions built-in.' },
];

const steps = [
  { step: '01', title: 'Create your account', desc: 'Register with your email and start managing your nursery.' },
  { step: '02', title: 'Add your inventory', desc: 'Add plants in bulk or manually with rich details and images.' },
  { step: '03', title: 'Start managing', desc: 'Track stock, monitor health, and generate reports instantly.' },
];

type Metric = { icon: React.ReactNode; value: string; label: string };
const CloudIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);
const metrics: Metric[] = [
  { icon: <Users className="w-6 h-6 text-white" />, value: '4', label: 'User Roles' },
  { icon: <Boxes className="w-6 h-6 text-white" />, value: '8+', label: 'Management Modules' },
  { icon: <CloudIcon className="w-6 h-6 text-white" />, value: 'Cloud', label: 'Cloud-Based Platform' },
  { icon: <TrendingUp className="w-6 h-6 text-white" />, value: 'Real-Time', label: 'Analytics' },
];

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfdfc] overflow-x-clip">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-stone-200 shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png" alt="Growventory Logo" className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-105" />
              <span className="font-bold text-[17px] text-stone-900 tracking-tight">Growventory</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[13px] font-medium tracking-wide text-stone-600 hover:text-stone-900 transition-colors">Features</a>
              <a href="#how" className="text-[13px] font-medium tracking-wide text-stone-600 hover:text-stone-900 transition-colors">How it works</a>
              <a href="#why" className="text-[13px] font-medium tracking-wide text-stone-600 hover:text-stone-900 transition-colors">About</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors">Sign in</Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1a3a2a] text-white text-sm font-semibold rounded-full hover:bg-[#143021] transition-all shadow-sm hover:shadow-md hover:-translate-y-px">
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — Split Editorial */}
      <section className="relative min-h-[100dvh] flex items-center pt-[72px] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-12 lg:py-0">
          <div className="grid lg:grid-cols-[1.05fr_1.15fr] gap-10 lg:gap-8 items-center">
            {/* Left copy */}
            <Reveal variant="fade-up" duration={800}>
              <div className="max-w-[560px]">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#eef6ee] border border-[#d6ead6] rounded-full text-[12px] font-semibold tracking-wide text-[#1d4d2e]">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live inventory • Cloud sync
                </div>
                <h1 className="mt-6 text-[42px] sm:text-[54px] lg:text-[58px] font-bold tracking-[-0.03em] leading-[0.95] text-stone-900">
                  Smart nursery<br />
                  <span className="text-[#1d4d2e]">management,</span><br />
                  without the chaos.
                </h1>
                <p className="mt-5 text-[17px] leading-[1.6] text-stone-600 max-w-[48ch]">
                  Track every plant, monitor health, and control stock from one calm, cloud-based workspace. Built for growers, not spreadsheets.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1a3a2a] text-white font-semibold rounded-full hover:bg-[#143021] transition-all shadow-lg shadow-[#1a3a2a]/20 hover:shadow-xl hover:-translate-y-0.5">
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center px-7 py-3.5 bg-white border border-stone-200 text-stone-800 font-semibold rounded-full hover:bg-stone-50 transition-colors">
                    View demo
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Right image — hero-greenhouse */}
            <Reveal variant="blur-in" delay={200} duration={900}>
              <div className="relative lg:ml-4">
                <div className="relative rounded-[24px] overflow-hidden bg-stone-100 shadow-2xl shadow-stone-900/10 border border-stone-200">
                  <img
                    src="/hero-greenhouse.png"
                    alt="Modern greenhouse interior with lush plants on wooden benches, sunlit"
                    className="w-full h-[520px] lg:h-[560px] object-cover"
                    loading="eager"
                  />
                  {/* Subtle gradient scrim for legibility of overlay card */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 via-transparent to-transparent pointer-events-none" />
                  {/* Floating inventory card */}
                  <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[300px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Live inventory</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Updated now
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 flex items-center gap-2"><span className="w-2 h-2 bg-stone-800 rounded-full" /> Monstera Deliciosa</span>
                        <span className="font-semibold text-stone-900">342</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-600 rounded-full" /> Snake Plant</span>
                        <span className="font-semibold text-emerald-700">+18 today</span>
                      </div>
                      <div className="h-px bg-stone-100 my-2" />
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Low stock alerts</span>
                        <span className="font-semibold text-amber-600">3 need attention</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative shadow blob */}
                <div className="absolute -z-10 -bottom-6 -right-6 w-[80%] h-[60%] bg-[#1d4d2e]/10 rounded-[24px] blur-2xl" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-8 border-y border-stone-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-400">Powering nurseries that grow</p>
            <div className="flex flex-wrap gap-6 text-sm font-semibold tracking-tight text-stone-400">
              {['Inventory', 'Health', 'Analytics', 'Reports', 'Tasks', 'Stock'].map((w) => (
                <span key={w} className="inline-flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full" />{w}</span>
              ))}
            </div>
            <span className="text-xs text-stone-500">Trusted for FYP • Cloud • Real-time</span>
          </div>
        </div>
      </section>

      {/* Stats — subtle */}
      <section className="py-12 px-6 lg:px-8 bg-[#f6f7f5] border-b border-stone-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#1a3a2a] flex items-center justify-center flex-shrink-0">
                {m.icon}
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-stone-900 leading-none">{m.value}</div>
                <div className="text-xs font-medium tracking-wide text-stone-500 uppercase mt-1">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Bento with real image */}
      <section id="features" className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl lg:text-[42px] font-bold tracking-tight leading-[0.95] text-stone-900">
              Everything you need.<br />
              <span className="text-stone-400">Nothing you don't.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600 max-w-[52ch]">
              Purpose-built for nursery ops — inventory, health, stock, and reporting in one quiet workspace.
            </p>
          </div>

          <div className="mt-12 grid lg:grid-cols-12 gap-5">
            {/* Large image card — feature-inventory */}
            <Reveal variant="fade-up" className="lg:col-span-7">
              <div className="relative h-full min-h-[420px] rounded-[20px] overflow-hidden bg-stone-900 border border-stone-200 group">
                <img
                  src="/feature-inventory.png"
                  alt="Top-down of six potted plants with QR tags and inventory clipboard, gloved hands"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/95 backdrop-blur rounded-full text-xs font-semibold text-stone-800 mb-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Most loved — Inventory
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">Scan, tag, and track — from potting to sale</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-200 max-w-[50ch]">QR tags, categories, images, and live stock in one table. Add 100 plants in minutes via CSV.</p>
                </div>
              </div>
            </Reveal>

            {/* Right 2x3 grid of features */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.slice(1).map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-[#fcfdfc] border border-stone-200 rounded-[16px] p-5 hover:border-stone-300 hover:shadow-md transition-all">
                    <div className="w-9 h-9 rounded-xl bg-[#1a3a2a] flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-stone-900 leading-tight">{f.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">{f.description}</p>
                  </div>
                );
              })}
              {/* Small note card */}
              <div className="sm:col-span-2 bg-[#1a3a2a] rounded-[16px] p-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Role-based, secure</p>
                  <p className="text-xs text-white/70 mt-1">Admin • Supervisor • Staff • Auditor</p>
                </div>
                <Shield className="w-8 h-8 text-white/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 lg:px-8 bg-[#f6f7f5] border-y border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-stone-900 leading-none">
              Live in three<br />
              deliberate steps.
            </h2>
            <p className="text-sm leading-relaxed text-stone-600 max-w-[36ch]">No onboarding theatre. Create an account, add your plants, and start tracking — the rest is just growing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-[16px] border border-stone-200 p-6 pt-8 hover:shadow-md transition-shadow">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#1a3a2a] text-white text-xs font-bold tracking-wide rounded-full">{s.step}</div>
                <h3 className="mt-2 text-base font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-stone-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why — Team image split */}
      <section id="why" className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          {/* Image */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[20px] overflow-hidden bg-stone-100 border border-stone-200">
              <img
                src="/team-nursery.jpeg"
                alt="Three nursery workers in aprons looking at tablet with growth data inside greenhouse"
                className="w-full h-[480px] object-cover object-center"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl border border-stone-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eef6ee] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#1d4d2e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Growth data • May 2024 live</p>
                  <p className="text-xs text-stone-500">Tablet sync with cloud — real-time for every role.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-6 lg:pl-8">
            <h2 className="text-3xl lg:text-[40px] font-bold tracking-tight leading-[0.95] text-stone-900">
              Built for nursery<br />
              professionals.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Whether you run a small garden center or a large operation, Growventory stays calm, fast, and honest. No dark patterns, no clutter.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Zap, title: 'Lightning-fast', desc: 'Real-time search and instant filtering, even with thousands of plants.' },
                { icon: Shield, title: 'Enterprise-grade security', desc: 'Encrypted data and strict role-based access control.' },
                { icon: TrendingUp, title: 'Actionable insights', desc: 'Stock and health analytics that drive decisions, not dashboards.' },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#eef6ee] border border-[#d6ead6] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#1d4d2e]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">{b.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">{b.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a2a] text-white text-sm font-semibold rounded-full hover:bg-[#143021] transition-colors">
                Create your account <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center px-6 py-3 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-full hover:bg-stone-50">Explore features</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — aerial image background */}
      <section className="relative mx-6 lg:mx-8 my-10 rounded-[24px] overflow-hidden border border-stone-200">
        <img
          src="/cta-aerial.png"
          alt="Aerial view of nursery fields at golden hour with neat rows of seedlings"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#1a3a2a]/80 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center px-6 py-20 lg:py-28">
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-white leading-none">
            Ready to grow<br />
            without the guesswork?
          </h2>
          <p className="mt-4 text-base lg:text-lg leading-relaxed text-white/80 max-w-[48ch] mx-auto">
            Join Growventory today — from first seedling to full field, your inventory stays accurate and calm.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#1a3a2a] font-semibold rounded-full hover:bg-stone-50 transition-colors shadow-lg">
              Create account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 backdrop-blur text-white font-semibold rounded-full border border-white/20 hover:bg-white/15 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-[#0f1f14] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Growventory" className="w-9 h-9 object-contain" />
                <span className="font-bold text-white">Growventory</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-[28ch]">The calm nursery OS — inventory, health, and stock in one place.</p>
            </div>
            {[
              { title: 'Product', items: ['Features', 'How it works', 'Modules'] },
              { title: 'Resources', items: ['Documentation', 'API', 'Help'] },
              { title: 'Project', items: ['About', 'Contact', 'License'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold tracking-wide text-white/90 uppercase">{col.title}</h4>
                <ul className="mt-3 space-y-2">
                  {col.items.map((it) => (
                    <li key={it}><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">{it}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} Growventory. All rights reserved.</p>
            <div className="flex items-center gap-3 text-white/50">
              <span className="text-xs">Built for growers, not spreadsheets.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
