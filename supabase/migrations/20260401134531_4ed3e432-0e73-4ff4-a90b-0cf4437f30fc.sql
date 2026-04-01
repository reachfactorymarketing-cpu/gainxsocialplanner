
DROP POLICY "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated inserts notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
