import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_VIEWS_PER_WEEK = 1;

export const useWeeklyFreeView = () => {
  const { user } = useAuth();
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const weekStart = new Date(Date.now() - WEEK_MS).toISOString();

  const fetchViewCount = useCallback(async () => {
    if (!user) {
      setViewCount(0);
      setLoading(false);
      return;
    }
    const { count } = await supabase
      .from("job_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("viewed_at", weekStart);

    setViewCount(count ?? 0);
    setLoading(false);
  }, [user, weekStart]);

  useEffect(() => {
    fetchViewCount();
  }, [fetchViewCount]);

  const canViewFree = viewCount < FREE_VIEWS_PER_WEEK;

  const recordView = async (jobIdentifier: string) => {
    if (!user) return false;

    // Check if already viewed this specific job (don't double-count)
    const { count, error: existingViewError } = await supabase
      .from("job_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("job_identifier", jobIdentifier)
      .gte("viewed_at", weekStart);

    if (existingViewError) {
      console.error("Failed to check existing free job view", existingViewError);
      return false;
    }

    if ((count ?? 0) > 0) return true;

    const { error } = await supabase.from("job_views").insert({
      user_id: user.id,
      job_identifier: jobIdentifier,
    });

    if (error) {
      console.error("Failed to record free job view", error);
      return false;
    }

    setViewCount((c) => c + 1);
    return true;
  };

  const hasViewedJob = async (jobIdentifier: string) => {
    if (!user) return false;
    const { count, error } = await supabase
      .from("job_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("job_identifier", jobIdentifier)
      .gte("viewed_at", weekStart);

    if (error) {
      console.error("Failed to check viewed job state", error);
      return false;
    }

    return (count ?? 0) > 0;
  };

  return { canViewFree, viewCount, loading, recordView, hasViewedJob };
};
