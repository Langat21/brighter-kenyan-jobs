import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
    };
    fetch();
  }, [user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    return publicUrl;
  };

  return { profile, uploadAvatar };
};
