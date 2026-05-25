import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileVideo, Sparkles, Download, Loader2, Check, X,
  RefreshCw, Share2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { LoginPrompt } from "@/components/LoginPrompt";
import { cn } from "@/lib/utils";
import { generateSubtitles, type SubtitleCue } from "@/lib/subtitles.functions";

type Stage = "idle" | "uploading" | "configure" | "processing" | "done";

const MAX_AI_BYTES = 18 * 1024 * 1024; // ~18MB raw → ~24MB base64

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function secondsToSrtTime(s: number) {
  const ms = Math.floor((s % 1) * 1000);
  const total = Math.floor(s);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss},${String(ms).padStart(3, "0")}`;
}

function buildSrt(cues: SubtitleCue[], lang: string) {
  return cues
    .map((c, i) => {
      const text = lang === "__source__" ? c.source : (c.translations?.[lang] ?? c.source);
      return `${i + 1}\n${secondsToSrtTime(c.start)} --> ${secondsToSrtTime(c.end)}\n${text}\n`;
    })
    .join("\n");
}

// ===== Data =====
const LANG_GROUPS = [
  {
    name: "东南亚",
    langs: [
      { id: "ms", flag: "🇲🇾", name: "Bahasa Malaysia" },
      { id: "zh-CN", flag: "🇨🇳", name: "中文简体" },
      { id: "zh-TW", flag: "🇹🇼", name: "中文繁體" },
      { id: "en", flag: "🇬🇧", name: "English" },
      { id: "th", flag: "🇹🇭", name: "ภาษาไทย" },
      { id: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
      { id: "id", flag: "🇮🇩", name: "Bahasa Indonesia" },
      { id: "fil", flag: "🇵🇭", name: "Filipino" },
      { id: "my", flag: "🇲🇲", name: "မြန်မာဘာသာ" },
      { id: "km", flag: "🇰🇭", name: "ភាសាខ្មែរ" },
    ],
  },
  {
    name: "东亚",
    langs: [
      { id: "ja", flag: "🇯🇵", name: "日本語" },
      { id: "ko", flag: "🇰🇷", name: "한국어" },
    ],
  },
  {
    name: "南亚",
    langs: [
      { id: "hi", flag: "🇮🇳", name: "हिन्दी" },
      { id: "ta", flag: "🇮🇳", name: "தமிழ்" },
      { id: "bn", flag: "🇧🇩", name: "বাংলা" },
    ],
  },
  {
    name: "欧洲 / 其他",
    langs: [
      { id: "fr", flag: "🇫🇷", name: "Français" },
      { id: "de", flag: "🇩🇪", name: "Deutsch" },
      { id: "es", flag: "🇪🇸", name: "Español" },
      { id: "pt", flag: "🇵🇹", name: "Português" },
      { id: "ru", flag: "🇷🇺", name: "Русский" },
      { id: "ar", flag: "🇸🇦", name: "العربية" },
    ],
  },
];
const ALL_LANG_IDS = LANG_GROUPS.flatMap((g) => g.langs.map((l) => l.id));

type SubtitleStyleId = "classic" | "neon" | "cinema" | "bold" | "gradient" | "karaoke";
const SUBTITLE_STYLES: { id: SubtitleStyleId; name: string; tag: string; preview: string; previewClass: string }[] = [
  { id: "classic", name: "经典白字", tag: "适合所有视频", preview: "字幕预览 Subtitle",
    previewClass: "text-white bg-black/80 px-3 py-1 rounded" },
  { id: "neon", name: "发光霓虹", tag: "游戏 / 音乐", preview: "字幕预览 Subtitle",
    previewClass: "text-cyan-300 font-bold px-3 py-1 [text-shadow:_0_0_8px_oklch(0.8_0.2_240),_0_0_16px_oklch(0.65_0.25_290)]" },
  { id: "cinema", name: "电影感", tag: "电影 / 纪录片", preview: "字幕预览 Subtitle",
    previewClass: "text-stone-100 font-light tracking-wide px-3 py-1" },
  { id: "bold", name: "粗体冲击", tag: "TikTok / Shorts", preview: "字幕预览 SUBTITLE",
    previewClass: "text-black font-black px-3 py-1 [text-shadow:_-2px_-2px_0_#fff,_2px_-2px_0_#fff,_-2px_2px_0_#fff,_2px_2px_0_#fff]" },
  { id: "gradient", name: "渐变彩色", tag: "Vlog / 社交", preview: "字幕预览 Subtitle",
    previewClass: "font-bold px-3 py-1 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-500" },
  { id: "karaoke", name: "卡拉 OK", tag: "歌词 / MV", preview: "字幕预览 Subtitle",
    previewClass: "font-bold px-3 py-1 [background:linear-gradient(90deg,oklch(0.85_0.15_85)_45%,#fff_45%)] bg-clip-text text-transparent" },
];

type BgStyleId = "none" | "translucent" | "capsule" | "frosted" | "solid" | "gradient" | "stroke" | "highlight";
const BG_STYLES: { id: BgStyleId; name: string; cls: string }[] = [
  { id: "none", name: "无背景", cls: "" },
  { id: "translucent", name: "半透明黑底", cls: "bg-black/60 w-full text-center py-1" },
  { id: "capsule", name: "胶囊黑底", cls: "bg-black/80 rounded-full px-4 py-1" },
  { id: "frosted", name: "模糊磨砂", cls: "bg-white/15 backdrop-blur-md rounded-lg px-3 py-1" },
  { id: "solid", name: "纯色实底", cls: "bg-purple-600 rounded px-3 py-1" },
  { id: "gradient", name: "渐变底", cls: "bg-gradient-to-t from-black/90 to-transparent w-full text-center py-2" },
  { id: "stroke", name: "描边阴影", cls: "[text-shadow:_-2px_0_#000,_2px_0_#000,_0_-2px_#000,_0_2px_#000,_0_4px_8px_rgba(0,0,0,0.8)] px-3" },
  { id: "highlight", name: "荧光高亮", cls: "bg-yellow-300 text-black rounded px-3 py-1" },
];

type MusicStyleId = "easy" | "happy" | "inspire" | "calm" | "rock" | "classical" | "none";
const MUSIC_STYLES: { id: MusicStyleId; name: string; icon: string }[] = [
  { id: "easy", name: "轻松", icon: "🎵" },
  { id: "happy", name: "欢快", icon: "🎉" },
  { id: "inspire", name: "励志", icon: "💪" },
  { id: "calm", name: "平静", icon: "🌊" },
  { id: "rock", name: "摇滚", icon: "🎸" },
  { id: "classical", name: "古典", icon: "🎹" },
  { id: "none", name: "无配乐", icon: "🚫" },
];

const RESOLUTIONS = [
  { id: "240p", name: "240P", desc: "省流量 ≈10MB", badge: null },
  { id: "480p", name: "480P", desc: "标清 ≈30MB", badge: null },
  { id: "720p", name: "720P", desc: "高清 ≈50MB", badge: null },
  { id: "1080p", name: "1080P", desc: "全高清 ≈120MB", badge: { text: "推荐", color: "bg-green-600" } },
  { id: "2k", name: "2K", desc: "超清 ≈250MB", badge: null },
  { id: "4k", name: "4K", desc: "超高清 ≈480MB", badge: { text: "热门", color: "bg-purple-600" } },
  { id: "6k", name: "6K", desc: "专业级 ≈900MB", badge: { text: "专业", color: "bg-gradient-to-r from-yellow-500 to-amber-500" } },
];
const FORMATS = ["MP4", "MOV", "WEBM"];
const FPS_OPTS = [
  { id: "24", name: "24fps", desc: "电影感" },
  { id: "30", name: "30fps", desc: "标准" },
  { id: "60", name: "60fps", desc: "流畅" },
  { id: "120", name: "120fps", desc: "超流畅" },
];

const PROCESS_STEPS = ["正在识别语音…", "正在生成字幕…", "正在合成配乐…", "正在合成视频…"];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function VideoStudio() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [processStep, setProcessStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // settings
  const [langs, setLangs] = useState<string[]>(["ms", "zh-CN", "zh-TW"]);
  const [subStyle, setSubStyle] = useState<SubtitleStyleId>("classic");
  const [bgStyle, setBgStyle] = useState<BgStyleId>("translucent");
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState([70]);
  const [bgRadius, setBgRadius] = useState([8]);
  const [bgWidth, setBgWidth] = useState<"full" | "fit" | "custom">("fit");
  const [bgPadding, setBgPadding] = useState([8]);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [position, setPosition] = useState<"top" | "middle" | "bottom">("bottom");
  const [strokeWidth, setStrokeWidth] = useState([1]);
  const [music, setMusic] = useState<MusicStyleId>("easy");
  const [volume, setVolume] = useState([40]);
  const [fade, setFade] = useState(true);
  const [resolution, setResolution] = useState("1080p");
  const [format, setFormat] = useState("MP4");
  const [fps, setFps] = useState("30");

  function requireAuth(action: () => void) {
    if (!user) { setLoginOpen(true); return; }
    action();
  }

  function handleFile(f: File) {
    requireAuth(() => {
      // Replace any prior object URL so the preview always reflects the new file.
      setVideoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
      const url = URL.createObjectURL(f);
      setVideoUrl(url);
      setFile(f);
      setStage("uploading");
      setProgress(0);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const s = Math.floor(v.duration);
        const m = Math.floor(s / 60), ss = s % 60;
        setDuration(`${m}:${String(ss).padStart(2, "0")}`);
      };
      v.src = url;
      const iv = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(iv); setStage("configure"); return 100; }
          return p + 7;
        });
      }, 100);
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function toggleLang(id: string) {
    setLangs((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  function startProcessing() {
    setStage("processing");
    setProgress(0); setProcessStep(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = p + 3;
        setProcessStep(Math.min(PROCESS_STEPS.length - 1, Math.floor(next / 25)));
        if (next >= 100) { clearInterval(iv); setStage("done"); return 100; }
        return next;
      });
    }, 120);
  }

  function reset() {
    setVideoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
    setStage("idle"); setProgress(0); setFile(null); setDuration("");
  }

  function downloadVideo() {
    if (!file || !videoUrl) return;
    const ext = format.toLowerCase();
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${base}_subtitled_${resolution}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function shareVideo(platform: "TikTok" | "YouTube" | "Instagram") {
    if (!file) return;
    try {
      const navAny = navigator as unknown as {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: { files: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (navAny.canShare && navAny.share && navAny.canShare({ files: [file] })) {
        await navAny.share({ files: [file], title: "Smart AI Video", text: `分享到 ${platform}` });
        return;
      }
    } catch { /* fall through */ }
    const urls: Record<string, string> = {
      TikTok: "https://www.tiktok.com/upload",
      YouTube: "https://studio.youtube.com/channel/upload",
      Instagram: "https://www.instagram.com/",
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  }

  // ===== Subtitle live preview helpers =====
  const fontSizeCls = { sm: "text-xs", md: "text-sm", lg: "text-base", xl: "text-lg" }[fontSize];
  const styleObj = SUBTITLE_STYLES.find((s) => s.id === subStyle)!;
  const bgObj = BG_STYLES.find((b) => b.id === bgStyle)!;

  const livePreviewBg =
    bgStyle === "solid"
      ? { backgroundColor: bgColor, opacity: bgOpacity[0] / 100, borderRadius: `${bgRadius[0]}px`, padding: `${bgPadding[0]}px` }
      : undefined;

  return (
    <>
      <LoginPrompt open={loginOpen} onOpenChange={setLoginOpen} />

      <section id="upload" className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {stage === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => requireAuth(() => fileRef.current?.click())}
            className={cn(
              "relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-10 sm:p-16 text-center bg-card/50 backdrop-blur",
              dragOver ? "border-primary bg-accent/30 scale-[1.01]" : "border-border hover:border-primary/60",
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".mp4,.mov,.avi,.webm,video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 shadow-glow">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">拖拽视频到这里，或点击上传</h3>
            <p className="text-sm text-muted-foreground">支持 MP4、MOV、AVI、WEBM · 最大 2GB</p>
            {!user && <p className="text-xs text-primary mt-3">点击需先登录 Google 账号</p>}
          </div>
        )}

        {stage === "uploading" && file && (
          <div className="rounded-2xl border border-border bg-card p-8 animate-fade-in shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <FileVideo className="w-5 h-5 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(file.size)}{duration && ` · ${duration}`}</div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-3">上传中… {progress}%</p>
          </div>
        )}

        {stage === "configure" && file && (
          <div className="space-y-6 animate-fade-in">
            {/* File info */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-3 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}{duration && ` · 时长 ${duration}`}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
            </div>

            {/* === LANGUAGES === */}
            <Card title="字幕语言" hint={`已选 ${langs.length} 种`} action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setLangs(ALL_LANG_IDS)}>全选</Button>
                <Button size="sm" variant="outline" onClick={() => setLangs([])}>清除</Button>
              </div>
            }>
              <div className="space-y-5">
                {LANG_GROUPS.map((g) => (
                  <div key={g.name}>
                    <div className="text-xs text-muted-foreground mb-2">{g.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {g.langs.map((l) => {
                        const active = langs.includes(l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => toggleLang(l.id)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-1.5",
                              active
                                ? "bg-gradient-primary border-transparent text-primary-foreground shadow-glow"
                                : "border-border bg-secondary hover:border-primary/60",
                            )}
                          >
                            <span>{l.flag}</span>
                            <span>{l.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* === SUBTITLE STYLE === */}
            <Card title="字幕风格" hint="6 种预设">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUBTITLE_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubStyle(s.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all aspect-[4/3] flex flex-col justify-between",
                      subStyle === s.id
                        ? "border-primary bg-accent/30 shadow-glow"
                        : "border-border bg-secondary hover:border-primary/60",
                    )}
                  >
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-2 mb-2">
                      <span className={s.previewClass}>{s.preview}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* === SUBTITLE BACKGROUND === */}
            <Card title="字幕背景" hint="8 种样式">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {BG_STYLES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBgStyle(b.id)}
                    className={cn(
                      "rounded-xl border p-3 transition-all aspect-[4/3] flex flex-col",
                      bgStyle === b.id
                        ? "border-primary bg-accent/30 shadow-glow"
                        : "border-border bg-secondary hover:border-primary/60",
                    )}
                  >
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden relative">
                      <span className={cn("text-white text-xs", b.cls)}>字幕示例</span>
                    </div>
                    <div className="text-xs font-medium mt-2 text-center">{b.name}</div>
                  </button>
                ))}
              </div>
              {bgStyle !== "none" && (
                <div className="grid sm:grid-cols-2 gap-5 pt-4 border-t border-border">
                  {bgStyle === "solid" && (
                    <Field label="背景颜色">
                      <div className="flex gap-2 items-center flex-wrap">
                        {["#000000", "#FFFFFF", "#7c3aed", "#dc2626", "#2563eb"].map((c) => (
                          <button key={c} onClick={() => setBgColor(c)}
                            className={cn("w-8 h-8 rounded-md border-2", bgColor === c ? "border-primary" : "border-border")}
                            style={{ backgroundColor: c }} />
                        ))}
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                      </div>
                    </Field>
                  )}
                  <Field label={`透明度 ${bgOpacity[0]}%`}>
                    <Slider value={bgOpacity} onValueChange={setBgOpacity} max={100} step={1} />
                  </Field>
                  <Field label={`圆角 ${bgRadius[0]}px`}>
                    <Slider value={bgRadius} onValueChange={setBgRadius} max={32} step={1} />
                  </Field>
                  <Field label="背景宽度">
                    <div className="flex gap-2">
                      {[{ id: "full", n: "全宽" }, { id: "fit", n: "适应文字" }, { id: "custom", n: "自定义" }].map((w) => (
                        <Chip key={w.id} active={bgWidth === w.id} onClick={() => setBgWidth(w.id as never)}>{w.n}</Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label={`内边距 ${bgPadding[0]}px`}>
                    <Slider value={bgPadding} onValueChange={setBgPadding} max={32} step={1} />
                  </Field>
                </div>
              )}
            </Card>

            {/* === SUBTITLE DETAILS === */}
            <Card title="字幕细节">
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="字体大小">
                  <div className="flex flex-wrap gap-2">
                    {[{ id: "sm", n: "小" }, { id: "md", n: "中" }, { id: "lg", n: "大" }, { id: "xl", n: "超大" }].map((s) => (
                      <Chip key={s.id} active={fontSize === s.id} onClick={() => setFontSize(s.id as never)}>{s.n}</Chip>
                    ))}
                  </div>
                </Field>
                <Field label="字幕位置">
                  <div className="flex flex-wrap gap-2">
                    {[{ id: "top", n: "顶部" }, { id: "middle", n: "中间" }, { id: "bottom", n: "底部" }].map((p) => (
                      <Chip key={p.id} active={position === p.id} onClick={() => setPosition(p.id as never)}>{p.n}</Chip>
                    ))}
                  </div>
                </Field>
                <Field label={`描边粗细 ${strokeWidth[0]}`}>
                  <Slider value={strokeWidth} onValueChange={setStrokeWidth} max={5} step={1} />
                </Field>
              </div>

              {/* Live preview */}
              <div className="mt-6 aspect-video rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-border relative overflow-hidden">
                <div className={cn(
                  "absolute left-0 right-0 flex justify-center px-6",
                  position === "top" && "top-6",
                  position === "middle" && "top-1/2 -translate-y-1/2",
                  position === "bottom" && "bottom-6",
                )}>
                  <div className={cn(fontSizeCls, bgObj.cls)} style={livePreviewBg}>
                    <span className={styleObj.previewClass}>实时字幕预览 Live Preview</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* === MUSIC === */}
            <Card title="背景音乐">
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-5">
                {MUSIC_STYLES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMusic(m.id)}
                    className={cn(
                      "rounded-xl border p-3 text-center transition-all",
                      music === m.id
                        ? "border-primary bg-accent/30 shadow-glow"
                        : "border-border bg-secondary hover:border-primary/60",
                    )}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-xs font-medium">{m.name}</div>
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={`音乐音量 ${volume[0]}%`}>
                  <Slider value={volume} onValueChange={setVolume} max={100} step={1} disabled={music === "none"} />
                </Field>
                <Field label="淡入 / 淡出">
                  <button
                    onClick={() => setFade((v) => !v)}
                    disabled={music === "none"}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm border transition-all",
                      fade
                        ? "bg-gradient-primary border-transparent text-primary-foreground shadow-glow"
                        : "border-border bg-secondary",
                      music === "none" && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {fade ? "✓ 已开启" : "已关闭"}
                  </button>
                </Field>
              </div>
            </Card>

            {/* === EXPORT === */}
            <Card title="导出设置">
              <Field label="分辨率">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setResolution(r.id)}
                      className={cn(
                        "relative rounded-xl border p-3 text-center transition-all",
                        resolution === r.id
                          ? "border-primary bg-accent/30 shadow-glow"
                          : "border-border bg-secondary hover:border-primary/60",
                      )}
                    >
                      {r.badge && (
                        <span className={cn("absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white", r.badge.color)}>
                          {r.badge.text}
                        </span>
                      )}
                      <div className="font-bold text-sm">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <Field label="导出格式">
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((f) => (
                      <Chip key={f} active={format === f} onClick={() => setFormat(f)}>
                        {f}{f === "MP4" && " (推荐)"}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="帧率">
                  <div className="flex flex-wrap gap-2">
                    {FPS_OPTS.map((f) => (
                      <Chip key={f.id} active={fps === f.id} onClick={() => setFps(f.id)}>
                        {f.name} <span className="opacity-70">· {f.desc}</span>
                      </Chip>
                    ))}
                  </div>
                </Field>
              </div>
            </Card>

            <Button
              onClick={startProcessing}
              disabled={langs.length === 0}
              size="lg"
              className="w-full bg-gradient-primary hover:opacity-90 shadow-glow text-base h-14 animate-pulse-glow"
            >
              <Sparkles className="w-5 h-5" /> 开始处理 ✨
            </Button>
          </div>
        )}

        {stage === "processing" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center animate-fade-in shadow-card">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI 正在处理你的视频…</h3>
            <p className="text-primary font-medium mb-6">{PROCESS_STEPS[processStep]}</p>
            <Progress value={progress} className="h-2 max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">{progress}%</p>
          </div>
        )}

        {stage === "done" && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 animate-fade-in shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">处理完成！</div>
                <div className="text-xs text-muted-foreground">{resolution.toUpperCase()} · {format} · {fps}fps</div>
              </div>
            </div>

            <div className="aspect-video rounded-xl bg-black border border-border relative overflow-hidden mb-6">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  视频不可用
                </div>
              )}
              <div className={cn(
                "pointer-events-none absolute left-0 right-0 flex justify-center px-6 z-10",
                position === "top" && "top-6",
                position === "middle" && "top-1/2 -translate-y-1/2",
                position === "bottom" && "bottom-16",
              )}>
                <div className={cn(fontSizeCls, bgObj.cls)} style={livePreviewBg}>
                  <span className={styleObj.previewClass}>已生成 {langs.length} 种语言字幕</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button size="lg" onClick={downloadVideo} className="flex-1 bg-green-600 hover:bg-green-600/90 text-white">
                <Download className="w-4 h-4" /> 下载成片
              </Button>
              <Button size="lg" variant="secondary" onClick={reset} className="flex-1">
                <RefreshCw className="w-4 h-4" /> 重新处理
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["TikTok", "YouTube", "Instagram"] as const).map((p) => (
                <Button key={p} variant="outline" size="sm" onClick={() => shareVideo(p)}>
                  <Share2 className="w-3 h-3" /> {p}
                </Button>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Card({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3">{label}</label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg text-sm border transition-all",
        active
          ? "bg-gradient-primary border-transparent text-primary-foreground shadow-glow"
          : "border-border bg-secondary hover:border-primary/60",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}
