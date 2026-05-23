import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { VideoStudio } from "@/components/VideoStudio";
import { Button } from "@/components/ui/button";
import { Upload, Languages, Music, Wand2, Zap, Globe, Sliders, Download } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart AI Video Generator — AI 视频字幕与配乐工具" },
      { name: "description", content: "上传视频，AI 自动加字幕 + 配乐。支持 20+ 语言，最高 6K 导出，完全免费。" },
      { property: "og:title", content: "Smart AI Video Generator" },
      { property: "og:description", content: "AI 自动加字幕 + 配乐，支持 20+ 语言。" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section id="home" className="relative pt-16 sm:pt-20 pb-12 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur text-xs text-muted-foreground mb-6">
            <Zap className="w-3 h-3 text-primary" />
            由 AI 驱动 · 20+ 语言 · 6K 导出
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            上传视频，AI 自动
            <br />
            加<span className="text-gradient-primary">字幕</span> + <span className="text-gradient-primary">配乐</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto px-2">
            支持 20+ 语言，自定义风格，最高 6K 导出，完全免费。
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
            className="h-14 px-8 text-base bg-gradient-primary hover:opacity-90 shadow-glow animate-pulse-glow"
          >
            <Upload className="w-5 h-5" /> 立即上传视频
          </Button>
        </div>
      </section>

      <VideoStudio />

      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">为创作者打造</h2>
        <p className="text-muted-foreground text-center mb-12">所有功能完全免费</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Languages, title: "20+ 语言", desc: "中英马、东南亚、欧洲语言一键生成。" },
            { icon: Sliders, title: "深度自定义", desc: "6 种字幕风格、8 种背景，颜色与圆角可调。" },
            { icon: Music, title: "AI 智能配乐", desc: "6 种风格 + 淡入淡出 + 音量控制。" },
            { icon: Download, title: "6K 导出", desc: "最高 6K 专业级，MP4 / MOV / WEBM。" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card shadow-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="w-4 h-4" /> Smart AI Video Generator
        </div>
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link to="/" className="hover:text-foreground">首页</Link>
          <a href="#features" className="hover:text-foreground">功能</a>
        </div>
        <p>© 2026 Smart AI Video Generator. All rights reserved.</p>
      </footer>
    </div>
  );
}
