import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEED_USERS = [
  { email: "demo@gainxsocial.com", password: "Demo-GainXS26", name: "Demo Admin", role: "admin", zone: "General" },
  { email: "admin@gainxsocial.com", password: "Demo-GainXS26", name: "Darren Cole", role: "admin", zone: "General" },
  { email: "lead@gainxsocial.com", password: "Demo-GainXS26", name: "Jasmine Rivera", role: "zone_lead", zone: "Move Floor" },
  { email: "volunteer@gainxsocial.com", password: "Demo-GainXS26", name: "Tanya Brooks", role: "volunteer", zone: "Link-Up" },
  { email: "vendor@gainxsocial.com", password: "Demo-GainXS26", name: "Fresh Threads Rep", role: "vendor", zone: "Vendor Row" },
  { email: "instructor@gainxsocial.com", password: "Demo-GainXS26", name: "Marcus Thompson", role: "instructor", zone: "Move Floor" },
  { email: "reset@gainxsocial.com", password: "Demo-GainXS26", name: "Reset Partner", role: "reset_space_partner", zone: "Reset Space" },
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
      // Check if auth user exists by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuth = existingUsers?.users?.find(usr => usr.email === u.email);

      if (existingAuth) {
        // Update password to match new credentials
        await supabaseAdmin.auth.admin.updateUserById(existingAuth.id, {
          password: u.password,
          email_confirm: true,
        });
        // Upsert profile
        await supabaseAdmin.from("profiles").upsert({
          id: existingAuth.id,
          name: u.name,
          email: u.email,
          role: u.role,
          zone: u.zone,
          status: "active",
        });
        await supabaseAdmin.from("user_roles").upsert({
          user_id: existingAuth.id,
          role: u.role,
        });
        results.push(`${u.email}: updated`);
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

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        name: u.name,
        email: u.email,
        role: u.role,
        zone: u.zone,
        status: "active",
        has_seen_welcome: false,
      });

      await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role: u.role,
      });

      results.push(`${u.email}: created`);
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
