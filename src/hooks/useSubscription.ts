import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscription = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("weekly_subscriptions")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1);

    setIsSubscribed(!!(data && data.length > 0));
    setLoading(false);
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const recordSubscription = async (transactionId: string) => {
    if (!user) return;
    await supabase.from("weekly_subscriptions").insert({
      user_id: user.id,
      transaction_id: transactionId,
      amount: 49,
    });
    await checkSubscription();
  };

  return { isSubscribed, loading, checkSubscription, recordSubscription };
};
