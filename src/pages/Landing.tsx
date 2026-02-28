import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Layers, QrCode, FileDown, Zap } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LF</span>
            </div>
            <span className="font-semibold text-foreground text-lg">LabelForge</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button className="gap-2">Dashboard <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="gap-2">Sign up <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          Professional Label Design Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
          Design Labels.<br />
          <span className="text-primary">Generate Serials.</span><br />
          Export Anywhere.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Create barcodes, QR codes, and sticker labels with a powerful visual editor. 
          Bulk generate with serial numbers and export high-quality PDFs.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to={user ? '/dashboard' : '/auth?mode=signup'}>
            <Button size="lg" className="gap-2 text-base px-8">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Layers, title: 'Visual Editor', desc: 'Drag-and-drop canvas with text, shapes, and images' },
            { icon: QrCode, title: 'Barcodes & QR', desc: 'Real CODE128, EAN13, QR codes rendered on canvas' },
            { icon: Zap, title: 'Serial Numbers', desc: 'Bulk generate with prefix, padding, and CSV import' },
            { icon: FileDown, title: 'PDF Export', desc: 'A4/A5/Custom sticker layouts with configurable grids' },
          ].map(f => (
            <div key={f.title} className="border border-border rounded-xl p-6 bg-card hover:border-primary/50 transition-colors">
              <f.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LabelForge. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
