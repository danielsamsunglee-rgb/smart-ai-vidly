import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Upload, FileVideo, Sparkles, Download, Play, Loader2, Check } from "lucide-react";

type Stage = "idle" | "uploading" | "configure" | "processing" | "done";

const LANGUAGES = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
  { id: "ms", label: "Bahasa Malaysia" },
];
const FONTS = ["现代", "粗体", "细体"];
const MUSIC = ["轻松", "欢快", "励志", "平静", "无配乐"];

export function VideoStudio() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [langs, setLangs] = useState<string[]>(["zh", "en"]);
  const [font, setFont] = useState("现代");
  const [music, setMusic] = useState("轻松");
  const [volume, setVolume] = useState([60]);

  function handleFile(file: File) {
    setFileName(file.name);
    setStage("uploading");
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setStage("configure");
          return 100;
        }
        return p + 8;
      });
    }, 120);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function toggleLang(id: string) {
    setLangs((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function startProcessing() {
    setStage("processing");
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setStage("done");
          return 100;
        }
        return p + 4;
      });
    }, 150);
  }

  function reset() {
    setStage("idle");
    setProgress(0);
    setFileName("");
  }

  return (
    <section id="upload" className="max-w-4xl mx-auto px-6 pb-24">
      {stage === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-16 text-center bg-card/50 backdrop-blur ${
            dragOver ? "border-primary bg-accent/30 scale-[1.01]" : "border-border hover:border-primary/60"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 shadow-glow">
            <Upload className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">拖拽视频到这里，或点击上传</h3>
          <p className="text-sm text-muted-foreground">支持 MP4、MOV 格式 · 最大 500MB</p>
        </div>
      )}

      {stage === "uploading" && (
        <div className="rounded-2xl border border-border bg-card p-10 animate-fade-in shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <FileVideo className="w-5 h-5 text-primary" />
            <span className="font-medium truncate">{fileName}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-3">上传中… {progress}%</p>
        </div>
      )}

      {stage === "configure" && (
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10 space-y-8 animate-fade-in shadow-card">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{fileName}</div>
              <div className="text-xs text-muted-foreground">上传成功，请配置处理选项</div>
            </div>
          </div>

          <Field label="字幕语言（可多选）">
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const active = langs.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLang(l.id)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      active
                        ? "bg-gradient-primary border-transparent text-primary-foreground shadow-glow"
                        : "border-border bg-secondary hover:border-primary/60"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="字幕字体风格">
            <div className="flex flex-wrap gap-2">
              {FONTS.map((f) => (
                <Chip key={f} active={font === f} onClick={() => setFont(f)}>{f}</Chip>
              ))}
            </div>
          </Field>

          <Field label="背景音乐风格">
            <div className="flex flex-wrap gap-2">
              {MUSIC.map((m) => (
                <Chip key={m} active={music === m} onClick={() => setMusic(m)}>{m}</Chip>
              ))}
            </div>
          </Field>

          <Field label={`音乐音量  ${volume[0]}%`}>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              disabled={music === "无配乐"}
              className="mt-2"
            />
          </Field>

          <Button
            onClick={startProcessing}
            disabled={langs.length === 0}
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 shadow-glow text-base h-12"
          >
            <Sparkles className="w-4 h-4" />
            开始处理
          </Button>
        </div>
      )}

      {stage === "processing" && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center animate-fade-in shadow-card">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
            <Loader2 className="w-9 h-9 text-primary-foreground animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI 正在处理你的视频…</h3>
          <p className="text-sm text-muted-foreground mb-6">识别语音 · 生成字幕 · 匹配配乐</p>
          <Progress value={progress} className="h-2 max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">{progress}%</p>
        </div>
      )}

      {stage === "done" && (
        <div className="rounded-2xl border border-border bg-card p-8 animate-fade-in shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Check className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">处理完成！</div>
              <div className="text-xs text-muted-foreground">预览你的成品视频</div>
            </div>
          </div>

          <div className="aspect-video rounded-xl bg-black/60 border border-border flex items-center justify-center relative overflow-hidden mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <button className="relative w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow hover:scale-105 transition-transform">
              <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="px-4 py-2 bg-black/70 rounded-md text-sm">
                {langs.map((id) => LANGUAGES.find((l) => l.id === id)?.label).join(" / ")} 字幕已生成
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1 bg-gradient-primary hover:opacity-90 shadow-glow">
              <Download className="w-4 h-4" />
              下载视频
            </Button>
            <Button size="lg" variant="outline" onClick={reset} className="flex-1">
              处理新视频
            </Button>
          </div>
        </div>
      )}
    </section>
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
        active
          ? "bg-gradient-primary border-transparent text-primary-foreground shadow-glow"
          : "border-border bg-secondary hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}
