import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
  profile?: { display_name: string | null; phone: string | null } | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate("/");
        return;
      }
      fetchSubscriptions();
    }
  }, [user, isAdmin, authLoading, roleLoading]);

  const fetchSubscriptions = async () => {
    const { data: subs } = await supabase
      .from("weekly_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subs) {
      // Fetch profiles for each subscription
      const userIds = [...new Set(subs.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
      setSubscriptions(subs.map(s => ({ ...s, profile: profileMap.get(s.user_id) })));
    }
    setLoadingData(false);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = subscriptions.filter(s => new Date(s.expires_at) > new Date()).length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage subscriptions & users</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{subscriptions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <span className="text-3xl font-bold text-foreground">{activeCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <span className="text-3xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No subscriptions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const isActive = new Date(sub.expires_at) > new Date();
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.profile?.display_name || sub.user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{sub.profile?.phone || "—"}</TableCell>
                        <TableCell>KES {sub.amount}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {sub.transaction_id || "—"}
                        </TableCell>
                        <TableCell>{format(new Date(sub.starts_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(sub.expires_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-secondary text-secondary-foreground" : ""}>
                            {isActive ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
