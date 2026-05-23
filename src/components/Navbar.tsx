import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.2-11.3-7.6l-6.5 5C9.6 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export function Navbar() {
  const { user, profile, isAdmin, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="logo-fx w-9 h-9 shrink-0">
            <div className="logo-fx-inner w-full h-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight truncate">
            Smart AI Video <span className="hidden sm:inline">Generator</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">首页</Link>
          <a href="#features" className="hover:text-foreground transition-colors">功能</a>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ShieldCheck className="w-4 h-4" /> 管理
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-24 h-9 rounded-md bg-secondary animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-secondary transition-colors">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold">
                      {(profile?.full_name || profile?.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                    {profile?.full_name || profile?.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck className="w-4 h-4" />管理后台</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4" />登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signInWithGoogle} variant="outline" className="gap-2">
              <GoogleIcon /> <span className="hidden sm:inline">Google</span> 登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
