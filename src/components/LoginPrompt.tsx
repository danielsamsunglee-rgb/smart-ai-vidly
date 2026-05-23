import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export function LoginPrompt({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { signInWithGoogle } = useAuth();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">请先用 Google 账号登录</DialogTitle>
          <DialogDescription className="text-center">
            登录后即可上传视频、自动生成多语言字幕并合成配乐 — 完全免费。
          </DialogDescription>
        </DialogHeader>
        <Button
          onClick={async () => { await signInWithGoogle(); onOpenChange(false); }}
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          使用 Google 一键登录
        </Button>
      </DialogContent>
    </Dialog>
  );
}
