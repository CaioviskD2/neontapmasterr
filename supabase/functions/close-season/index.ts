import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { timingSafeEqual } from "https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-key",
};

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate using admin secret key
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = Deno.env.get("ADMIN_SECRET_KEY");

    if (!adminKey || !expectedKey || !safeCompare(adminKey, expectedKey)) {
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

    // Process each difficulty level separately
    const difficulties = ['easy', 'normal', 'hard', 'insane'];
    let totalPlayersUpdated = 0;
    const champions: Record<string, string> = {};

    for (const difficulty of difficulties) {
      // Get top 100 for this season + difficulty
      const { data: top100, error: fetchError } = await supabase
        .from("season_scores")
        .select("nickname, best_score, updated_at")
        .eq("season_id", seasonId)
        .eq("difficulty", difficulty)
        .order("best_score", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      if (!top100 || top100.length === 0) {
        continue; // No scores for this difficulty, skip
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
          difficulty,
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

      totalPlayersUpdated += results.length;
      if (results[0]) {
        champions[difficulty] = results[0].nickname;
      }
    }

    // Close season (even if no scores in any difficulty)
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
        players_updated: totalPlayersUpdated,
        champions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error closing season:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
