import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscription = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    // App is now free for all users - everyone has access
    setIsSubscribed(!!user);
    setLoading(false);
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const recordSubscription = async (_transactionId: string) => {
    // Subscription recording disabled - app is now free
    return;
  };

  return { isSubscribed, loading, checkSubscription, recordSubscription };
};
