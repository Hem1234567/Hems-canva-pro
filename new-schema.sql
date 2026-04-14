-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. CLEANUP (To allow safe re-running)
-- ==========================================
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.template_categories CASCADE;
DROP TABLE IF EXISTS public.ai_bg_removal_logs CASCADE;
DROP TABLE IF EXISTS public.saved_qr_codes CASCADE;
DROP TABLE IF EXISTS public.saved_barcodes CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.subscription_tier CASCADE;
DROP TYPE IF EXISTS public.asset_type CASCADE;
DROP TYPE IF EXISTS public.project_visibility CASCADE;
DROP TYPE IF EXISTS public.project_category CASCADE;
DROP TYPE IF EXISTS public.qr_content_type CASCADE;
DROP TYPE IF EXISTS public.barcode_format CASCADE;

-- ==========================================
-- 1. ENUMS & CUSTOM TYPES
-- ==========================================
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE public.asset_type AS ENUM ('image', 'video', 'audio', 'font', 'bg_removed_image');
CREATE TYPE public.project_visibility AS ENUM ('private', 'team', 'public');

-- Captures all design dimensions (Presentations, Social Media, Posters, ID Cards, etc.)
CREATE TYPE public.project_category AS ENUM (
  'presentation',
  'social_media',
  'poster_flyer',
  'business_card',
  'label_sticker',
  'id_card',
  'web_banner',
  'custom'
);

-- Structured formats for Barcodes and QR Codes Tools
CREATE TYPE public.qr_content_type AS ENUM ('url', 'text', 'wifi', 'vcard', 'email', 'sms');
CREATE TYPE public.barcode_format AS ENUM ('CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF14');

-- ==========================================
-- 2. UTILITY FUNCTIONS
-- ==========================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==========================================
-- 3. CORE TABLES
-- ==========================================

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user'::user_role,
  subscription_tier subscription_tier DEFAULT 'free'::subscription_tier,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  bg_removal_quota INTEGER DEFAULT 50, -- For AI BG Remover Limits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- TEAMS
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (team_id, user_id)
);

-- FOLDERS
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CHECK ((user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL))
);

-- PROJECTS (The core design documents for ALL categories)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  category project_category DEFAULT 'custom'::project_category NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Design',
  description TEXT,
  canvas_width INTEGER NOT NULL DEFAULT 1920,
  canvas_height INTEGER NOT NULL DEFAULT 1080,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Holds canvas shapes, images, generated QRs
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,     -- "Organize Pages": Supports multi-page docs/slides
  config JSONB DEFAULT '{}'::jsonb,             -- Holds "Custom Size", Bleed settings, Print setups
  thumbnail_url TEXT,
  visibility project_visibility DEFAULT 'private'::project_visibility NOT NULL,
  is_template BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_category ON public.projects(category);

-- ASSETS (Media, uploads, and AI outcomes)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- 4. TOOL-SPECIFIC TABLES
-- ==========================================

-- SAVED BARCODES (For Barcode Generator tool: tracking configurations and sequences)
CREATE TABLE public.saved_barcodes (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  format barcode_format NOT NULL DEFAULT 'CODE128'::barcode_format,
  data_value TEXT NOT NULL,
  is_sequence BOOLEAN DEFAULT false,
  sequence_start TEXT,
  sequence_end TEXT,
  sequence_prefix TEXT,
  sequence_suffix TEXT,
  style_config JSONB DEFAULT '{}'::jsonb, -- background, foreground, scale, line_width
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- SAVED QR CODES (For Custom QR Generator with styles)
CREATE TABLE public.saved_qr_codes (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content_type qr_content_type NOT NULL DEFAULT 'url'::qr_content_type,
  content_data JSONB NOT NULL, -- e.g., {"url": "https://..."} or {"vcard": "..."}
  style_config JSONB DEFAULT '{}'::jsonb, -- colors, dot styles, center logos
  tracking_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- BG REMOVER LOGS (For AI Background Removal tool)
CREATE TABLE public.ai_bg_removal_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  result_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- 5. TEMPLATES
-- ==========================================

-- TEMPLATES CATEGORIES
CREATE TABLE public.template_categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  project_category project_category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- TEMPLATES
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- 6. TRIGGERS
-- ==========================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bg_removal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Teams: Authenticated users can create teams. Users can view/edit teams they own or belong to
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- Teams: Admin/owner and member checks
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "Users can view teams they belong to" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id OR id IN (SELECT public.get_user_team_ids())
);
CREATE POLICY "Owners can update own teams" ON public.teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own teams" ON public.teams FOR DELETE USING (auth.uid() = owner_id);

-- Team Members
CREATE POLICY "View team members" ON public.team_members FOR SELECT USING (
  user_id = auth.uid() OR 
  team_id IN (SELECT public.get_user_team_ids()) OR 
  team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);
CREATE POLICY "Manage team members" ON public.team_members FOR ALL USING (
  team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);

-- Folders
CREATE POLICY "Manage personal folders" ON public.folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage team folders" ON public.folders FOR ALL USING (
  team_id IN (SELECT public.get_user_team_ids()) OR
  team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);

-- Projects
CREATE POLICY "Manage personal projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View team projects" ON public.projects FOR SELECT USING (
  visibility = 'team' AND (team_id IN (SELECT public.get_user_team_ids()) OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()))
);
CREATE POLICY "Edit team projects" ON public.projects FOR UPDATE USING (
  visibility = 'team' AND (team_id IN (SELECT public.get_user_team_ids()) OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()))
);
CREATE POLICY "View public projects" ON public.projects FOR SELECT USING (visibility = 'public');

-- Tool Policy (Assets & Logs)
CREATE POLICY "Manage personal barcodes" ON public.saved_barcodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage personal QR codes" ON public.saved_qr_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage personal AI logs" ON public.ai_bg_removal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage personal assets" ON public.assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View team assets" ON public.assets FOR SELECT USING (
  team_id IN (SELECT public.get_user_team_ids()) OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);

-- Public Tables (Templates)
CREATE POLICY "Anyone can view template categories" ON public.template_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view templates" ON public.templates FOR SELECT USING (true);

-- ==========================================
-- 8. STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads', 
  'user-uploads', 
  true, 
  10485760, 
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Safely drop existing policies before re-creating
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

CREATE POLICY "Users can upload images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for uploads" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================
-- 9. INITIAL DATA SEEDING (Design Categories)
-- ==========================================
INSERT INTO public.template_categories (name, slug, project_category, description) VALUES
('Presentation', 'presentation', 'presentation', 'Slides & pitch decks'),
('Social Media', 'social-media', 'social_media', 'Posts, stories & thumbnails'),
('Poster & Flyer', 'poster-flyer', 'poster_flyer', 'Posters, flyers & brochures'),
('Business Card', 'business-card', 'business_card', 'Cards & letterheads'),
('Labels & Stickers', 'labels-stickers', 'label_sticker', 'Labels, barcodes & stickers'),
('ID Cards', 'id-cards', 'id_card', 'Employee, student & visitor badges'),
('Web & Banner', 'web-banner', 'web_banner', 'Website banners & ads')
ON CONFLICT (slug) DO NOTHING;
