import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function BannedOverlay() {
  const { signOut, profile } = useAuth();
  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 border border-destructive/40 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-3">您的账号已被停用</h1>
        <p className="text-muted-foreground mb-2">请联系管理员处理。</p>
        <p className="text-xs text-muted-foreground mb-8">{profile?.email}</p>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" /> 登出
        </Button>
      </div>
    </div>
  );
}
