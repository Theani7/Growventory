import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf, Sprout, BarChart3, HeartPulse, FileBarChart, Bell,
  ArrowRight, CheckCircle2, Shield, Zap, TrendingUp,
  Boxes, Users, Sparkles,
} from 'lucide-react';
import { Reveal } from '../components/Reveal';

const features = [
  { icon: Sprout, title: 'Plant Inventory', description: 'Track unlimited plants with images, categories, and live stock.', accent: 'from-emerald-400 to-emerald-600' },
  { icon: HeartPulse, title: 'Health Monitoring', description: 'Log health checks and growth stages, get alerts in real time.', accent: 'from-rose-400 to-rose-600' },
  { icon: BarChart3, title: 'Stock Management', description: 'Record movements, set thresholds, and approve adjustments.', accent: 'from-blue-400 to-blue-600' },
  { icon: FileBarChart, title: 'Reports & Analytics', description: 'Generate CSV exports and visualize nursery performance.', accent: 'from-violet-400 to-violet-600' },
  { icon: Bell, title: 'Smart Notifications', description: 'Instant alerts for low stock, health issues, and tasks.', accent: 'from-amber-400 to-amber-600' },
  { icon: Users, title: 'Role-Based Access', description: 'Admin, supervisor, staff, and auditor permissions built-in.', accent: 'from-indigo-400 to-indigo-600' },
];

const steps = [
  { step: '01', title: 'Create your account', desc: 'Register with your email and start managing your nursery.' },
  { step: '02', title: 'Add your inventory', desc: 'Add plants in bulk or manually with rich details and images.' },
  { step: '03', title: 'Start managing', desc: 'Track stock, monitor health, and generate reports instantly.' },
];

const benefits = [
  { icon: Zap, title: 'Lightning-fast', desc: 'Real-time search, instant filtering' },
  { icon: Shield, title: 'Enterprise security', desc: 'Role-based access, encrypted data' },
  { icon: TrendingUp, title: 'Actionable insights', desc: 'Analytics that drive decisions' },
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

const stats = [
  { label: 'Plants', value: '524', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Stock', value: '8.2k', color: 'bg-blue-100 text-blue-700' },
  { label: 'Healthy', value: '98%', color: 'bg-forest-100 text-forest-700' },
];

const bars = [40, 65, 50, 80, 60, 90, 70, 95, 75, 88, 100, 85];

const trustItems = ['Inventory', 'Health', 'Analytics', 'Reports', 'Tasks', 'Notifications', 'Categories', 'Stock'];

const leaves = [
  { left: '6%', size: 28, duration: 22, delay: 0, hue: 'text-emerald-400' },
  { left: '18%', size: 20, duration: 28, delay: 4, hue: 'text-forest-400' },
  { left: '32%', size: 32, duration: 24, delay: 8, hue: 'text-emerald-300' },
  { left: '48%', size: 22, duration: 30, delay: 2, hue: 'text-forest-300' },
  { left: '62%', size: 26, duration: 26, delay: 6, hue: 'text-emerald-500' },
  { left: '74%', size: 18, duration: 32, delay: 10, hue: 'text-forest-400' },
  { left: '88%', size: 30, duration: 25, delay: 1, hue: 'text-emerald-400' },
  { left: '94%', size: 22, duration: 29, delay: 7, hue: 'text-forest-500' },
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
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm'
            : 'bg-white/70 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png" alt="Growventory Logo" className="w-12 h-12 object-contain transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105" />
              <span className="font-bold text-lg text-gray-900 tracking-tight">Growventory</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-underline text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how" className="nav-underline text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
              <a href="#why" className="nav-underline text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-primary group">
                Get started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="blob-drift absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px]"></div>
          <div className="blob-drift-slow absolute top-20 right-1/4 w-[400px] h-[400px] bg-forest-300/30 rounded-full blur-[120px]"></div>
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Floating leaves */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {leaves.map((l, i) => (
            <Leaf
              key={i}
              className={`leaf-float absolute ${l.hue} opacity-70`}
              style={{
                left: l.left,
                width: l.size,
                height: l.size,
                top: 0,
                animationDuration: `${l.duration}s`,
                animationDelay: `${l.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto text-center relative">
          <Reveal variant="fade-up" delay={0} duration={700}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Built for modern nurseries
            </span>
          </Reveal>

          <Reveal variant="fade-up" delay={120} duration={800}>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Smart Nursery Management{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-forest-600 to-emerald-700 text-shimmer">
                Powered by Cloud Intelligence
              </span>
            </h1>
          </Reveal>

          <Reveal variant="fade-up" delay={260} duration={700}>
            <p className="mt-8 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Monitor plant inventory, track stock levels, monitor plant health, and streamline nursery operations through a centralized cloud platform.
            </p>
          </Reveal>

          <Reveal variant="fade-up" delay={400} duration={700}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="btn-primary text-base px-7 py-3.5 shadow-lg shadow-forest-700/20 hover:shadow-forest-700/30 group">
                Get started
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-7 py-3.5">
                Sign in
              </Link>
            </div>
          </Reveal>

          <Reveal variant="fade-in" delay={560} duration={600}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              {['Real-Time Inventory Tracking', 'Plant Health Monitoring', 'Cloud-Based Data Management'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Hero visual - dashboard mockup */}
          <Reveal variant="blur-in" delay={500} duration={900} className="mt-20">
            <div className="relative max-w-5xl mx-auto">
              <div className="glow-pulse absolute -inset-x-20 -inset-y-10 bg-gradient-to-tr from-forest-200/30 via-emerald-200/30 to-forest-300/30 rounded-[3rem] blur-3xl -z-10"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden transition-transform duration-500 hover:-translate-y-1 hover:shadow-3xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="px-3 py-1 bg-white rounded-md text-xs text-gray-500 font-mono inline-block">
                      growventory.app/dashboard
                    </div>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="grid grid-cols-12 gap-3 p-6 bg-gray-50/50">
                  <div className="col-span-3 space-y-2">
                    {[Sprout, Boxes, HeartPulse, BarChart3, Bell].map((Icon, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors duration-200 ${i === 0 ? 'bg-forest-50 text-forest-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <div className={`h-2 flex-1 rounded ${i === 0 ? 'bg-forest-200' : 'bg-gray-200'}`}></div>
                      </div>
                    ))}
                  </div>
                  <div className="col-span-9 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {stats.map((s, i) => (
                        <Reveal key={s.label} variant="scale-in" delay={700 + i * 120} duration={500} once>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 transition-shadow duration-300 hover:shadow-md">
                            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>{s.label}</div>
                            <div className="text-2xl font-bold text-gray-900 mt-2 tabular-nums">{s.value}</div>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                    <Reveal variant="fade-in" delay={1000} duration={600} once>
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-end gap-2 h-32">
                          {bars.map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bar-grow bg-gradient-to-t from-forest-600 to-emerald-400 rounded-t"
                              style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Trust strip — marquee */}
          <Reveal variant="fade-in" delay={1200} duration={600} className="mt-16">
            <p className="text-sm text-gray-500 font-medium text-center mb-4">Designed for modern nurseries</p>
            <div className="relative overflow-hidden">
              <div className="marquee-track flex gap-12 whitespace-nowrap will-change-transform">
                {[...trustItems, ...trustItems].map((name, i) => (
                  <span key={i} className="text-base font-bold text-gray-400 tracking-tight">{name}</span>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent"></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent"></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-16 px-6 lg:px-8 bg-gradient-to-r from-forest-700 to-forest-800 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl blob-drift"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-forest-400/10 rounded-full blur-3xl blob-drift-slow"></div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {metrics.map((m, i) => (
            <Reveal key={m.label} variant="fade-up" delay={i * 120} duration={600}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {m.icon}
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white tabular-nums">{m.value}</div>
                <div className="text-sm text-forest-200 mt-1">{m.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-forest-700 uppercase tracking-wider">Features</span>
            <h2 className="mt-3 text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-5 text-lg text-gray-600">
              Purpose-built features for nursery operations, designed to save you hours every week.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} variant="fade-up" delay={(i % 3) * 120} duration={600}>
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full hover:-translate-y-1">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} shadow-md mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/60 transition-all duration-500 rounded-b-2xl"></div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-forest-700 uppercase tracking-wider">Workflow</span>
            <h2 className="mt-3 text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Up and running in minutes
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-forest-300 to-transparent"></div>
            {steps.map((item, i) => (
              <Reveal key={item.step} variant="scale-in" delay={i * 180} duration={600}>
                <div className="relative text-center group">
                  <div className="relative inline-flex items-center justify-center w-14 h-14 bg-white border-2 border-forest-200 rounded-2xl text-forest-700 text-lg font-bold mb-5 shadow-sm transition-all duration-300 group-hover:border-forest-400 group-hover:shadow-md group-hover:-translate-y-1">
                    {item.step}
                    <span className="absolute -inset-1 rounded-2xl bg-emerald-200/0 group-hover:bg-emerald-200/30 transition-colors duration-500 -z-10"></span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits split */}
      <section id="why" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-forest-700 uppercase tracking-wider">Why Growventory</span>
            <h2 className="mt-3 text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Built for nursery professionals
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal variant="slide-left" duration={700}>
              <div>
                <p className="text-lg text-gray-600">
                  Whether you manage a small garden center or a large operation, Growventory is designed to handle it.
                </p>
                <ul className="mt-8 space-y-4">
                  {benefits.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Reveal key={item.title} variant="slide-right" delay={i * 140} duration={600}>
                        <li className="flex items-start gap-4 group">
                          <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-forest-100 group-hover:scale-110">
                            <Icon className="w-5 h-5 text-forest-700" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                          </div>
                        </li>
                      </Reveal>
                    );
                  })}
                </ul>
              </div>
            </Reveal>

            <Reveal variant="slide-right" duration={700}>
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-tr from-forest-200/40 to-emerald-200/40 rounded-3xl blur-2xl transition-opacity duration-500 group-hover:opacity-80"></div>
                <div className="relative card p-8 transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-elevated-lg">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Modules', value: '8+' },
                      { label: 'User roles', value: '4' },
                      { label: 'Tech stack', value: 'MERN' },
                      { label: 'Database', value: 'MySQL' },
                    ].map((item, i) => (
                      <Reveal key={item.label} variant="scale-in" delay={200 + i * 100} duration={500}>
                        <div className="bg-gray-50 rounded-xl p-4 text-center transition-colors duration-300 hover:bg-emerald-50">
                          <div className="text-2xl font-bold text-forest-700">{item.value}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      A complete nursery inventory management system featuring authentication, role-based access control, real-time stock tracking, and analytics — built as a Final Year Project.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal variant="scale-in" duration={700}>
            <div className="relative bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 rounded-3xl p-12 lg:p-16 overflow-hidden group">
              <div className="blob-drift absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"></div>
              <div className="blob-drift-slow absolute bottom-0 left-0 w-96 h-96 bg-forest-400/20 rounded-full blur-3xl"></div>
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  Ready to get started?
                </h2>
                <p className="mt-5 text-lg text-forest-100">
                  Create your account and start managing your nursery in minutes.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-forest-800 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-0.5 group/btn">
                    Create account
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <Reveal variant="fade-up" delay={0} duration={500}>
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src="/logo.png" alt="Growventory Logo" className="w-12 h-12 object-contain" />
                  <span className="font-bold text-lg text-white">Growventory</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The complete nursery inventory management solution.
                </p>
              </div>
            </Reveal>
            {[
              { title: 'Product', items: ['Features', 'How it works', 'Modules', 'Roadmap'] },
              { title: 'Resources', items: ['Documentation', 'API Reference', 'Help Center', 'GitHub'] },
              { title: 'Project', items: ['About', 'Contact', 'Credits', 'License'] },
            ].map((col, ci) => (
              <Reveal key={col.title} variant="fade-up" delay={(ci + 1) * 120} duration={500}>
                <div>
                  <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
                  <ul className="space-y-2.5">
                    {col.items.map((item) => (
                      <li key={item}>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block hover:translate-x-0.5">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal variant="fade-in" duration={500} className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Growventory. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.403 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
