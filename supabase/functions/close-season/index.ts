import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate using admin secret key
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = Deno.env.get("ADMIN_SECRET_KEY");

    if (!adminKey || adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Determine previous month
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const seasonId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    // Check if season exists and is still open
    const { data: season } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", seasonId)
      .maybeSingle();

    if (!season) {
      return new Response(
        JSON.stringify({ message: `No season found for ${seasonId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (season.status === "closed") {
      return new Response(
        JSON.stringify({ message: `Season ${seasonId} already closed` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get top 100 for this season
    const { data: top100, error: fetchError } = await supabase
      .from("season_scores")
      .select("nickname, best_score, updated_at")
      .eq("season_id", seasonId)
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(100);

    if (fetchError) throw fetchError;

    if (!top100 || top100.length === 0) {
      // Close empty season
      await supabase
        .from("seasons")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", seasonId);

      return new Response(
        JSON.stringify({ message: `Season ${seasonId} closed (no scores)` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Freeze snapshot in season_results
    const results = top100.map((entry, i) => {
      const rank = i + 1;
      let medal: string | null = null;
      if (rank <= 10) medal = "gold";
      else if (rank <= 50) medal = "silver";
      else medal = "bronze";

      return {
        season_id: seasonId,
        rank,
        nickname: entry.nickname,
        score: entry.best_score,
        medal,
      };
    });

    const { error: insertError } = await supabase
      .from("season_results")
      .insert(results);
    if (insertError) throw insertError;

    // Distribute medals to players
    for (const result of results) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (result.medal === "gold") {
        updates.gold_count = supabase.rpc ? undefined : undefined; // We'll use raw SQL increment
      }

      // Use individual updates with increment logic
      const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("nickname", result.nickname)
        .maybeSingle();

      if (player) {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (result.medal === "gold") updateData.gold_count = player.gold_count + 1;
        if (result.medal === "silver") updateData.silver_count = player.silver_count + 1;
        if (result.medal === "bronze") updateData.bronze_count = player.bronze_count + 1;

        if (result.rank === 1) {
          updateData.monthly_champion_count = player.monthly_champion_count + 1;
        }
        if (result.rank <= 10) {
          updateData.top10_entry_count = player.top10_entry_count + 1;
        }

        if (!player.best_monthly_rank || result.rank < player.best_monthly_rank) {
          updateData.best_monthly_rank = result.rank;
        }

        await supabase
          .from("players")
          .update(updateData)
          .eq("nickname", result.nickname);
      } else {
        // Create player with initial medals
        const newPlayer: Record<string, unknown> = {
          nickname: result.nickname,
          gold_count: result.medal === "gold" ? 1 : 0,
          silver_count: result.medal === "silver" ? 1 : 0,
          bronze_count: result.medal === "bronze" ? 1 : 0,
          monthly_champion_count: result.rank === 1 ? 1 : 0,
          top10_entry_count: result.rank <= 10 ? 1 : 0,
          best_monthly_rank: result.rank,
        };

        await supabase.from("players").insert(newPlayer);
      }
    }

    // Close season
    await supabase
      .from("seasons")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", seasonId);

    // Ensure current season exists
    const currentSeasonId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await supabase
      .from("seasons")
      .insert({ id: currentSeasonId, status: "open" })
      .select()
      .maybeSingle();

    return new Response(
      JSON.stringify({
        message: `Season ${seasonId} closed successfully`,
        players_updated: results.length,
        champion: results[0]?.nickname,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error closing season:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
