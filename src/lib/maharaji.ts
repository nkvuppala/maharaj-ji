export type Lang = "en" | "hi" | "te" | "ta";

export const LANGUAGES: { code: Lang; label: string; greeting: string }[] = [
  { code: "en", label: "English", greeting: "Ask Maharaj-ji anything with love and devotion..." },
  { code: "hi", label: "हिंदी", greeting: "महाराज-जी से प्रेम और भक्ति से कुछ भी पूछें..." },
  { code: "te", label: "తెలుగు", greeting: "మహారాజ్-జీని ప్రేమతో ఏదైనా అడగండి..." },
  { code: "ta", label: "தமிழ்", greeting: "மகாராஜ்-ஜீயிடம் அன்புடன் எதையும் கேளுங்கள்..." },
];

export interface Message {
  id: number;
  role: "user" | "baba";
  text: string;
}

export const SUGGESTIONS = [
  { icon: "lotus", text: "How do I find inner peace amidst chaos?" },
  { icon: "hands", text: "Teach me how to love someone who hurt me" },
  { icon: "om", text: "महाराज-जी, मुझे सही राह दिखाइए" },
  { icon: "temple", text: "Tell me about Kainchi Dham and Hanuman Ji" },
];

/** Rotating canned blessings (frontend-only companion). */
export const BABA_REPLIES = [
  "Peace is not found by running to the mountains, my child. Peace is found in the middle of the storm, when the heart keeps saying Ram Nam. Do your work with love, and leave the fruit of the work to Him. The river does not worry about the sea — it only flows, and it arrives.",
  "Love is the only medicine, and it has no side effects. When someone hurts you, remember — Sub Ek. All is One. The same God who lives in you lives in them, even when their actions are crooked. Love them, pray for them, and keep your heart clean. Maharaj-ji says: love everyone, serve everyone, remember God.",
  "देखो, राह सिर्फ़ एक ही है — प्रेम की राह। जो काम हाथ में है, उसे पूरे मन से करो, और फल की चिंता भगवान को सौंप दो। रोज़ थोड़ा नाम सिमरन करो, रोज़ किसी की सेवा करो। बस, यही सही राह है, बेटा। सब एक है — सबको प्रेम करो, सबकी सेवा करो।",
  "Kainchi Dham is a little temple tucked between the hills of Kumaon, where the cold river runs and the deodar trees keep silence. Hanuman Ji's murti sits there in His blazing tenderness — He removes every obstacle for the one who remembers Him. People came from all over the world to sit near Maharaj-ji, and they found nothing there but love. That is the whole secret.",
  "Feed someone today, my child. That is the greatest worship. Feed people — all people — and tell the truth. When you serve another with your own hands, the knot in your heart loosens by itself. God does not live in the sky; He lives in the stomach of the hungry and the tears of the lonely.",
];

export const PRASAD_QUOTES = [
  "The best way to find God is to love all, serve all, and feed all — and keep repeating His name.",
  "Attachment and aversion are the two ropes that bind us. Cut both with love, and you are free.",
  "Don't try to be a big man. Try to be a true man. Serve quietly, and let God do the advertising.",
  "Sub Ek — all is one. The same light shines in every heart, so there is no one who is not your own.",
  "Love is the strongest medicine in the world. It heals the giver before it heals the receiver.",
];

export const CHALISA_LYRICS = [
  { hi: "श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।", en: "With the dust of my Guru's lotus feet I polish the mirror of my mind." },
  { hi: "बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि।", en: "I sing the stainless glory of Ram, the giver of the four fruits." },
  { hi: "बुद्धिहीन तनु जानिके, सुमिरौं पवन कुमार।", en: "Knowing myself to be without wisdom, I remember the son of the wind." },
  { hi: "बल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार।", en: "Grant me strength, wisdom and knowledge, and take away my afflictions." },
  { hi: "जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर।", en: "Victory to Hanuman, ocean of wisdom and virtue, light of the three worlds." },
  { hi: "राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा।", en: "Ram's messenger, abode of matchless strength, son of Anjani, wind-born." },
];

export const DOCUMENTARIES = [
  {
    title: "Ram Dass: From Harvard to Hanuman",
    blurb: "How a Harvard psychologist became Maharaj-ji's devotee and carried his love to the West.",
    search: "Ram Dass Neem Karoli Baba documentary",
  },
  {
    title: "Steve Jobs at Kainchi Dham",
    blurb: "The 1976 visit that brought Silicon Valley pilgrims to a small Himalayan ashram.",
    search: "Steve Jobs Kainchi Dham Neem Karoli Baba visit",
  },
  {
    title: "Kainchi Dham: The Ashram in the Hills",
    blurb: "The story of the ashram on the Kosi river — its temples, its prasad, its silence.",
    search: "Kainchi Dham ashram documentary Uttarakhand",
  },
];

/** Soft tanpura-like ambient drone, built with the Web Audio API (no assets needed). */
export function createAmbientDrone() {
  let ctx: AudioContext | null = null;
  let nodes: (OscillatorNode | GainNode)[] = [];

  const start = () => {
    if (ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);
    // Sa & Pa drone (tanpura feel)
    [146.83, 220.0, 293.66].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx!.createGain();
      g.gain.value = i === 0 ? 0.9 : 0.5;
      const lfo = ctx!.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = ctx!.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      osc.connect(g);
      g.connect(master);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo, g);
    });
    nodes.push(master);
  };

  const stop = () => {
    if (!ctx) return;
    const closing = ctx;
    nodes.forEach((n) => {
      try {
        if ("stop" in n) n.stop(closing.currentTime + 1.2);
      } catch { /* already stopped */ }
    });
    nodes = [];
    ctx = null;
    setTimeout(() => closing.close(), 1500);
  };

  return { start, stop };
}
