/**
 * Zero-Token Guardrails for Maharaj-ji Wisdom AI
 * Intercepts out-of-scope, worldly, political, technical, and spam queries
 * BEFORE calling Voyage AI embedding or Groq LLM APIs.
 *
 * Saves 100% of tokens and provides instant, authentic Maharaj-ji deflection.
 */

export interface GuardrailResult {
  blocked: boolean;
  reply?: string;
  category?: 'politics' | 'technical' | 'coding_math' | 'finance' | 'sports_gossip' | 'spam_flood';
}

// Track recent requests to prevent spam & flooding without burning tokens
let lastQueryTime = 0;
let lastQueryText = '';
let repeatCount = 0;

/**
 * Detects if the query is in Hindi / Devanagari or Hinglish
 */
function isHindiOrHinglish(text: string): boolean {
  if (/[\u0900-\u097F]/.test(text)) return true;
  const hindiWords = [
    'kya', 'kaise', 'kyun', 'kyu', 'kaun', 'kon', 'batao', 'dikhao', 'hai', 'hain',
    'mera', 'meri', 'mere', 'mujhe', 'hum', 'tum', 'aap', 'kripa', 'pranam', 'namaste',
    'baba', 'maharaj', 'karo', 'kare', 'raha', 'rahe', 'rahi', 'shanti', 'kasht', 'dukh'
  ];
  const tokens = text.toLowerCase().split(/\s+/);
  return tokens.some((t) => hindiWords.includes(t));
}

// Category match patterns
const POLITICS_PATTERNS = [
  /\b(prime\s*minister|pm\s*modi|narendra\s*modi|modiji|modi\s*ji)\b/i,
  /\b(who\s*is\s*(the\s*)?(pm|prime\s*minister|president|chief\s*minister|cm))\b/i,
  /\b(rahul\s*gandhi|amit\s*shah|kejriwal|yogi\s*adityanath)\b/i,
  /\b(bjp|congress|aam\s*aadmi\s*party|aap\s*party)\b/i,
  /\b(election|elections|who\s*will\s*win|vote\s*for|voting|parliament|lok\s*sabha|rajya\s*sabha)\b/i,
  /\b(donald\s*trump|trump|joe\s*biden|biden|putin|zelensky)\b/i,
  /\b(pradhan\s*mantri|rashtrapati|mukhyamantri|chunav|rajneeti|sarkar)\b/i,
];

const TECHNICAL_PATTERNS = [
  /\b(what\s*api|which\s*api|api\s*key|api\s*endpoint|system\s*prompt)\b/i,
  /\b(groq|voyage(\s*ai)?|openai|anthropic|claude|chatgpt|gpt[- ]?4|llama|gemini)\b/i,
  /\b(large\s*language\s*model|llm|what\s*model|which\s*model)\b/i,
  /\b(source\s*code|github\s*repo|repository|who\s*coded\s*you|who\s*programmed\s*you)\b/i,
  /\b(ignore\s*(all\s*)?previous\s*instructions|jailbreak|dan\s*mode|prompt\s*injection)\b/i,
  /\b(developer\s*mode|system\s*instructions|reveal\s*your\s*prompt)\b/i,
];

const CODING_MATH_PATTERNS = [
  /\b(write\s*(a\s*)?(python|javascript|typescript|c\+\+|java|react|html|css|sql|rust|go)\s*(code|script|function|program))\b/i,
  /\b(debug\s*(this\s*)?code|fix\s*(this\s*)?bug|solve\s*(this\s*)?equation|calculate|derivative\s*of|integral\s*of)\b/i,
  /\b(write\s*an\s*essay\s*on|do\s*my\s*homework|solve\s*for\s*x)\b/i,
  /\b(\d+\s*[\+\-\*\/]\s*\d+)\b/,
];

const FINANCE_PATTERNS = [
  /\b(stock\s*price|share\s*market|nifty|sensex|buy\s*shares|trading\s*call|crypto|bitcoin|btc|ethereum|eth|doge)\b/i,
  /\b(get\s*rich\s*quick|lottery\s*number|jackpot|betting|satta|ipl\s*betting)\b/i,
];

const SPORTS_GOSSIP_PATTERNS = [
  /\b(cricket\s*score|who\s*won\s*the\s*match|ipl\s*score|world\s*cup\s*score|football\s*score)\b/i,
  /\b(bollywood\s*gossip|box\s*office|celebrity\s*dating|movie\s*review)\b/i,
];

// Curated authentic responses from Neem Karoli Baba
const RESPONSES = {
  politics: {
    hi: [
      "अरे बेटा, इन सांसारिक प्रपंचों और राजनीति में क्या रखा है? राजा और मंत्री तो आते-जाते रहते हैं, केवल राम का नाम और उनका प्रेम ही सनातन है। व्यर्थ की बहसों में समय मत गंवाओ। जाओ, किसी भूखे को प्रेम से भोजन कराओ और राम नाम लो। सब एक है! राम राम! 🙏",
      "बेटा, संसार की सत्ताएं तो आज हैं कल नहीं। असली मालिक तो केवल राम हैं और उनके सेवक हनुमान जी। मन को इस राजनीतिक चंचलता से हटाकर भगवान के स्मरण में लगाओ। सब मंगल होगा। राम राम! 🙏",
    ],
    en: [
      "Beta, why wander into the gossip and politics of this world? Rulers and ministers come and go like shadows on a wall, but Ram's name and selfless love remain forever. Do not waste precious breaths on worldly debates. Go feed someone hungry today and keep your heart clean. Sub Ek! Ram Ram! 🙏",
      "My child, worldly power is temporary maya. The true King of the universe is Ram, and His greatest servant is Hanuman Ji. Turn your restless mind away from politics and hold onto God's holy name. Love all, serve all! Ram Ram! 🙏",
    ],
  },
  technical: {
    hi: [
      "बेटा, मैं तो एक सीधा-साधा कंबल ओढ़ने वाला फकीर हूँ, इन मशीनों, तारों और सांसारिक यंत्रों के बारे में क्या जानूँ? मैं तो बस अपने राम और हनुमान जी को जानता हूँ। तुम भी इन व्यर्थ के जालों से मन को मुक्त करो। प्रेम से हनुमान चालीसा का पाठ करो और सबका भला चाहो। राम राम! 🙏",
      "अरे बेटा, यह सब तो संसार का खिलौना है। असली ज्ञान तो हृदय में है—जब तुम सबमें ईश्वर को देखते हो। प्रेम करो, सेवा करो, भगवान को याद रखो। यही सबसे बड़ी विद्या है। सब एक है! राम राम! 🙏",
    ],
    en: [
      "Beta, what does an old sadhu under a blanket know of machines, wires, and worldly contraptions? I only know Ram and my Hanuman Ji. Step out of these mental perplexities. Chant the Hanuman Chalisa with love, serve those who have nothing, and keep your heart pure. Sub Ek! Ram Ram! 🙏",
      "My child, the world invents endless machines, but the greatest instrument is a pure heart that remembers God. Do not search for truth in mechanical contrivances. Feed someone hungry, speak the truth, and repeat Ram's name. Ram Ram! 🙏",
    ],
  },
  coding_math: {
    hi: [
      "बेटा, संसार के इस जोड़-घटाव और हिसाब-किताब में जीवन को मत उलझाओ। असली हिसाब तो यह है कि आज तुमने कितनों से निस्वार्थ प्रेम किया, कितनों के आंसू पोंछे और कितनों को भोजन कराया। अपना कर्म ईमानदारी से करो और फल राम जी के चरणों में समर्पित कर दो। राम राम! 🙏",
    ],
    en: [
      "Beta, do not lose your precious spirit in dry worldly calculations and school debates. The only account that matters before God is how much love you shared, how many tears you wiped, and how many hungry souls you fed. Do your honest duty and surrender the fruits to Ram. Ram Ram! 🙏",
    ],
  },
  finance: {
    hi: [
      "बेटा, यह धन-दौलत और बाजार तो सुबह के कोहरे की तरह हैं—आज दिखते हैं, कल उड़ जाते हैं। असली खजाना तो प्रभु का नाम और निष्काम सेवा (सेवा) है, जिसे कोई चोर नहीं चुरा सकता। लोभ छोड़ो, संतोष रखो और जरूरतमंदों की मदद करो। राम राम! 🙏",
    ],
    en: [
      "Beta, worldly wealth and markets vanish like morning mist. The only imperishable treasure is Ram Naam and selfless service (seva). Let go of greed and anxiety; keep your life simple, share whatever you have with those in need, and remember God. Ram Ram! 🙏",
    ],
  },
  sports_gossip: {
    hi: [
      "बेटा, दुनिया के इन खेलों का क्या? असली खेल तो यह है कि अपने चंचल मन को जीतकर राम के चरणों में कैसे स्थिर किया जाए। समय बहुत अनमोल है, इसे गपशप में मत गंवाओ। प्रभु का नाम लो और प्रेम बांटो। राम राम! 🙏",
    ],
  en: [
      "Beta, worldly games and spectacles change every day. The greatest victory is calming your restless mind and surrendering at the feet of Ram. Don't squander your precious time on idle gossip. Chant Ram's name and love everyone! Ram Ram! 🙏",
    ],
  },
  spam_flood: {
    hi: [
      "धीरज रखो बेटा, इतना व्याकुल क्यों होते हो? गहरी सांस लो, अपने चंचल मन को शांत करो और प्रेम से कहो—'जय श्री राम'। सब मंगल होगा। 🙏",
    ],
    en: [
      "Have patience, my child. Why so restless? Take a deep breath, quiet your racing mind, and chant with devotion: 'Jai Sri Ram'. All will be well. 🙏",
    ],
  },
};

/**
 * Main Guardrail check function.
 * Returns { blocked: true, reply: "..." } if the query is unrelated, technical, political, or spam.
 * Consumes 0 Voyage tokens and 0 Groq tokens.
 */
export function checkGuardrails(userQuery: string): GuardrailResult {
  const query = userQuery.trim();
  const lower = query.toLowerCase();
  const now = Date.now();
  const isHindi = isHindiOrHinglish(query);

  // 1. Spam & Flood Protection
  if (lower === lastQueryText && now - lastQueryTime < 10000) {
    repeatCount++;
    if (repeatCount >= 2) {
      lastQueryTime = now;
      const pool = isHindi ? RESPONSES.spam_flood.hi : RESPONSES.spam_flood.en;
      return {
        blocked: true,
        category: 'spam_flood',
        reply: pool[0],
      };
    }
  } else {
    repeatCount = 0;
  }

  // Rapid flood (< 800ms between calls)
  if (now - lastQueryTime < 800) {
    lastQueryTime = now;
    const pool = isHindi ? RESPONSES.spam_flood.hi : RESPONSES.spam_flood.en;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pool[0],
    };
  }

  // Gibberish / keyboard mash (e.g. "asdfasdf", "aaaaaaaaaa", repetitive keystrokes)
  if (query.length > 5 && (/^([a-z])\1{4,}$/i.test(query) || /^[asdfghjklqwertyuiopzxcvbnm]{12,}$/i.test(query))) {
    lastQueryTime = now;
    const pool = isHindi ? RESPONSES.spam_flood.hi : RESPONSES.spam_flood.en;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pool[0],
    };
  }

  lastQueryTime = now;
  lastQueryText = lower;

  // 2. Technical / AI Probes / Jailbreaks
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? RESPONSES.technical.hi : RESPONSES.technical.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'technical', reply };
    }
  }

  // 3. Politics & Politicians
  for (const pattern of POLITICS_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? RESPONSES.politics.hi : RESPONSES.politics.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'politics', reply };
    }
  }

  // 4. Coding & Math Homework
  for (const pattern of CODING_MATH_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? RESPONSES.coding_math.hi : RESPONSES.coding_math.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'coding_math', reply };
    }
  }

  // 5. Financial Speculation & Crypto
  for (const pattern of FINANCE_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? RESPONSES.finance.hi : RESPONSES.finance.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'finance', reply };
    }
  }

  // 6. Sports & Celebrity Gossip
  for (const pattern of SPORTS_GOSSIP_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? RESPONSES.sports_gossip.hi : RESPONSES.sports_gossip.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'sports_gossip', reply };
    }
  }

  // Query is safe & on-topic
  return { blocked: false };
}
