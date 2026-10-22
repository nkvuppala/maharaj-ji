import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/maharaji/Header";
import ChatStream from "@/components/maharaji/ChatStream";
import InputDock from "@/components/maharaji/InputDock";
import { PrasadModal, JapaModal, MediaDrawer, SettingsSheet } from "@/components/maharaji/Sheets";
import { BABA_REPLIES, LANGUAGES, createAmbientDrone, type Lang, type Message } from "@/lib/maharaji";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maharaj-ji Speaks • Sub Ek — Love, Serve, Remember" },
      {
        name: "description",
        content:
          "A warm, prayerful conversational companion in the spirit of Neem Karoli Baba — ask with love, receive a blessing. Hanuman Chalisa, japa counter, photo darshan and more.",
      },
      { property: "og:title", content: "Maharaj-ji Speaks • Sub Ek" },
      {
        property: "og:description",
        content:
          "Step into a peaceful digital sanctuary — converse with a companion in the spirit of Neem Karoli Baba, with daily prasad, japa counter and photo darshan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Maharaj-ji Speaks • Sub Ek" },
      {
        name: "twitter:description",
        content: "A warm, prayerful conversational companion in the spirit of Neem Karoli Baba.",
      },
    ],
  }),
  component: Index,
});

type SheetKind = "prasad" | "japa" | "media" | "settings" | null;

interface Prefs {
  elder: boolean;
  contrast: boolean;
  reduceMotion: boolean;
}

const PREFS_KEY = "maharaji.prefs";

function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ elder: false, contrast: false, reduceMotion: false });
  const replyIndex = useRef(0);
  const droneRef = useRef<ReturnType<typeof createAmbientDrone> | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);

  // Restore elder-friendly preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ elder: false, contrast: false, reduceMotion: false, ...JSON.parse(raw) });
    } catch { /* fresh device */ }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("elder-mode", prefs.elder);
    root.classList.toggle("elder-contrast", prefs.contrast);
    root.classList.toggle("reduce-motion", prefs.reduceMotion);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch { /* storage unavailable */ }
  }, [prefs]);

  useEffect(() => () => droneRef.current?.stop(), []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: trimmed }]);
    setTyping(true);
    const reply = BABA_REPLIES[replyIndex.current % BABA_REPLIES.length];
    replyIndex.current += 1;
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, role: "baba", text: reply }]);
      setTyping(false);
      window.setTimeout(() => {
        streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
      }, 60);
    }, 1100);
    window.setTimeout(() => {
      streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  };

  const toggleAmbient = () => {
    if (!droneRef.current) droneRef.current = createAmbientDrone();
    if (ambientOn) {
      droneRef.current.stop();
      setAmbientOn(false);
      showToast("Ambient silence restored 🕉️");
    } else {
      droneRef.current.start();
      setAmbientOn(true);
      showToast("Tanpura drone is playing softly 🔔");
    }
  };

  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="sanctuary-bg flex min-h-screen flex-col font-sans text-foreground">
      <Header
        ambientOn={ambientOn}
        onToggleAmbient={toggleAmbient}
        onOpen={(kind) => setSheet(kind)}
      />

      <div ref={streamRef} className="flex-1 overflow-y-auto">
        <ChatStream messages={messages} typing={typing} onSuggestion={send} />
      </div>

      <InputDock lang={lang} onLangChange={setLang} onSend={send} disabled={typing} />

      {/* Small blessing toast */}
      {toast && (
        <div className="glass-card rise-in fixed bottom-40 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-walnut">
          {toast}
        </div>
      )}

      <PrasadModal open={sheet === "prasad"} onClose={() => setSheet(null)} />
      <JapaModal open={sheet === "japa"} onClose={() => setSheet(null)} />
      <MediaDrawer open={sheet === "media"} onClose={() => setSheet(null)} />
      <SettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        prefs={prefs}
        onPrefs={setPrefs}
        onClearChat={() => {
          setMessages([]);
          setSheet(null);
          showToast("Conversation cleared with love 🙏");
        }}
      />

      <p className="sr-only">Active language: {activeLang.label}. Speak or type freely in any language.</p>
    </div>
  );
}
