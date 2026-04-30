import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const templateCategories = [
  { id: 'attorney', label: 'Attorney ID Cards' },
  { id: 'church', label: 'Church Badges' },
  { id: 'doctor', label: 'Doctor ID Cards' },
  { id: 'employee', label: 'Employee Badges' },
  { id: 'firefighter', label: 'Firefighter ID Cards' },
  { id: 'law_enforcement', label: 'Law Enforcement Badges' },
  { id: 'medical', label: 'Medical ID Cards' },
  { id: 'novelty', label: 'Novelty ID Cards' },
  { id: 'press', label: 'Press Pass' },
  { id: 'school', label: 'School ID Cards' },
  { id: 'service_dog', label: 'Service Dog ID Cards' },
];

const templates = [
  { 
    id: 'student-id-bg', 
    name: 'Professional Student ID Badge', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/s/t/student-id-badge.jpg' 
  },
  { 
    id: 'student-id-maker', 
    name: 'Student ID Card #9', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/s/t/student-id-maker.jpg' 
  },
  { 
    id: 'student-id-13', 
    name: 'Student ID Card Horizontal #13', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/s/t/student-id-card-template.jpg' 
  },
  { 
    id: 'student-id-6', 
    name: 'Student ID Card #6', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/s/t/student-id-card.jpg' 
  },
  { 
    id: 'teacher-id', 
    name: 'Teacher ID Card', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/t/e/teacher-id-card.jpg' 
  },
  { 
    id: 'homeschool-bg', 
    name: 'Homeschool Student ID Badge', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/h/o/homeschool-student-id-badge.jpg' 
  },
  { 
    id: 'sunday-school', 
    name: 'Sunday School Student ID Card', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/s/c/school-student-id-card.jpg' 
  },
  { 
    id: 'high-school-teacher', 
    name: 'High School Teacher ID Card', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/t/e/teacher-id-card-template.jpg' 
  },
  { 
    id: 'daycare-employee', 
    name: 'Daycare Employee ID Card', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/d/a/daycare-employee-id-card.jpg' 
  },
  { 
    id: 'daycare-badge', 
    name: 'Daycare 1', 
    src: 'https://cdn.idcreator.com/media/storage/catalog/product/cache/4eede600b492289d9edbc027713f668f/d/a/daycare-id-badge.jpg' 
  },
];

const IdMakerPage = () => {
  const [activeTab, setActiveTab] = useState('get-started');
  const [categoriesExpanded, setCategoriesExpanded] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTemplateSelect = (templateId: string | null) => {
    setSelectedTemplate(templateId);
  };

  const handleTemplateDoubleClick = async (templateId: string | null) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    // Default ID card dimensions for CR80
    const width = 324;
    const height = 204;
    
    // Create new project and navigate
    const { data, error } = await supabase
      .from('projects')
      .insert({ 
        user_id: user.id, 
        name: templateId ? `Template ${templateId}` : 'Blank ID Card', 
        canvas_width: width, 
        canvas_height: height 
      })
      .select('id')
      .single();
      
    if (error) { 
      toast.error('Failed to create project'); 
      return; 
    }
    navigate(`/editor/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#4caf50] text-white flex items-center px-4 md:px-8 h-14 shrink-0 shadow-md relative z-20">
        <div className="flex md:hidden mr-4">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 font-bold mr-6 md:mr-10 hover:text-white/80 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1 h-full">
          {[
            { id: 'get-started', label: 'Get Started' },
            { id: 'card-designer', label: 'Card Designer' },
            { id: 'my-designs', label: 'My Designs' },
            { id: 'my-members', label: 'My Members' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-full px-4 text-sm font-semibold transition hover:bg-white/10",
                activeTab === tab.id ? "bg-[#388e3c] border-b-4 border-white" : ""
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#388e3c] text-white shadow-lg absolute top-14 left-0 w-full z-10 flex flex-col">
          {[
            { id: 'get-started', label: 'Get Started' },
            { id: 'card-designer', label: 'Card Designer' },
            { id: 'my-designs', label: 'My Designs' },
            { id: 'my-members', label: 'My Members' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
              className={cn(
                "py-3 px-4 text-left font-medium border-b border-white/10",
                activeTab === tab.id ? "bg-[#2e7a31]" : ""
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar - Categories */}
        <div className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
          >
            <h2 className="font-bold text-gray-800 text-sm">Template Categories</h2>
            {categoriesExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>

          {categoriesExpanded && (
            <ul className="py-2">
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-full text-left px-5 py-2 text-sm transition",
                    selectedCategory === null ? "text-[#4caf50] font-semibold bg-[#4caf50]/10" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  All
                </button>
              </li>
              {templateCategories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full text-left px-5 py-2 text-sm transition",
                      selectedCategory === cat.id ? "text-[#4caf50] font-semibold bg-[#4caf50]/10" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Templates Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Select a Design</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              
              {/* Blank Canvas Default */}
              <div 
                className={cn(
                  "aspect-[3/4] bg-white rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-4 hover:shadow-lg relative",
                  selectedTemplate === null 
                    ? "border-[#4caf50] ring-4 ring-[#4caf50]/20" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleTemplateSelect(null)}
                onDoubleClick={() => handleTemplateDoubleClick(null)}
              >
                {selectedTemplate === null && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#4caf50] rounded-full flex items-center justify-center z-10">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="w-16 h-16 mb-4 opacity-50">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gray-400" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-600 text-center text-sm">Blank Canvas</span>
                <span className="text-xs text-gray-400 mt-2">Double click to use</span>
              </div>

              {/* Template Items */}
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={cn(
                    "aspect-[3/4] bg-white rounded-xl border-2 cursor-pointer transition-all overflow-hidden hover:shadow-lg relative group",
                    selectedTemplate === template.id 
                      ? "border-[#4caf50] ring-4 ring-[#4caf50]/20" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleTemplateSelect(template.id)}
                  onDoubleClick={() => handleTemplateDoubleClick(template.id)}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#4caf50] rounded-full flex items-center justify-center z-10 shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 p-3 pt-6 pointer-events-none">
                    <img 
                      src={template.src} 
                      alt={template.name} 
                      className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{template.name}</p>
                    <p className="text-white/80 text-[10px] mt-0.5 pointer-events-none">Double click to use</p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdMakerPage;
