import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Home, FolderOpen, LogOut, Trash2, Clock, Copy, Pencil, Check, X, Menu, Sparkles, Search, Presentation, Smartphone, Image, CreditCard, Tag, BadgeCheck, Globe, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { designCategories, DesignCategory } from '@/data/designCategories';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Presentation, Smartphone, Image, CreditCard, Tag, BadgeCheck, Globe, PenTool,
};

interface Project {
  id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  elements: any;
  updated_at: string;
  created_at: string;
}

type Tab = 'home' | 'projects';

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DesignCategory | null>(null);
  const [customW, setCustomW] = useState(800);
  const [customH, setCustomH] = useState(600);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?mode=login', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, canvas_width, canvas_height, elements, updated_at, created_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Failed to load projects');
    setProjects(data || []);
    setLoading(false);
  };

  const createProject = async (width: number, height: number, name?: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: name || 'Untitled Design', canvas_width: width, canvas_height: height })
      .select('id')
      .single();
    if (error) { toast.error('Failed to create project'); return; }
    navigate(`/editor/${data.id}`);
  };

  const handleCategorySelect = (cat: DesignCategory) => {
    if (cat.id === 'barcode-generator') {
      navigate('/barcode-generator');
      return;
    }
    if (cat.id === 'label') {
      navigate('/label-maker');
      return;
    }
    if (cat.id === 'custom') {
      setSelectedCategory(cat);
      return;
    }
    if (cat.presets.length > 1) {
      setSelectedCategory(cat);
    } else {
      createProject(cat.defaultWidth, cat.defaultHeight, `Untitled ${cat.label}`);
      setCreateDialogOpen(false);
    }
  };

  const handlePresetSelect = (width: number, height: number) => {
    createProject(width, height, `Untitled ${selectedCategory?.label || 'Design'}`);
    setCreateDialogOpen(false);
    setSelectedCategory(null);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Project deleted');
  };

  const duplicateProject = async (project: Project) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: `${project.name} (Copy)`,
        canvas_width: project.canvas_width,
        canvas_height: project.canvas_height,
        elements: project.elements,
      })
      .select('id, name, canvas_width, canvas_height, elements, updated_at, created_at')
      .single();
    if (error) { toast.error('Failed to duplicate'); return; }
    setProjects(prev => [data, ...prev]);
    toast.success('Project duplicated');
  };

  const renameProject = async (id: string, newName: string) => {
    const { error } = await supabase.from('projects').update({ name: newName }).eq('id', id);
    if (error) { toast.error('Failed to rename'); return; }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    toast.success('Project renamed');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const recentProjects = projects.slice(0, 6);
  const filteredProjects = searchQuery
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-card flex items-center px-4 gap-3 z-40 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-foreground text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>DesignFlow</span>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-1 brand-gradient border-0 text-white">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      {/* Sidebar overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-60 border-r border-border bg-card flex flex-col shrink-0 transition-transform duration-200",
        isMobile
          ? `fixed left-0 top-0 bottom-0 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : "relative"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>DesignFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <SidebarBtn icon={Home} label="Home" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setSidebarOpen(false); }} />
          <SidebarBtn icon={FolderOpen} label="All Projects" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSidebarOpen(false); }} />
          <Button onClick={() => { setCreateDialogOpen(true); setSidebarOpen(false); }} className="w-full gap-2 mt-4 brand-gradient border-0 text-white hover:opacity-90">
            <Plus className="w-4 h-4" /> Create Design
          </Button>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full gap-2 justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 p-4 sm:p-8 overflow-y-auto", isMobile && "pt-18")}>
        {activeTab === 'home' && (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What will you design today?</h1>
              <p className="text-muted-foreground mt-1">Pick a design type or start from scratch.</p>
            </div>

            {/* Design category cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {designCategories.filter(c => c.id !== 'custom').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(null);
                    if (cat.id === 'barcode-generator') {
                      navigate('/barcode-generator');
                    } else if (cat.id === 'label') {
                      navigate('/label-maker');
                    } else {
                      handleCategorySelect(cat);
                      setCreateDialogOpen(true);
                    }
                  }}
                  className="text-left border border-border rounded-xl p-4 sm:p-5 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  {(() => { const Icon = iconMap[cat.iconName]; return Icon ? <Icon className="w-7 h-7 sm:w-8 sm:h-8 mb-2 text-primary" /> : null; })()}
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{cat.label}</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </button>
              ))}
              <button
                onClick={() => { setSelectedCategory(designCategories.find(c => c.id === 'custom')!); setCreateDialogOpen(true); }}
                className="text-left border-2 border-dashed border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all"
              >
                <PenTool className="w-7 h-7 sm:w-8 sm:h-8 mb-2 text-muted-foreground" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Custom Size</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Any dimensions</p>
              </button>
            </div>

            {recentProjects.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" /> Recent Designs
                </h2>
                <ProjectGrid projects={recentProjects} onDelete={deleteProject} onDuplicate={duplicateProject} onRename={renameProject} />
              </>
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>All Designs</h1>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search designs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-full sm:w-64"
                  />
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 brand-gradient border-0 text-white shrink-0">
                  <Plus className="w-4 h-4" /> New
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading projects...</p>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">{searchQuery ? 'No matching designs found.' : 'No designs yet. Create your first!'}</p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 brand-gradient border-0 text-white">
                  <Plus className="w-4 h-4" /> Create Design
                </Button>
              </div>
            ) : (
              <ProjectGrid projects={filteredProjects} onDelete={deleteProject} onDuplicate={duplicateProject} onRename={renameProject} />
            )}
          </>
        )}
      </main>

      {/* Create Design Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(v) => { setCreateDialogOpen(v); if (!v) setSelectedCategory(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {selectedCategory ? selectedCategory.label : 'Create a Design'}
            </DialogTitle>
          </DialogHeader>

          {!selectedCategory ? (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {designCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="text-left border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  {(() => { const Icon = iconMap[cat.iconName]; return Icon ? <Icon className="w-6 h-6 mb-1.5 text-primary" /> : null; })()}
                  <h3 className="font-semibold text-sm">{cat.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>
          ) : selectedCategory.id === 'custom' ? (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Width (px)</label>
                  <Input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Height (px)</label>
                  <Input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <Button className="w-full brand-gradient border-0 text-white" onClick={() => handlePresetSelect(customW, customH)}>
                Create Custom Design
              </Button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-primary hover:underline mb-2"
              >
                ← All categories
              </button>
              {selectedCategory.presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => handlePresetSelect(p.width, p.height)}
                  className="w-full text-left border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p.width}×{p.height}px</span>
                  </div>
                  <div
                    className="border border-border rounded bg-muted"
                    style={{
                      width: Math.min(40, 40 * (p.width / Math.max(p.width, p.height))),
                      height: Math.min(40, 40 * (p.height / Math.max(p.width, p.height))),
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SidebarBtn = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const ProjectCard = ({ project, onDelete, onDuplicate, onRename }: { project: Project; onDelete: (id: string) => void; onDuplicate: (p: Project) => void; onRename: (id: string, name: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);

  const handleSaveRename = () => {
    if (name.trim() && name !== project.name) {
      onRename(project.id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group">
      <Link to={`/editor/${project.id}`} className="block p-4">
        <div className="w-full h-28 bg-muted rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-xs">
          {project.canvas_width} × {project.canvas_height}
        </div>
      </Link>
      <div className="px-4 pb-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveRename()} />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveRename}><Check className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setName(project.name); setEditing(false); }}><X className="w-3.5 h-3.5" /></Button>
          </div>
        ) : (
          <h3 className="font-medium text-foreground truncate">{project.name}</h3>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
        </p>
        <div className="flex justify-end gap-1 mt-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditing(true)} title="Rename">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDuplicate(project)} title="Duplicate">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(project.id)} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProjectGrid = ({ projects, onDelete, onDuplicate, onRename }: { projects: Project[]; onDelete: (id: string) => void; onDuplicate: (p: Project) => void; onRename: (id: string, name: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
    {projects.map(p => (
      <ProjectCard key={p.id} project={p} onDelete={onDelete} onDuplicate={onDuplicate} onRename={onRename} />
    ))}
  </div>
);

export default Dashboard;
