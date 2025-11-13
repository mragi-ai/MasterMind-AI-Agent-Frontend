import { useEffect, useRef, useState } from "react";
import { Mic, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatAsk } from "@/lib/api/endpoints/agent";
import useAppStore from "@/zustand";
import { getUser } from "@/lib/auth";

type Role = "user" | "assistant" | "system";
type ContentKind = "text" | "video" | "options";

type Message = {
  id: string;
  role: Role;
  kind: ContentKind;
  text?: string;
  video?: { src: string; title: string; poster?: string; duration?: string };
  options?: { label: string; value: string }[];
  source?: string;
  ts?: string;
};

// Generate robust unique IDs across environments (fallback if crypto.randomUUID is unavailable)
const generateId = (): string =>
  typeof crypto !== "undefined" &&
  typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

type Props = {
  apiBase?: string;
  brandName?: string;
  logoUrl?: string;
  phoneNumber?: string;
  onEscalate?: () => void;
  startOpen?: boolean;
  supportEmail?: string;
};

export default function AITrainerWidget({
  apiBase = "/api",
  brandName = "AI Trainer",
  logoUrl,
  phoneNumber,
  onEscalate,
  startOpen = false,
  supportEmail = "training-support@mastermind.ai",
}: Props) {
  const [open, setOpen] = useState(startOpen);
  const [hideLauncher, setHideLauncher] = useState(false);
  const [permission, setPermission] = useState("prompt");
  const selectedRole = useAppStore((state) => state.selectedRole);
  console.log("Selected role in AITrainerWidget:", selectedRole);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      kind: "text",
      text: "Hi! I'm your AI training assistant. I can help you with step-by-step guidance, answer questions, or connect you with a specialist.",
      ts: new Date().toLocaleTimeString(),
    },
    {
      id: "quick-start",
      role: "assistant",
      kind: "options",
      text: "What would you like help with?",
      options: [
        { label: "📹 Watch a tutorial", value: "tutorial" },
        { label: "❓ Ask a question", value: "question" },
        { label: "📞 Talk to someone", value: "escalate" },
      ],
      ts: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [online] = useState(true);
  const [micPermission, setMicPermission] = useState<
    "granted" | "prompt" | "denied" | "unsupported"
  >("prompt");
  const isSecure =
    typeof window !== "undefined" && (window as any).isSecureContext === true;

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [ariaLive, setAriaLive] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Listen for open-ai-trainer event
  useEffect(() => {
    const handler = (e: any) => {
      setOpen(true);
      const prompt = e.detail?.prompt as string | undefined;
      if (prompt) {
        setInput(prompt);
        // Auto-focus input when opened with prompt
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener("open-ai-trainer", handler);
    return () => window.removeEventListener("open-ai-trainer", handler);
  }, []);

  // Listen for video steps modal visibility to hide the launcher button
  useEffect(() => {
    const onOpen = () => setHideLauncher(true);
    const onClose = () => setHideLauncher(false);
    window.addEventListener("video-steps-open", onOpen);
    window.addEventListener("video-steps-close", onClose);
    return () => {
      window.removeEventListener("video-steps-open", onOpen);
      window.removeEventListener("video-steps-close", onClose);
    };
  }, []);

  // Detect microphone permission status when available
  useEffect(() => {
    let permissionStatus: any;
    const setup = async () => {
      try {
        if (
          "permissions" in navigator &&
          (navigator as any).permissions?.query
        ) {
          // Safari may not support "microphone" in Permissions API; guard with as any
          permissionStatus = await (navigator as any).permissions.query({
            name: "microphone" as any,
          });
          const mapState = (s: string) =>
            s === "granted" || s === "prompt" || s === "denied" ? s : "prompt";
          setMicPermission(mapState(permissionStatus.state));
          permissionStatus.onchange = () =>
            setMicPermission(mapState(permissionStatus.state));
        } else {
          setMicPermission("unsupported");
        }
      } catch {
        setMicPermission("unsupported");
      }
    };
    setup();
    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    const askPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        setPermission("granted");
        console.log("✅ Microphone permission granted");
      } catch (err) {
        console.error("❌ Microphone permission denied:", err);
        setPermission("denied");
      }
    };

    askPermission();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Disable body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // Re-enable body scroll when modal closes
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Auto-scroll to bottom when chat opens
  useEffect(() => {
    if (open && listRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [open]);

  const pushMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const sendText = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || sending) return;

    const currentUser = getUser();
    console.log("Current user in sendText:", currentUser?.user_id);
    setSending(true);
    setInput("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      kind: "text",
      text: messageText,
      ts: new Date().toLocaleTimeString(),
    };
    pushMessage(userMsg);
    setTyping(true);

    try {
      const res = await chatAsk({
        question: messageText,
        // role: selectedRole?.role || "dispatcher",
        role: "dispatcher",
        ...(sessionId && { session_id: sessionId }),
        user_id: currentUser?.user_id,
      } as any);

      // Extract session_id from response if present
      if (res.session_id) {
        if (!sessionId) {
          console.log("Session ID received from first response:", res.session_id);
        }
        setSessionId(res.session_id);
      }

      const mapped = (
        res.messages ||
        (res.answer ? [{ role: "assistant", content: res.answer }] : [])
      ).map((rm: any) => ({
        id: generateId(),
        role: rm.role,
        kind: (rm.kind as any) || "text",
        text: rm.content,
        ts: new Date().toLocaleTimeString(),
      }));

      if (mapped.length === 0) {
        mapped.push({
          id: generateId(),
          role: "assistant",
          kind: "text",
          text: "I didn't receive a response. Please try again.",
          ts: new Date().toLocaleTimeString(),
        });
      }

      mapped.forEach((m) => pushMessage(m));
      setAriaLive(
        mapped
          .map((m) => m.text)
          .filter(Boolean)
          .join(" ")
      );
    } catch (e: any) {
      const msg = e?.message || "Failed to send message";
      pushMessage({
        id: generateId(),
        role: "system",
        kind: "text",
        text: msg,
        ts: new Date().toLocaleTimeString(),
      });
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const clickQuickReply = async (value: string, label: string) => {
    if (value === "escalate") {
      if (onEscalate) {
        onEscalate();
      }
      pushContactDetails();
    } else {
      await sendText(label);
    }
  };

  const ensureMicPermission = async (): Promise<boolean> => {
    if (!isSecure || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("unsupported");
      pushMessage({
        id: generateId(),
        role: "system",
        kind: "text",
        text: !isSecure
          ? "Microphone requires a secure context (HTTPS or localhost)."
          : "Microphone API not supported by this browser.",
        ts: new Date().toLocaleTimeString(),
      });
      return false;
    }

    try {
      // Request permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      return true;
    } catch (err) {
      console.warn("Mic permission error:", err);
      setMicPermission("denied");
      pushMessage({
        id: generateId(),
        role: "system",
        kind: "text",
        text: "Microphone access was denied. Please allow microphone access in browser settings.",
        ts: new Date().toLocaleTimeString(),
      });
      return false;
    }
  };

  const pushContactDetails = () => {
    const contactNumber = phoneNumber || "+1 (407) 307-0855";
    pushMessage({
      id: generateId(),
      role: "assistant",
      kind: "text",
      text: `You can reach our mentor desk directly at ${contactNumber} or email us at ${supportEmail}`,
      ts: new Date().toLocaleTimeString(),
    });
  };

  const startRecording = async () => {
    if (recording) return;
    const permitted = await ensureMicPermission();
    if (!permitted) return;

    // ✅ Use Web Speech API for real-time speech-to-text
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      pushMessage({
        id: generateId(),
        role: "system",
        kind: "text",
        text: "Speech recognition not supported in this browser.",
        ts: new Date().toLocaleTimeString(),
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setRecording(true);
      console.log("🎙️ Recording started");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("🗣️ Transcribed:", transcript);
      sendText(transcript); // send message to chat
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      pushMessage({
        id: generateId(),
        role: "system",
        kind: "text",
        text: `Speech recognition error: ${event.error}`,
        ts: new Date().toLocaleTimeString(),
      });
    };

    recognition.onend = () => {
      setRecording(false);
      console.log("🎙️ Recording stopped");
    };

    // Keep a reference so we can stop later
    (mediaRecorderRef as any).current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    const recognition = (mediaRecorderRef as any).current;
    if (recognition && recognition.stop) {
      recognition.stop();
      console.log("🎙️ Recognition stopped manually");
    }
  };

  const callNow = () => {
    if (!phoneNumber) return;
    window.location.href = `tel:${phoneNumber.replace(/^tel:/, "")}`;
  };

  const closeWidget = () => setOpen(false);

  return (
    <>
      {!open && !hideLauncher && (
        <button
          className={cn(
            "fixed right-5 bottom-5 w-14 h-14 rounded-2xl z-[100]",
            "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
            "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
            "transition-all duration-300 hover:scale-110",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-4 focus:ring-primary/30 focus:ring-offset-2",
            "after:absolute after:inset-0 after:rounded-2xl after:bg-primary/0",
            "after:transition-colors after:duration-300 hover:after:bg-primary/10"
          )}
          aria-label="Open AI Trainer"
          onClick={() => setOpen(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3a9 9 0 0 0-9 9v3a3 3 0 0 0 3 3h1v-8a7 7 0 0 1 14 0v3a3 3 0 0 1-3 3h-1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="4"
              y="12"
              width="4"
              height="7"
              rx="2"
              fill="currentColor"
            />
            <rect
              x="16"
              y="12"
              width="4"
              height="5"
              rx="2"
              fill="currentColor"
            />
          </svg>
        </button>
      )}

      {open && (
        <section
          className={cn(
            "fixed inset-0 z-[100]",
            "flex flex-col bg-gradient-to-br from-background via-background/98 to-background/95",
            "overflow-hidden backdrop-blur-sm",
            "animate-fade-in"
          )}
          role="dialog"
          aria-label="AI Trainer"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-background to-background/95 shrink-0 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="w-8 h-8 rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-sm">
                  AI
                </div>
              )}
              <div>
                <div className="font-semibold">{brandName}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      online
                        ? "bg-success animate-pulse-ring ring-2 ring-success/20"
                        : "bg-yellow-500"
                    )}
                    aria-hidden="true"
                  />
                  <span>{online ? "Online" : "Offline"}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {phoneNumber && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={callNow}
                  aria-label="Call now"
                  className="h-8 px-2"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (onEscalate) {
                    onEscalate();
                  }
                  pushContactDetails();
                }}
                className="h-8 px-3 text-xs"
              >
                Escalate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeWidget}
                aria-label="Close"
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="relative flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-background via-background/95 to-background/90 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent hover:scrollbar-thumb-primary/20"
            ref={listRef}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="sr-only" aria-live="polite">
              {ariaLive}
            </div>

            <div className="relative z-10">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-xl px-4 py-3 shadow-sm backdrop-blur-[2px]",
                      "transition-all duration-200 hover:shadow-md",
                      "animate-slide-up-fade",
                      m.role === "user"
                        ? "bg-primary/10 border-primary/20 text-foreground border-2 border-primary/20"
                        : "bg-card/95 border border-border hover:border-border/80"
                    )}
                  >
                    {m.kind === "text" && (
                      <div className="text-base leading-relaxed">{m.text}</div>
                    )}

                    {m.kind === "video" && m.video && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border bg-black">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          poster={m.video.poster}
                          className="w-full"
                        >
                          <source src={m.video.src} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <div className="flex gap-2 p-2 bg-card border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Replay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1"
                          >
                            <a
                              href={m.video.src}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Full screen
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {m.kind === "options" && m.options && (
                      <>
                        {m.text && (
                          <div className="text-base leading-relaxed mb-2">
                            {m.text}
                          </div>
                        )}
                        <div
                          className="flex flex-wrap gap-2 mt-2"
                          role="group"
                          aria-label="Quick replies"
                        >
                          {m.options.map((opt) => (
                            <Button
                              key={opt.value}
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                clickQuickReply(opt.value, opt.label)
                              }
                              className="text-xs"
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      {m.source && <span>From: {m.source} • </span>}
                      <span>{m.ts}</span>
                    </div>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-xl border bg-card border-border px-4 py-3">
                    <div
                      className="flex gap-1"
                      aria-label="Assistant is typing"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="flex shrink-0 items-end gap-3 border-t border-border bg-gradient-to-r from-background to-background/95 px-6 py-4 backdrop-blur-sm">
            <button
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                "bg-primary/10 hover:bg-primary/20 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "border-2 border-transparent",
                recording &&
                  "ring-2 ring-destructive border-destructive/50 bg-destructive/10"
              )}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onClick={async () => {
                if (!recording) {
                  await ensureMicPermission();
                }
              }}
              aria-label={
                recording
                  ? "Recording—release to send"
                  : micPermission === "denied"
                  ? "Microphone blocked—click to retry permission"
                  : "Hold to talk"
              }
            >
              {recording ? (
                <span
                  className="w-4 h-2.5 bg-destructive rounded animate-wave-pulse"
                  aria-hidden="true"
                />
              ) : (
                <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </button>

            <div className="group relative flex-1">
              <textarea
                ref={inputRef}
                className={cn(
                  "w-full min-h-[2.5rem] max-h-32 px-4 py-2 rounded-xl resize-none",
                  "bg-primary/5 backdrop-blur-[2px]",
                  "text-sm leading-relaxed",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "placeholder:text-muted-foreground",
                  "border-2 border-transparent transition-all duration-200",
                  "group-hover:border-primary/20 focus:border-primary/20"
                )}
                rows={1}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                aria-label="Type your message"
              />
            </div>

            <Button
              size="sm"
              onClick={() => sendText()}
              disabled={sending || !input.trim()}
              aria-disabled={sending}
              className={cn(
                "h-10 px-4 shrink-0 rounded-xl",
                "bg-primary/10 hover:bg-primary/20 text-primary",
                "border-2 border-transparent transition-all duration-200",
                "hover:border-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {/* Mic permission helper */}
          {(micPermission === "denied" ||
            micPermission === "prompt" ||
            micPermission === "unsupported" ||
            !isSecure) && (
            <div className="w-full border-t border-yellow-200 bg-yellow-50 px-6 py-3 text-xs text-yellow-700">
              {!isSecure && (
                <>
                  Microphone requires a secure context. Run on HTTPS or
                  localhost.
                </>
              )}
              {isSecure && micPermission === "unsupported" && (
                <>Microphone API not supported by this browser.</>
              )}
              {isSecure && micPermission === "denied" && (
                <>
                  Microphone is blocked in your browser. Click Enable Microphone
                  and allow access in the prompt.
                </>
              )}
              {isSecure && micPermission === "prompt" && (
                <>To use voice, click Enable Microphone and grant permission.</>
              )}
              <div className="mt-2">
                <Button size="sm" onClick={ensureMicPermission} className="h-7">
                  Enable Microphone
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// Simulated responses for demo
function getSimulatedResponse(text: string): Message[] {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("tutorial") ||
    lowerText.includes("video") ||
    lowerText.includes("watch")
  ) {
    return [
      {
        id: generateId(),
        role: "assistant",
        kind: "text",
        text: "Great! I have several tutorial videos that might help. Here's a popular one:",
        ts: new Date().toLocaleTimeString(),
      },
      {
        id: generateId(),
        role: "assistant",
        kind: "video",
        video: {
          src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          title: "Getting Started Tutorial",
          duration: "5:30",
        },
        source: "Training Library v3",
        ts: new Date().toLocaleTimeString(),
      },
      {
        id: generateId(),
        role: "assistant",
        kind: "options",
        text: "Was this helpful?",
        options: [
          { label: "✓ Yes, thanks!", value: "helpful" },
          { label: "Show more", value: "more" },
          { label: "Talk to someone", value: "escalate" },
        ],
        ts: new Date().toLocaleTimeString(),
      },
    ];
  }

  if (lowerText.includes("question") || lowerText.includes("help")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        kind: "text",
        text: "I'm here to help! You can ask me about our processes, watch step-by-step videos, or I can connect you with a specialist. What would you like to know?",
        ts: new Date().toLocaleTimeString(),
      },
    ];
  }

  return [
    {
      id: generateId(),
      role: "assistant",
      kind: "text",
      text: `I understand you're asking about "${text}". In a production environment, this would connect to your AI backend to provide contextual answers, relevant videos, and smart suggestions.`,
      source: "AI Engine",
      ts: new Date().toLocaleTimeString(),
    },
    {
      id: generateId(),
      role: "assistant",
      kind: "options",
      text: "What would you like to do next?",
      options: [
        { label: "Watch a tutorial", value: "tutorial" },
        { label: "Ask something else", value: "question" },
        { label: "Talk to someone", value: "escalate" },
      ],
      ts: new Date().toLocaleTimeString(),
    },
  ];
}

// Very simple placeholder transcription to mimic server-side STT
function getSimulatedTranscription(_audio: Blob): string {
  const samples = [
    "I need help tracking a container in real-time.",
    "Can you show me a quick tutorial for dispatch?",
    "How do I create a billing dispute ticket?",
    "What steps are needed to escalate a customer issue?",
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}
