import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRight, Sparkles, Layers, QrCode, FileDown, Palette, Monitor, Smartphone, CreditCard, Presentation, Image as ImageIcon, Briefcase, Tag, BadgeCheck, Globe } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <img src="/Quicko-Logo.png" alt="Quicko" className="h-7 sm:h-8 w-auto md:h-10 object-contain" />
            <span className="font-bold text-foreground text-lg sm:text-xl md:text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Quicko</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button className="gap-2 brand-gradient border-0 text-white hover:opacity-90">Dashboard <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="gap-2 brand-gradient border-0 text-white hover:opacity-90" size="sm">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Your All-in-One Design Studio
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Design <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Anything.</span><br />
          Create <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Everywhere.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 px-2">
          Presentations, social media graphics, posters, business cards, labels, ID cards — 
          one powerful editor for all your design needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={user ? '/dashboard' : '/auth?mode=signup'}>
            <Button size="lg" className="gap-2 text-sm sm:text-base px-8 brand-gradient border-0 text-white hover:opacity-90 brand-glow">
              Start Designing Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Design types strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {[
            { icon: Presentation, label: 'Presentations' },
            { icon: Smartphone, label: 'Social Media' },
            { icon: ImageIcon, label: 'Posters' },
            { icon: Briefcase, label: 'Business Cards' },
            { icon: Tag, label: 'Labels' },
            { icon: BadgeCheck, label: 'ID Cards' },
            { icon: Globe, label: 'Web Banners' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-foreground hover:border-primary/50 transition-colors cursor-default">
              <t.icon className="w-4 h-4 text-primary" /> {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Everything you need to design
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { icon: Layers, title: 'Drag & Drop Editor', desc: 'Intuitive canvas with text, shapes, images & layers' },
            { icon: QrCode, title: 'Barcodes & QR', desc: 'CODE128, EAN13, QR codes with serial automation' },
            { icon: Palette, title: 'Templates', desc: 'Pre-built designs for every category and occasion' },
            { icon: FileDown, title: 'Export Anywhere', desc: 'PDF, multi-page, custom sizes & bulk generation' },
            { icon: Monitor, title: 'Presentations', desc: 'Create stunning slide decks with templates' },
            { icon: Smartphone, title: 'Social Media', desc: 'Perfect sizes for Instagram, Facebook, YouTube' },
            { icon: CreditCard, title: 'Business Cards', desc: 'Professional cards, letterheads & invoices' },
            { icon: Sparkles, title: 'AI Features', desc: 'Background removal, filters & smart suggestions' },
          ].map(f => (
            <div key={f.title} className="border border-border rounded-xl p-5 bg-card hover:border-primary/50 hover:shadow-lg transition-all group">
              <f.icon className="w-9 h-9 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Quicko. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
