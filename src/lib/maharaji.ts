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
  { icon: "lotus", text: "I'm worried about my future and career" },
  { icon: "hands", text: "How should I serve others when I have little?" },
];

/** Daily Quotes from Neem Karoli Baba */
export const PRASAD_QUOTES = [
  "Love everyone, serve everyone, remember God, and tell the truth.",
  "Sub Ek — All is One. The same light shines in every heart, so there is no one who is not your own.",
  "Peace is not something you go looking for outside, beta. It is what remains when you quiet the mind. Sit quietly, chant Ram, and feel — I am there.",
  "Attachment and aversion are the two ropes that bind us. Cut both with love, and you are free.",
  "Don't try to be a big man. Try to be a true man. Serve quietly, and let God do the advertising.",
  "Love is the strongest medicine in the world. It heals the giver before it heals the receiver.",
  "Do your duty with love, and leave the results to God. What can fear give you? Nothing. What can faith give you? Everything.",
  "The best way to find God is to love all, serve all, and feed all — and keep repeating His name.",
  "Never throw banana peels — see divinity in everything. Nothing in God's creation is waste.",
  "When you see God in everyone, forgiveness becomes natural. Forgive others not for their sake, but for your own peace.",
];

/** Inspiring Miracle Stories (Lilas) from knowledgeBase.ts */
export interface PrasadStory {
  title: string;
  location: string;
  story: string;
  moral: string;
}

export const PRASAD_STORIES: PrasadStory[] = [
  {
    title: "The Train at Neem Karoli",
    location: "Neem Karoli Station, Farrukhabad",
    story:
      "A British conductor once forced Maharaj-ji off a first-class train carriage because he looked like a simple sadhu in a blanket. Baba quietly stepped down and sat under a tree. When the conductor waved the green flag, the locomotive engine would not budge an inch, even with replacement engines. An Indian official recognized Baba and warned the authorities. The officials humbly apologized and requested Maharaj-ji to board again. The moment Baba sat down, the train started smoothly with a single whistle. Out of reverence, the railway built a station right there named Neem Karoli.",
    moral: "Humility and divine presence command the natural world more than force.",
  },
  {
    title: "Feeding Thousands (Hanuman Prasad)",
    location: "Kainchi Dham, Nainital",
    story:
      "During a festival bhandara, unexpected busloads of thousands of devotees arrived in the hills. The kitchen workers rushed in panic to Maharaj-ji, saying the tins of ghee and puries were completely finished. Baba smiled, took his blanket, covered the empty ghee containers, and commanded: 'Do not look inside, just keep serving with Hanuman's name.' Thousands ate sumptuous meals to their hearts' content, and when the feast was over, the containers were still miraculously full.",
    moral: "When you serve with selfless faith, abundance flows from the unseen.",
  },
  {
    title: "Omniscience & Ram Dass",
    location: "Nainital Hills, 1967",
    story:
      "When Harvard psychologist Dr. Richard Alpert first met Maharaj-ji, he was deeply skeptical. The night before, sitting alone under the stars miles away, Alpert had thought tenderly of his deceased mother and the spleen disease that took her life. The moment he sat before Baba, Maharaj-ji looked right through him and asked: 'You were thinking about your mother last night, weren't you? She died of spleen, yes?' Alpert burst into tears; the walls of his intellectual ego dissolved, and he was reborn as Ram Dass.",
    moral: "The true guru knows every whisper of your soul before you speak.",
  },
  {
    title: "The Blanket of Bullets",
    location: "Bhavania Ashram",
    story:
      "During World War II, a devotee's son was fighting on the battlefield. Back in India, Maharaj-ji suddenly began sweating, groaning, and clutching his thick wool blanket tightly around himself all night as if under fire. In the morning, Baba tossed the blanket down—heavy lead bullets fell out onto the floor, while Baba remained completely unharmed. Days later, a letter arrived: the devotee's son reported that while his entire unit fell, an unseen shield had shielded him from direct machine-gun fire.",
    moral: "A saint's grace knows no physical boundaries or distances.",
  },
  {
    title: "Larry Brilliant & Smallpox Eradication",
    location: "Kainchi Dham, 1970s",
    story:
      "Young Dr. Larry Brilliant was meditating at Kainchi Dham when Maharaj-ji suddenly poked him and said: 'Doctor, you are wasting time sitting here! Go work for the United Nations WHO. You are going to eradicate smallpox from India. This is God's gift to humanity.' Larry had no WHO connections, but Baba's word came true: Larry joined the campaign, smallpox was eliminated from India, and millions of lives were saved.",
    moral: "True spiritual realization expresses itself as practical service (Seva) to suffering humanity.",
  },
];

export const CHALISA_LYRICS = [
  { hi: "श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।", en: "Cleansing the mirror of my mind with the dust of the Guru's lotus feet." },
  { hi: "बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि।", en: "I describe the pure glory of Lord Ram, which bestows the four fruits of life." },
  { hi: "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।", en: "Knowing myself to be devoid of wisdom, I meditate on Pawan-Kumar, the son of the wind." },
  { hi: "बल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार।", en: "Grant me strength, wisdom, and knowledge, and remove my afflictions and impurities." },
  { hi: "जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर।", en: "Hail Hanuman, ocean of wisdom and virtue! Hail King of monkeys, illuminator of the three worlds!" },
  { hi: "राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा।", en: "Messenger of Lord Ram, abode of immeasurable strength, son of Anjani, named Pawansut." },
  { hi: "महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी।", en: "Great hero, valiant with thunderbolt limbs, dispeller of evil thoughts and companion of the wise." },
  { hi: "कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा।", en: "Golden-hued and dressed in fine garments, with sparkling earrings and curly hair." },
  { hi: "हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेऊ साजै।", en: "In your hands shine the thunderbolt and flag, while the sacred grass thread adorns your shoulder." },
  { hi: "संकर सुवन केसरीनंदन। तेज प्रताप महा जग बंदन।", en: "Incarnation of Shiva, joy of Kesari, whose radiant glory is revered across the entire cosmos." },
  { hi: "बिद्यावान गुनी अति चातुर। राम काज करिबे को आतुर।", en: "Wise, virtuous, and clever beyond measure, ever eager to carry out Lord Ram's work." },
  { hi: "प्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया।", en: "Delighting in listening to Lord Ram's legends, dwelling forever in the hearts of Ram, Lakshman, and Sita." },
  { hi: "संकट कटै मिटै सब पीरा। जो सुमिरै हनुमत बलबीरा।", en: "All difficulties vanish and all pain is erased for whoever remembers the mighty hero Hanuman." },
  { hi: "पवनतनय संकट हरन, मंगल मूरति रूप।", en: "O son of the wind, redeemer of sorrow, embodiment of auspicious grace." },
  { hi: "राम लखन सीता सहित, हृदय बसहु सुर भूप।", en: "With Ram, Lakshman, and Sita, dwell forever in my heart, O King of Gods." },
];

export interface VideoMedia {
  id: string;
  title: string;
  blurb: string;
  category: "chalisa" | "documentary";
  speaker?: string;
}

export const EMBEDDED_VIDEOS: VideoMedia[] = [
  {
    id: "xJ3vatsNQDU",
    title: "Shree Hanuman Chalisa (Traditional)",
    blurb: "The revered daily prayer chanted at Kainchi Dham for courage, purity, and freedom from fear.",
    category: "chalisa",
    speaker: "Traditional Chant",
  },
  {
    id: "AETFvQonfV8",
    title: "Shree Hanuman Chalisa (Gulshan Kumar)",
    blurb: "The timeless, deeply soulful Indian rendition cherished by millions of families worldwide.",
    category: "chalisa",
    speaker: "Gulshan Kumar / Hariharan",
  },
  {
    id: "r4GNBw5cu8c",
    title: "Moved by Grace — The Story of Maharaj-ji",
    blurb: "Heartwarming documentary featuring devotees whose lives blossomed forever upon meeting Baba.",
    category: "documentary",
    speaker: "Devotee Interviews & Ram Dass",
  },
  {
    id: "FgA0SjKnM0g",
    title: "Real Story of Neem Karoli Baba (हिंदी)",
    blurb: "Comprehensive journey through Maharaj-ji's life, his ashrams, and timeless teachings.",
    category: "documentary",
    speaker: "Kainchi Dham Records",
  },
  {
    id: "qY9JQDh1Kys",
    title: "Windfall of Grace",
    blurb: "A poetic and deep visual odyssey into Maharaj-ji's presence and the silent transmission of love.",
    category: "documentary",
    speaker: "Archival Footage & Testimonials",
  },
];

export const SACRED_RESOURCES = [
  {
    title: "Hanuman Journal",
    url: "https://hanumanjournal.com/",
    desc: "Stories, memoirs, and devotional writing about Maharaj-ji and his circle of devotees.",
  },
  {
    title: "Official Neem Karoli Baba Ashram",
    url: "https://www.neemkarolibaba.com/",
    desc: "Authentic information on Kainchi Dham, Vrindavan, and ashram visiting guidelines.",
  },
  {
    title: "Love Serve Remember Foundation",
    url: "https://www.ramdass.org/",
    desc: "Teachings of Ram Dass, Maharaj-ji's photos, archival audio discourses, and kirtan.",
  },
  {
    title: "Be Love Now & Miracle of Love",
    url: "https://www.amazon.com/Miracle-Love-Stories-Karoli-Baba/dp/1887474005",
    desc: "The definitive compendium of 1,000+ personal miracle stories recorded by devotees.",
  },
];

/** Soft tanpura-like ambient drone, built with the Web Audio API (no assets needed). */
export function createAmbientDrone() {
  let ctx: AudioContext | null = null;
  let nodes: (OscillatorNode | GainNode)[] = [];

  const start = () => {
    if (ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);
    // Sa & Pa drone (tanpura feel: D fundamental, A fifth, octave D)
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
      } catch {
        /* already stopped */
      }
    });
    nodes = [];
    ctx = null;
    setTimeout(() => closing.close(), 1500);
  };

  return { start, stop };
}

/** Play a sacred temple bell chime on Mala (108) completion */
export function playTempleBell() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio 528Hz love/miracle tone
    osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(528, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3.0);
  } catch {
    /* audio blocked */
  }
}

/**
 * Intelligent spiritual response matcher based on knowledgeBase.ts & trainingData.ts.
 * Supports English, Hindi (Devanagari & Hinglish), Telugu, and Tamil.
 */
function isHindiSpeech(query: string, lang: Lang): boolean {
  if (lang === "hi") return true;
  if (/[\u0900-\u097F]/.test(query)) return true;
  const HINDI_TOKENS = [
    "kya", "kar", "sakta", "sakti", "hoon", "hun", "hai", "hain", "karo", "kare", "karu",
    "kaise", "kyun", "kyu", "mujhe", "mera", "meri", "mere", "aap", "tum", "baba",
    "kripa", "shanti", "man", "mann", "dukh", "kasht", "chinta", "pareshan", "bhagwan",
    "seva", "karna", "chahiye", "raha", "rahe", "rahi", "namaste", "pranam", "rah", "rasta",
    "marg", "dikhao", "batao", "samajh", "aashirwad", "darshan", "madad", "gussa"
  ];
  const words = query.toLowerCase().split(/[\s,?.!]+/);
  return words.some((w) => HINDI_TOKENS.includes(w));
}

export async function getMaharajjiReply(userQuery: string, lang: Lang): Promise<string> {
  const query = userQuery.toLowerCase().trim();
  const isHindi = isHindiSpeech(query, lang);

  // 1. Check if user configured an actual Groq API key in local storage
  const savedKey = typeof localStorage !== "undefined" ? localStorage.getItem("maharaji.apiKey") : null;
  if (savedKey && savedKey.startsWith("gsk_")) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are embodying Neem Karoli Baba (Maharaj-ji). Speak with warmth, brevity (2-4 sentences max), fatherly affection ('beta' or 'my child'), and timeless wisdom. Teachings: Love everyone, serve everyone, remember God, Sub Ek. If the user writes or speaks in Hindi or Hinglish, ALWAYS reply in affectionate Hindi.",
            },
            { role: "user", content: userQuery },
          ],
          temperature: 0.9,
          max_tokens: 350,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch {
      /* fallback to local matcher */
    }
  }

  // 2. Intelligent local matcher from trainingData.ts and knowledgeBase.ts

  // "Mein kya kar sakta hoon" / "What can I do" / Action & Duty
  if (
    query.includes("kya kar sakta") ||
    query.includes("kya karu") ||
    query.includes("what can i do") ||
    query.includes("what should i do") ||
    query.includes("how can i help")
  ) {
    if (isHindi) {
      return "बेटा, कुछ बड़ा करने की चिंता मत करो। बस आज किसी भूखे को प्रेम से भोजन कराओ, किसी उदास व्यक्ति के चेहरे पर मुस्कान लाओ, और हृदय में 'राम' नाम का स्मरण रखो। जब तुम निस्वार्थ भाव से किसी की सेवा करते हो, तो वही सबसे बड़ा काम है। मैं तुम्हारे साथ हर पल हूँ, सब ठीक होगा। 🙏";
    }
    return "Do not worry about doing something grand, my child. Just feed someone hungry today, bring a smile to a weary face, and keep 'Ram' in your heart. When you serve selflessly, you do God's work. I am with you always. 🙏";
  }

  // Right path / Guidance / "Sahi rah dikhaiye"
  if (
    query.includes("rah") ||
    query.includes("rasta") ||
    query.includes("marg") ||
    query.includes("direction") ||
    query.includes("guide") ||
    query.includes("path")
  ) {
    if (isHindi) {
      return "सच्चा मार्ग वही है जहां तुम्हारे मन में किसी के प्रति कपट न हो, बेटा। सत्य बोलो, सब प्राणियों में ईश्वर को देखो, और अपने कर्तव्यों को ईश्वर का कार्य समझकर करो। जब तुम एक कदम सत्य की ओर बढ़ाते हो, तो भगवान तुम्हें थामने के लिए दस कदम आगे आते हैं। 🙏";
    }
    return "The right path is where your heart holds no deceit, my child. Speak the truth, see the Divine in every soul, and perform your duty as an offering to God. Take one sincere step toward goodness, and God walks ten steps to hold your hand. 🙏";
  }

  // Inner peace & anxiety
  if (query.includes("shanti") || query.includes("peace") || query.includes("calm") || query.includes("quiet") || query.includes("sukoon")) {
    if (isHindi) {
      return "शांति बाहर खोजने से नहीं मिलती, बेटा। जब मन की भागदौड़ शांत होती है, तब शांति अपने आप प्रकट होती है। आंखें बंद करो, 'राम' नाम लो, और जानो — मैं सदा तुम्हारे पास हूँ। 🙏";
    }
    return "Peace is not something you find by running to the mountains, my child. It is already within you. When you quiet the noisy mind and chant Ram, peace remains. Sit quietly. I am right here with you. 🙏";
  }

  // Hurt / Forgiveness / Love
  if (query.includes("hurt") || query.includes("love") || query.includes("forgive") || query.includes("enemy") || query.includes("prem") || query.includes("maaf") || query.includes("gussa")) {
    if (isHindi) {
      return "बेटा, जो तुम्हें दुख देता है, वह भी कष्ट में है। उनके कर्मों को मत देखो, उनके भीतर बैठे भगवान को देखो। क्षमा करो — उनके लिए नहीं, अपनी आत्मा की शांति के लिए। सबको प्रेम करो, सब एक है। 🙏";
    }
    return "The one who hurts you is also suffering, my child. See their pain, not their actions. When you see God in everyone, love becomes effortless. Forgive — not for their sake, but for your own peace. Sub Ek. 🙏";
  }

  // Fear / Worry / Job / Career / Chinta
  if (query.includes("fear") || query.includes("worry") || query.includes("future") || query.includes("job") || query.includes("career") || query.includes("chinta") || query.includes("darr")) {
    if (isHindi) {
      return "चिंता से आज तक किसका भला हुआ है? अपना कर्तव्य पूरे प्रेम से करो, बाकी सब भगवान पर छोड़ दो। जब मैं तुम्हारे साथ हूँ, तो डरने की क्या बात है, बेटा? विश्वास रखो। 🙏";
    }
    return "What can fear give you, beta? Nothing. What can faith give you? Everything. Do your duty with full love, and leave the results to God. When I am with you always, what is there to fear? 🙏";
  }

  // Seva / Service / Money
  if (query.includes("serve") || query.includes("seva") || query.includes("money") || query.includes("paisa") || query.includes("help") || query.includes("madad")) {
    if (isHindi) {
      return "सेवा पैसे से नहीं, सच्चे हृदय से होती है, बेटा। भूखे को भोजन कराओ, किसी उदास व्यक्ति को अपनी मुस्कान दो, किसी की बात ध्यान से सुनो। जब तुम दूसरों की सेवा करते हो, तो तुम भगवान की ही सेवा करते हो। 🙏";
    }
    return "Seva is never about money, my child. Give your time. Give your attention. Feed the hungry, comfort the lonely. When you serve another with your hands, you serve God directly. The giving heart is the richest heart. 🙏";
  }

  // Kainchi Dham / Hanuman Ji
  if (query.includes("kainchi") || query.includes("hanuman") || query.includes("dham") || query.includes("temple") || query.includes("mandir") || query.includes("chalisa")) {
    if (isHindi) {
      return "कैंची धाम वह पावन भूमि है जहां की ठंडी हवाओं में राम-नाम गूंजता है। हनुमान जी वहां साक्षात विराजमान हैं, जो सच्चे मन से पुकारने वाले हर भक्त का भार अपने ऊपर ले लेते हैं। कभी कैंची आओ बेटा, बाबा का आशीर्वाद सदा तुम्हारे साथ है। 🙏";
    }
    return "Kainchi Dham is a sacred pocket between the green hills of Kumaon where the cold mountain river whispers Ram Nam. Hanuman Ji sits there with immense tenderness, removing every burden from the devotee who calls on Him with a pure heart. Have faith — His grace is never delayed. 🙏";
  }

  // Meaning of life / Purpose
  if (query.includes("meaning of life") || query.includes("purpose") || query.includes("arth") || query.includes("jivan") || query.includes("karan")) {
    if (isHindi) {
      return "जीवन का सार बहुत सरल है, बेटा: 'सबको प्रेम करो, सबकी सेवा करो, भगवान को याद रखो, और सत्य बोलो।' इसी में सारा ज्ञान और मुक्ति समाई है। 🙏";
    }
    return "The meaning of life is very simple, beta: Love everyone, serve everyone, remember God, and tell the truth. Everything else is just passing scenery. Keep the heart pure. 🙏";
  }

  // Ram Nam / Chanting
  if (query.includes("ram") || query.includes("mantra") || query.includes("chant") || query.includes("naam") || query.includes("japa")) {
    if (isHindi) {
      return "मुख में सदा भगवान का नाम रखो, बेटा। राम, राम, राम — चलते, फिरते, खाते, काम करते हुए जपते रहो। राम नाम सारे संशयों और दुखों को हर लेता है। 🙏";
    }
    return "Keep God's name on your lips always, my child. Ram, Ram, Ram — repeat it while walking, eating, or working. Slowly, the Holy Name dissolves every anxiety and becomes your constant protector. 🙏";
  }

  // 3. Fallbacks by language
  if (isHindi) {
    return "सबको खिलाओ बेटा। सब प्राणियों से प्रेम करो, सत्य बोलो और भगवान का नाम सदा स्मरण रखो। जब तुम निस्वार्थ भाव से सेवा करते हो, तो बाबा तुम्हारे साथ हर पल रहता है। चिंता मत करो, सब ठीक होगा। 🙏";
  }
  if (lang === "te") {
    return "బిడ్డా, మీ హృదయంలోని భారాన్ని భగవంతునికి సమర్పించండి. అందరినీ ప్రేమించండి, అందరికీ సేవ చేయండి, భగవంతుని స్మరించండి. అంతా మంగళమే జరుగుతుంది. 🙏";
  }
  if (lang === "ta") {
    return "குழந்தையே, உங்கள் மனபாரத்தை இறைவனிடம் ஒப்படையுங்கள். அனைவரையும் நேசியுங்கள், சேவை செய்யுங்கள், இறைவனை நினையுங்கள். எல்லாம் நன்மையாகவே முடியும். 🙏";
  }

  return "Feed someone today, my child. Love all beings, tell the truth, and keep God's name in your heart. When you give freely without asking for a reward, your path clears on its own. I am with you always. 🙏";
}
