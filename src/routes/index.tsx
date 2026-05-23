import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { VideoStudio } from "@/components/VideoStudio";
import { Button } from "@/components/ui/button";
import { Upload, Languages, Music, Wand2, Zap, Globe } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart AI Video — AI 视频字幕与配乐工具" },
      { name: "description", content: "上传视频，AI 自动加字幕 + 配乐。支持中文、英文、马来文，几秒内完成。" },
      { property: "og:title", content: "Smart AI Video — AI 视频字幕与配乐工具" },
      { property: "og:description", content: "上传视频，AI 自动加字幕 + 配乐。支持中文、英文、马来文。" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section id="home" className="relative pt-20 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur text-xs text-muted-foreground mb-6">
            <Zap className="w-3 h-3 text-primary" />
            由 AI 驱动 · 几秒生成
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            上传视频，AI 自动
            <br />
            加<span className="text-gradient-primary">字幕</span> + <span className="text-gradient-primary">配乐</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            支持中文、英文、马来文，几秒内完成。让你的视频在每个平台都更具吸引力。
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
            className="h-14 px-8 text-base bg-gradient-primary hover:opacity-90 shadow-glow animate-pulse-glow"
          >
            <Upload className="w-5 h-5" />
            立即上传视频
          </Button>
        </div>
      </section>

      <VideoStudio />

      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">为创作者打造</h2>
        <p className="text-muted-foreground text-center mb-14">三步生成专业级视频内容</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Languages, title: "多语言字幕", desc: "中文、英文、马来文，自动识别 + 翻译。" },
            { icon: Music, title: "AI 智能配乐", desc: "5 种风格随心切换，音量可自由调节。" },
            { icon: Wand2, title: "一键生成", desc: "上传即处理，几秒内拿到成品。" },
          ].map((f) => (
            <div key={f.title} className="p-8 rounded-2xl border border-border bg-card shadow-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-glow">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">简单透明的价格</h2>
        <p className="text-muted-foreground text-center mb-14">按需选择，无隐藏费用</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "免费版", price: "¥0", desc: "每月 5 个视频", cta: "免费开始", featured: false },
            { name: "专业版", price: "¥99", desc: "每月 100 个视频 · 高清导出", cta: "升级专业版", featured: true },
            { name: "企业版", price: "联系我们", desc: "无限视频 · API 接入", cta: "联系销售", featured: false },
          ].map((p) => (
            <div
              key={p.name}
              className={`p-8 rounded-2xl border bg-card shadow-card relative ${
                p.featured ? "border-primary shadow-glow" : "border-border"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-primary rounded-full text-xs font-medium text-primary-foreground">
                  推荐
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{p.name}</h3>
              <div className="text-4xl font-bold mb-2">{p.price}<span className="text-sm text-muted-foreground font-normal">/月</span></div>
              <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
              <Button
                variant={p.featured ? "default" : "outline"}
                className={`w-full ${p.featured ? "bg-gradient-primary hover:opacity-90 shadow-glow" : ""}`}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-10 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="w-4 h-4" />
          Smart AI Video
        </div>
        <p>© 2026 Smart AI Video. All rights reserved.</p>
      </footer>
    </div>
  );
}
