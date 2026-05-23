import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Smart AI Video</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#home" className="hover:text-foreground transition-colors">首页</a>
          <a href="#features" className="hover:text-foreground transition-colors">功能</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">价格</a>
        </nav>
        <Button variant="default" className="bg-gradient-primary hover:opacity-90 shadow-glow">
          登录
        </Button>
      </div>
    </header>
  );
}
