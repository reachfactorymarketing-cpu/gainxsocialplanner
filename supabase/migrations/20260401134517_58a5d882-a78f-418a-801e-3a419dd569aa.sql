
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'zone_lead', 'volunteer', 'instructor', 'vendor', 'reset_space_partner');
CREATE TYPE public.task_status AS ENUM ('To Do', 'In Progress', 'Needs Review', 'Done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.schedule_phase AS ENUM ('setup', 'event', 'breakdown');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'volunteer',
  zone TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  has_seen_welcome BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (for RLS)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  zone TEXT NOT NULL DEFAULT 'General',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'To Do',
  due_date DATE,
  priority task_priority NOT NULL DEFAULT 'medium',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task checklist items
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);

-- Task comments
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedule slots
CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time TEXT NOT NULL,
  end_time TEXT,
  activity TEXT NOT NULL,
  location TEXT DEFAULT '',
  zone TEXT NOT NULL DEFAULT 'General',
  roles TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  phase schedule_phase NOT NULL DEFAULT 'event',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT '#all-hands',
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brainstorm notes
CREATE TABLE public.brainstorm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL DEFAULT 'General',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#FDE68A',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booth_location TEXT DEFAULT '',
  freebie_status TEXT DEFAULT 'pending',
  raffle_status TEXT DEFAULT 'pending',
  load_in_time TEXT DEFAULT '',
  agreement_status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcement reads
CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'General',
  type TEXT NOT NULL DEFAULT 'richtext',
  content TEXT DEFAULT '',
  permissions_level TEXT NOT NULL DEFAULT 'all',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document comments
CREATE TABLE public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document versions
CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  screen TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Revenue
CREATE TABLE public.revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_sales NUMERIC NOT NULL DEFAULT 0,
  raffle_income NUMERIC NOT NULL DEFAULT 0,
  fifty_fifty_income NUMERIC NOT NULL DEFAULT 0,
  donations NUMERIC NOT NULL DEFAULT 0,
  sponsor_income NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Transfer log
CREATE TABLE public.transfer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role app_role NOT NULL,
  tasks_transferred TEXT[] DEFAULT '{}',
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- Security definer to get user zone
CREATE OR REPLACE FUNCTION public.get_user_zone(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT zone FROM public.profiles WHERE id = _user_id
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_slots_updated_at BEFORE UPDATE ON public.schedule_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revenue_updated_at BEFORE UPDATE ON public.revenue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- PROFILES
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

-- USER ROLES
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- TASKS
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Admin manages tasks" ON public.tasks FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Zone lead manages zone tasks" ON public.tasks FOR ALL USING (
  public.get_user_role(auth.uid()) = 'zone_lead' AND zone = public.get_user_zone(auth.uid())
);
CREATE POLICY "Assignee can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = assignee_id);

-- TASK CHECKLIST
CREATE POLICY "Anyone can view checklist" ON public.task_checklist_items FOR SELECT USING (true);
CREATE POLICY "Authenticated manage checklist" ON public.task_checklist_items FOR ALL USING (auth.uid() IS NOT NULL);

-- TASK COMMENTS
CREATE POLICY "Anyone can view comments" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated add comments" ON public.task_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SCHEDULE
CREATE POLICY "Anyone can view schedule" ON public.schedule_slots FOR SELECT USING (true);
CREATE POLICY "Admin manages schedule" ON public.schedule_slots FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- MESSAGES
CREATE POLICY "Authenticated view messages" ON public.messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- BRAINSTORM
CREATE POLICY "Authenticated view notes" ON public.brainstorm_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated manage notes" ON public.brainstorm_notes FOR ALL USING (auth.uid() IS NOT NULL);

-- VENDORS
CREATE POLICY "Anyone can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Admin manages vendors" ON public.vendors FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Vendor updates own record" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);

-- ANNOUNCEMENTS
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admin manages announcements" ON public.announcements FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- ANNOUNCEMENT READS
CREATE POLICY "Users manage own reads" ON public.announcement_reads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin views all reads" ON public.announcement_reads FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- DOCUMENTS
CREATE POLICY "Public docs viewable by all" ON public.documents FOR SELECT USING (permissions_level = 'all' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages documents" ON public.documents FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated insert documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- DOCUMENT COMMENTS
CREATE POLICY "Authenticated view doc comments" ON public.document_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated add doc comments" ON public.document_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- DOCUMENT VERSIONS
CREATE POLICY "Authenticated view versions" ON public.document_versions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin insert versions" ON public.document_versions FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- NOTIFICATIONS
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- REVENUE
CREATE POLICY "Admin manages revenue" ON public.revenue FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated view revenue" ON public.revenue FOR SELECT USING (auth.uid() IS NOT NULL);

-- TRANSFER LOG
CREATE POLICY "Admin manages transfers" ON public.transfer_log FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
