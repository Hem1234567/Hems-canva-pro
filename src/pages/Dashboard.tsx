import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Home, FolderOpen, LogOut, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
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
      .select('id, name, canvas_width, canvas_height, updated_at, created_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Failed to load projects');
    setProjects(data || []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: 'Untitled Label' })
      .select('id')
      .single();
    if (error) { toast.error('Failed to create project'); return; }
    navigate(`/editor/${data.id}`);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Project deleted');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LF</span>
            </div>
            <span className="font-semibold text-foreground">LabelForge</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <SidebarBtn icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarBtn icon={FolderOpen} label="All Projects" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
          <Button onClick={createProject} className="w-full gap-2 mt-4">
            <Plus className="w-4 h-4" /> New Project
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
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'home' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-1">Pick up where you left off or start something new.</p>
            </div>

            <div className="mb-8">
              <Button onClick={createProject} variant="outline" className="gap-2 border-dashed border-2 h-32 w-full max-w-xs hover:border-primary hover:text-primary transition-colors">
                <Plus className="w-6 h-6" />
                <span className="text-base">Create New Label</span>
              </Button>
            </div>

            {recentProjects.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" /> Recent Projects
                </h2>
                <ProjectGrid projects={recentProjects} onDelete={deleteProject} />
              </>
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">All Projects</h1>
              <Button onClick={createProject} className="gap-2">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">No projects yet. Create your first label!</p>
                <Button onClick={createProject} className="gap-2">
                  <Plus className="w-4 h-4" /> Create Project
                </Button>
              </div>
            ) : (
              <ProjectGrid projects={projects} onDelete={deleteProject} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

const SidebarBtn = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
      active ? "bg-muted text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const ProjectGrid = ({ projects, onDelete }: { projects: Project[]; onDelete: (id: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {projects.map(p => (
      <div key={p.id} className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/50 transition-colors group">
        <Link to={`/editor/${p.id}`} className="block p-4">
          <div className="w-full h-28 bg-muted rounded-md mb-3 flex items-center justify-center text-muted-foreground text-xs">
            {p.canvas_width} × {p.canvas_height} mm
          </div>
          <h3 className="font-medium text-foreground truncate">{p.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Updated {format(new Date(p.updated_at), 'MMM d, yyyy')}
          </p>
        </Link>
        <div className="px-4 pb-3 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.preventDefault(); onDelete(p.id); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    ))}
  </div>
);

export default Dashboard;
