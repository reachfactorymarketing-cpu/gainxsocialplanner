import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SEED_USERS = [
  { email: "admin@gainsocial.com", password: "GainSocial2026", name: "Darren Cole", role: "admin", zone: "General" },
  { email: "jasmine@gainsocial.com", password: "password", name: "Jasmine Rivera", role: "zone_lead", zone: "Move Floor" },
  { email: "marcus@gainsocial.com", password: "password", name: "Marcus Thompson", role: "zone_lead", zone: "Reset Space" },
  { email: "tanya@gainsocial.com", password: "password", name: "Tanya Brooks", role: "volunteer", zone: "Link-Up" },
  { email: "deshawn@gainsocial.com", password: "password", name: "DeShawn Williams", role: "instructor", zone: "Move Floor" },
  { email: "vendor@gainsocial.com", password: "password", name: "Fresh Threads Rep", role: "vendor", zone: "Vendor Row" },
  { email: "reset@gainsocial.com", password: "password", name: "Reset Partner", role: "reset_space_partner", zone: "Reset Space" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: string[] = [];

    for (const u of SEED_USERS) {
      // Check if profile already exists by email
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", u.email)
        .maybeSingle();

      if (existing) {
        results.push(`${u.email}: already exists`);
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      });

      if (authError) {
        results.push(`${u.email}: auth error - ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;

      // Upsert profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          name: u.name,
          email: u.email,
          role: u.role,
          zone: u.zone,
          status: "active",
          has_seen_welcome: false,
        });

      if (profileError) {
        results.push(`${u.email}: profile error - ${profileError.message}`);
        continue;
      }

      // Insert into user_roles table
      await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role: u.role,
      });

      results.push(`${u.email}: created successfully`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
