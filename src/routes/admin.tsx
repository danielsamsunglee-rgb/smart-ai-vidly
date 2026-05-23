import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth, type Profile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ShieldOff, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "管理后台 — Smart AI Video Generator" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate({ to: "/" });
    }
  }, [user, isAdmin, loading, navigate]);

  async function load() {
    setFetching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setUsers((data ?? []) as Profile[]);
    setFetching(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function toggleBan(p: Profile) {
    setBusy(p.id);
    const next = p.status === "banned" ? "active" : "banned";
    const { error } = await supabase
      .from("profiles")
      .update({ status: next })
      .eq("id", p.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success(next === "banned" ? "已封禁" : "已解封");
      setUsers((u) => u.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    }
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">管理后台</h1>
              <p className="text-xs text-muted-foreground">共 {users.length} 位用户</p>
            </div>
          </div>
          <Link to="/"><Button variant="outline">返回首页</Button></Link>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-medium">用户</th>
                  <th className="text-left p-3 font-medium">Gmail</th>
                  <th className="text-left p-3 font-medium">注册时间</th>
                  <th className="text-left p-3 font-medium">最后登录</th>
                  <th className="text-left p-3 font-medium">状态</th>
                  <th className="text-right p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">暂无用户</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold">
                            {(u.full_name || u.email)[0].toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[140px]">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(u.last_login_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="p-3">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/30">
                          <ShieldCheck className="w-3 h-3" /> 正常
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/15 text-destructive border border-destructive/30">
                          <ShieldAlert className="w-3 h-3" /> 已封禁
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant={u.status === "banned" ? "outline" : "destructive"}
                        disabled={busy === u.id || u.id === user.id}
                        onClick={() => toggleBan(u)}
                      >
                        {busy === u.id ? <Loader2 className="w-3 h-3 animate-spin" />
                          : u.status === "banned" ? <><ShieldCheck className="w-3 h-3" /> 解封</>
                          : <><ShieldOff className="w-3 h-3" /> 封禁</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
