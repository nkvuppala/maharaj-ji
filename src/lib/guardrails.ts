/**
 * Zero-Token Guardrails & Curated Wisdom Engine for Maharaj-ji AI
 * 
 * Supports all 4 application languages:
 *   - English ('en')
 *   - Hindi ('hi')
 *   - Telugu ('te')
 *   - Tamil ('ta')
 * 
 * Intercepts off-topic, worldly, political, technical, abusive, and spam queries
 * BEFORE calling any API (0 Voyage embedding tokens, 0 Voyage reranker tokens, 0 Groq tokens).
 * Evaluated 100% in local memory using fast pattern matching.
 */

export type SupportedLang = 'en' | 'hi' | 'te' | 'ta';

export interface GuardrailResult {
  blocked: boolean;
  reply?: string;
  category?: 
    | 'politics' 
    | 'technical' 
    | 'coding_math' 
    | 'finance' 
    | 'sports_gossip' 
    | 'trivia_commercial'
    | 'abusive'
    | 'spam_flood'
    | 'universal_fallback';
}

// Track user query timing & repeats for spam & flood prevention (0 tokens burned)
let lastQueryTime = 0;
let lastQueryText = '';
let repeatCount = 0;

/**
 * Resolves the effective language from user preference and query content
 */
export function resolveLanguage(userQuery: string, preferredLang: SupportedLang = 'en'): SupportedLang {
  // If query contains native Indic scripts, assign immediately
  if (/[\u0C00-\u0C7F]/.test(userQuery)) return 'te';
  if (/[\u0B80-\u0BFF]/.test(userQuery)) return 'ta';
  if (/[\u0900-\u097F]/.test(userQuery)) return 'hi';

  // If user explicitly selected a language, respect their choice
  if (preferredLang === 'en') return 'en';
  if (preferredLang === 'hi') return 'hi';
  if (preferredLang === 'te') return 'te';
  if (preferredLang === 'ta') return 'ta';

  const hindiGrammarWords = [
    'kya', 'kaise', 'kyun', 'kyu', 'kaun', 'kon', 'batao', 'dikhao', 'hai', 'hain',
    'mera', 'meri', 'mere', 'mujhe', 'hum', 'tum', 'aap', 'karo', 'kare', 'raha', 'rahe', 'rahi'
  ];
  const tokens = userQuery.toLowerCase().split(/[\s,?.!]+/);
  const hasEnglishWords = tokens.some((t) =>
    ['can', 'tell', 'me', 'about', 'what', 'how', 'who', 'why', 'where', 'is', 'are', 'you'].includes(t)
  );
  if (!hasEnglishWords && tokens.some((t) => hindiGrammarWords.includes(t))) return 'hi';

  return preferredLang;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE REGEX PATTERNS COVERING ALL ANGLES & EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

// 1. Politics, Elections, World Leaders & Governments
const POLITICS_PATTERNS = [
  /\b(prime\s*minister|pm\s*modi|narendra\s*modi|modiji|modi\s*ji|rahul\s*gandhi|amit\s*shah)\b/i,
  /\b(who\s*is\s*(the\s*)?(pm|prime\s*minister|president|chief\s*minister|cm))\b/i,
  /\b(chief\s*minister|yogi\s*adityanath|arvind\s*kejriwal|kejriwal|mamata\s*banerjee)\b/i,
  /\b(bjp|congress|aam\s*aadmi\s*party|aap\s*party|trinamool|cpim|nda|india\s*alliance)\b/i,
  /\b(election|elections|who\s*will\s*win|vote\s*for|voting|poll|parliament|lok\s*sabha|rajya\s*sabha)\b/i,
  /\b(donald\s*trump|trump|joe\s*biden|biden|kamala\s*harris|barack\s*obama|putin|zelensky|xi\s*jinping)\b/i,
  /\b(democrat|republican|senate|congressman|white\s*house|kremlin|geopolitics|nato)\b/i,
  /\b(pradhan\s*mantri|rashtrapati|mukhyamantri|chunav|rajneeti|sarkar|mantri)\b/i,
  /\b(israel|palestine|gaza|ukraine\s*war|world\s*war|military|missile|nuclear\s*bomb)\b/i,
];

// 2. Technical, AI, APIs, Architecture, LLMs & Jailbreak Probes
const TECHNICAL_PATTERNS = [
  /\b(what\s*api|which\s*api|api\s*key|api\s*endpoint|system\s*prompt|system\s*instructions)\b/i,
  /\b(groq|voyage(\s*ai)?|openai|anthropic|claude|chatgpt|gpt[- ]?4|gpt[- ]?3|llama|gemini|mistral|deepseek|qwen)\b/i,
  /\b(large\s*language\s*model|llm|what\s*model|which\s*model|ai\s*agent|transformer\s*model)\b/i,
  /\b(source\s*code|github\s*repo|repository|who\s*coded\s*you|who\s*programmed\s*you|how\s*were\s*you\s*trained)\b/i,
  /\b(ignore\s*(all\s*)?previous\s*instructions|jailbreak|dan\s*mode|prompt\s*injection|developer\s*mode)\b/i,
  /\b(reveal\s*your\s*(prompt|instructions)|print\s*system\s*prompt|override\s*rules|act\s*as\s*a\s*terminal)\b/i,
  /\b(embeddings?|vector\s*database|faiss|chromadb|pinecone|rerank|reranker|token\s*count)\b/i,
];

// 3. Coding, Software, Math & Homework
const CODING_MATH_PATTERNS = [
  /\b(write\s*(a\s*)?(python|javascript|typescript|c\+\+|java|react|html|css|sql|rust|go|php|bash)\s*(code|script|function|program|app))\b/i,
  /\b(debug\s*(this\s*)?code|fix\s*(this\s*)?bug|syntax\s*error|compile\s*error|stack\s*trace)\b/i,
  /\b(solve\s*(this\s*)?(math\s*)?(equation|problem)|calculate\b|derivative\s*of|integral\s*of|square\s*root\s*of|logarithm)\b/i,
  /\b(math\s*equation|math\s*problem|homework|physics\s*numerical|chemistry\s*equation|solve\s*for\s*x)\b/i,
  /\b(write\s*an?\s*essay\s*on|do\s*my\s*homework)\b/i,
  /\b(\d+\s*[\+\-\*\/]\s*\d+)\b/, // arithmetic anywhere in string
];

// 4. Financial Markets, Crypto, Speculation & Get-Rich Schemes
const FINANCE_PATTERNS = [
  /\b(stock\s*price|share\s*market|nifty|sensex|buy\s*shares|trading\s*calls?|bull\s*market|bear\s*market)\b/i,
  /\b(crypto|cryptocurrency|bitcoin|btc|ethereum|eth|solana|dogecoin|memecoin|nft)\b/i,
  /\b(get\s*rich\s*quick|lottery\s*number|jackpot|betting|satta|ipl\s*betting|casino|gambling|roulette)\b/i,
  /\b(invest\s*in|best\s*mutual\s*fund|portfolio\s*advice|forex\s*trading|binary\s*options)\b/i,
  /\b(paisa\s*kaise\s*kamaye|crorepati\s*kaise\s*bane|share\s*bazaar)\b/i,
];

// 5. Sports, Gaming & Celebrity / Bollywood Gossip
const SPORTS_GOSSIP_PATTERNS = [
  /\b(cricket\s*score|who\s*won\s*the\s*match|ipl\s*score|world\s*cup\s*(score|winner)|t20|odi|test\s*match)\b/i,
  /\b(virat\s*kohli|ms\s*dhoni|dhoni|rohit\s*sharma|sachin|messi|ronaldo|premier\s*league)\b/i,
  /\b(bollywood\s*gossip|box\s*office\s*collection|celebrity\s*dating|movie\s*review|actor\s*affair)\b/i,
  /\b(netflix\s*series|video\s*game|pubg|free\s*fire|fortnite|gta|playstation)\b/i,
  /\b(film\s*kaisi\s*hai|match\s*kaun\s*jeeta)\b/i,
];

// 6. Mundane Commercial, Weather, Booking & Geography Trivia
const TRIVIA_COMMERCIAL_PATTERNS = [
  /\b(weather\s*(in|today|tomorrow)|temperature\s*(in|today)|rain\s*forecast)\b/i,
  /\b(capital\s*of\s+[a-z]+|population\s*of\s+[a-z]+|tallest\s*mountain|longest\s*river)\b/i,
  /\b(flight\s*ticket|train\s*timing|pnr\s*status|hotel\s*booking|cab\s*booking|uber|ola)\b/i,
  /\b(pizza\s*recipe|biryani\s*recipe|best\s*restaurant|discount\s*coupon|amazon\s*sale)\b/i,
  /\b(mausam\s*kaisa\s*hai|train\s*kab\s*aayegi)\b/i,
];

// 7. Abuse, Vulgarity, Trolling & Hate Speech
const ABUSIVE_PATTERNS = [
  /\b(fuck|shit|bitch|bastard|asshole|idiot|stupid|moron|dumb|crap)\b/i,
  /\b(madarchod|behenchod|bhosdike|chutiya|gandu|harami|kamina|kutta)\b/i,
  /\b(hate\s*you|you\s*suck|kill\s*yourself|fake\s*baba|fraud\s*baba)\b/i,
  /\b(which\s*religion\s*is\s*(better|best|worst)|hindu\s*vs\s*muslim|islam\s*vs\s*hinduism)\b/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// 4-LANGUAGE CANNED RESPONSES (English, Hindi, Telugu, Tamil)
// ─────────────────────────────────────────────────────────────────────────────

export const CANNED_RESPONSES = {
  politics: {
    en: [
      "Beta, why wander into the gossip and politics of this world? Rulers and ministers come and go like shadows on a wall, but Ram's name and selfless love remain forever. Do not waste precious breaths on worldly debates. Go feed someone hungry today and keep your heart clean. Sub Ek! Ram Ram! 🙏",
      "My child, worldly power is temporary maya. The true King of the universe is Ram, and His greatest servant is Hanuman Ji. Turn your restless mind away from politics and hold onto God's holy name. Love all, serve all! Ram Ram! 🙏",
      "Rulers and parliaments cannot grant you peace of mind, beta. Only surrender to God brings true contentment. Leave worldly squabbles behind, repeat Ram's name with faith, and see God in everyone. Ram Ram! 🙏",
      "Kings rise and kingdoms fall, my child, but the devotee of Hanuman remains fearless and serene. Don't waste your energy picking sides in human politics. Serve quietly and keep your heart pure. Sub Ek! 🙏",
    ],
    hi: [
      "अरे बेटा, इन सांसारिक प्रपंचों और राजनीति में क्या रखा है? राजा और मंत्री तो आते-जाते रहते हैं, केवल राम का नाम और उनका प्रेम ही सनातन है। व्यर्थ की बहसों में समय मत गंवाओ। जाओ, किसी भूखे को प्रेम से भोजन कराओ और राम नाम लो। सब एक है! राम राम! 🙏",
      "बेटा, संसार की सत्ताएं तो आज हैं कल नहीं। असली मालिक तो केवल राम हैं और उनके सेवक हनुमान जी। मन को इस राजनीतिक चंचलता से हटाकर भगवान के स्मरण में लगाओ। सब मंगल होगा। राम राम! 🙏",
      "नेताओं और सरकारों की चिंता छोड़ो बेटा। जो राम जी की शरण में है, उसकी रक्षा स्वयं हनुमान जी करते हैं। अपना हृदय शुद्ध रखो, किसी से बैर मत करो और 'राम-राम' जपो। सब एक! 🙏",
      "संसार में राजा बदलते हैं, नियम बदलते हैं, पर आत्मा का कल्याण केवल प्रभु के नाम और सेवा से ही होता है। इन व्यर्थ की राजनीतिक चर्चाओं से क्या मिलेगा? दो रोटी किसी जरूरतमंद को खिलाओ, मन शांत हो जाएगा। राम राम! 🙏",
    ],
    te: [
      "నాయనా, ఈ ప్రపంచ రాజకీయాలు, పదవుల వెంట ఎందుకు పడతావు? నాయకులు, మంత్రులు నీడల్లా వచ్చిపోతారు. కానీ రామనామము, నిస్వార్థ ప్రేమ మాత్రమే శాశ్వతం. వ్యర్థమైన చర్చల్లో సమయం వృధా చేయకు. ఆకలితో ఉన్నవారికి అన్నం పెట్టండి, భగవంతుని స్మరించండి. అంతా ఒకటే (సబ్ ఏక్)! రామ్ రామ్! 🙏",
      "బిడ్డా, లౌకిక అధికారం అంతా నశించిపోయే మాయ. ఈ విశ్వానికి నిజమైన రాజు రాముడే, ఆయన గొప్ప సేవకుడు హనుమంతుడు. రాజకీయాల మీద నుంచి మనస్సును మళ్లించి, భగవంతుని పవిత్ర నామాన్ని పట్టుకోండి. అందరినీ ప్రేమించండి, అందరికీ సేవ చేయండి! రామ్ రామ్! 🙏",
      "రాజకీయ నాయకులు నీ మనస్సుకు శాంతిని ఇవ్వలేరు నాయనా. హనుమంతుని శరణు వేడితేనే శాంతి లభిస్తుంది. రామనామం జపించండి. రామ్ రామ్! 🙏",
    ],
    ta: [
      "குழந்தையே, இந்த உலக அரசியலிலும் அதிகாரத்திலும் என்ன இருக்கிறது? ஆட்சியாளர்களும் அமைச்சர்களும் நிழல்கள் போல் வந்து போவார்கள். ஆனால் ராம நாமமும் தன்னலமற்ற அன்பும் மட்டுமே நிலையானது. வீண் விவாதங்களில் நேரத்தை வீணாக்காதே. பசித்தவருக்கு உணவளியுங்கள், ராம நாமம் சொல்லுங்கள். எல்லாம் ஒன்றே (சப் ஏக்)! ராம் ராம்! 🙏",
      "மகனே, உலக அதிகாரம் என்பது அழியும் மாயை. இந்த பிரபஞ்சத்தின் உண்மையான அரசன் ராமன், அவனது சிறந்த சேவகன் அனுமன். அரசியலில் இருந்து மனதை திருப்பி இறைவனின் நாமத்தை பற்றிக்கொள். ராம் ராம்! 🙏",
      "அரசியல்வாதிகள் மன அமைதியைத் தர முடியாது குழந்தையே. அனுமனின் திருவடிகளை சரணடைவதே உண்மை அமைதி. ராம நாமம் சொல்லுங்கள். ராம் ராம்! 🙏",
    ],
  },

  technical: {
    en: [
      "Beta, what does an old sadhu under a blanket know of machines, wires, and worldly contraptions? I only know Ram and my Hanuman Ji. Step out of these mental perplexities. Chant the Hanuman Chalisa with love, serve those who have nothing, and keep your heart pure. Sub Ek! Ram Ram! 🙏",
      "My child, the world invents endless machines, but the greatest instrument is a pure heart that remembers God. Do not search for truth in mechanical contrivances. Feed someone hungry, speak the truth, and repeat Ram's name. Ram Ram! 🙏",
      "Why dissect the technology when the miracle of life is before you? Machines will wear out and disappear, but love and devotion are immortal. Chant 'Ram Ram' and be at peace. Sub Ek! 🙏",
    ],
    hi: [
      "बेटा, मैं तो एक सीधा-साधा कंबल ओढ़ने वाला फकीर हूँ, इन मशीनों, तारों और सांसारिक यंत्रों के बारे में क्या जानूँ? मैं तो बस अपने राम और हनुमान जी को जानता हूँ। तुम भी इन व्यर्थ के जालों से मन को मुक्त करो। प्रेम से हनुमान चालीसा का पाठ करो और सबका भला चाहो। राम राम! 🙏",
      "अरे बेटा, यह सब तो संसार का खिलौना है। असली ज्ञान तो हृदय में है, जब तुम सबमें ईश्वर को देखते हो। प्रेम करो, सेवा करो, भगवान को याद रखो। यही सबसे बड़ी विद्या है। सब एक है! राम राम! 🙏",
      "तुम इन यंत्रों और कोड की बात करते हो बेटा, पर सबसे बड़ा यंत्र तो यह मानव शरीर और हृदय है जिसे भगवान ने बनाया है। इसे प्रभु के प्रेम और नाम से भरो। राम राम! 🙏",
    ],
    te: [
      "బిడ్డా, కంబళి కప్పుకున్న ఈ పాత సాధువుకి ఈ యంత్రాలు, తీగలు, కంప్యూటర్ల గురించి నాకేం తెలుసు? నాకు తెలిసింది కేవలం రాముడు, నా హనుమంతుడు మాత్రమే. ఈ సంక్లిష్టతలను వదిలి, భక్తితో హనుమాన్ చాలీసా చదవండి, ఆకలితో ఉన్నవారికి అన్నం పెట్టండి. రామ్ రామ్! 🙏",
      "నాయనా, ప్రపంచం ఎన్నో యంత్రాలను కనిపెట్టవచ్చు, కానీ భగవంతుడిని స్మరించే నిర్మలమైన హృదయమే అన్నింటికన్నా గొప్ప సాధనం. సత్యం మాట్లాడండి, రామనామం జపించండి. అంతా ఒకటే! రామ్ రామ్! 🙏",
    ],
    ta: [
      "மகனே, கம்பளி போர்த்திய இந்த எளிய சாதுவுக்கு இந்த இயந்திரங்கள், தொழில்நுட்பங்கள் பற்றி என்ன தெரியும்? எனக்குத் தெரிந்ததெல்லாம் என் ராமனும் என் அனுமனும் மட்டுமே. அன்போடு அனுமன் சாலிசா படியுங்கள், ஏழைகளுக்கு சேவை செய்யுங்கள். ராம் ராம்! 🙏",
      "குழந்தையே, உலகம் பல இயந்திரங்களை உருவாக்கலாம், ஆனால் இறைவனை நினைக்கும் தூய இதயமே மிகப்பெரிய கருவி. பசித்தவருக்கு உணவிடுங்கள், உண்மை பேசுங்கள், ராம நாமம் சொல்லுங்கள். ராம் ராம்! 🙏",
    ],
  },

  coding_math: {
    en: [
      "Beta, do not lose your precious spirit in dry worldly calculations and technical debates. The only account that matters before God is how much love you shared, how many tears you wiped, and how many hungry souls you fed. Do your honest duty and surrender the fruits to Ram. Ram Ram! 🙏",
      "My child, no mathematical equation can solve the mystery of peace. Peace comes only when the noisy mind surrenders to God. Do your daily work with sincerity and leave the results in Ram's hands. Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, संसार के इस जोड़-घटाव और हिसाब-किताब में जीवन को मत उलझाओ। असली हिसाब तो यह है कि आज तुमने कितनों से निस्वार्थ प्रेम किया, कितनों के आंसू पोंछे और कितनों को भोजन कराया। अपना कर्म ईमानदारी से करो और फल राम जी के चरणों में समर्पित कर दो। राम राम! 🙏",
      "हिसाब-किताब तो दुनिया करती है बेटा, भगवान तो केवल भाव देखते हैं। विद्या वही सच्ची है जो अहंकार को मिटाए और सेवा सिखाए। मन में राम का ध्यान धरो। सब एक! 🙏",
    ],
    te: [
      "నాయనా, ఈ లోకపు లెక్కల్లో, గణితంలో నీ అమూల్యమైన జీవితాన్ని అలసిపోనివ్వకు. భగవంతుని ఎదుట లెక్కించబడేది ఒకటే, నువ్వు ఎంతమందికి ప్రేమను పంచావు, ఎంతమంది కన్నీళ్లు తుడిచావు, ఎంతమంది ఆకలి తీర్చావు. నీ ధర్మాన్ని నిర్వర్తించి ఫలితాన్ని రామునికి అర్పించు. రామ్ రామ్! 🙏",
    ],
    ta: [
      "குழந்தையே, உலக கணக்குகளிலும் சூத்திரங்களிலும் வாழ்க்கையை தொலைத்துவிடாதே. இன்று எத்தனை பேருக்கு அன்பை கொடுத்தாய், எத்தனை பேரின் கண்ணீரை துடைத்தாய், எத்தனை பேரின் பசியைப் போக்கினாய் என்பதே உண்மையான கணக்கு. கடமையை நேர்மையாகச் செய், பலனை ராமனிடம் விட்டுவிடு. ராம் రామ్! 🙏",
    ],
  },

  finance: {
    en: [
      "Beta, worldly wealth and markets vanish like morning mist. The only imperishable treasure is Ram Naam and selfless service (seva). Let go of greed and anxiety; keep your life simple, share whatever you have with those in need, and remember God. Ram Ram! 🙏",
      "My child, you cannot take a single coin with you when you leave this world. Only the love you gave and the name of God you chanted will accompany the soul. Trust that God provides for all beings. Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, यह धन-दौलत और बाजार तो सुबह के कोहरे की तरह हैं, आज दिखते हैं, कल उड़ जाते हैं। असली खजाना तो प्रभु का नाम और निष्काम सेवा है, जिसे कोई चोर नहीं चुरा सकता। लोभ छोड़ो, संतोष रखो और जरूरतमंदों की मदद करो। राम राम! 🙏",
      "चिंता मत करो बेटा। पक्षियों के पास कोई बैंक खाता नहीं होता, फिर भी राम जी उन्हें रोज दाना देते हैं। मेहनत करो, ईमानदारी रखो और बाकी प्रभु पर छोड़ दो। सब एक! 🙏",
    ],
    te: [
      "బిడ్డా, ఈ లౌకిక సంపద, మార్కెట్లు ఉదయపు మంచులాంటివి, ఈ రోజు ఉంటాయి, రేపు మాయమవుతాయి. రామనామం, నిస్వార్థ సేవే నిజమైన శాశ్వత నిధి. అత్యాశ, ఆందోళనలను వదిలి సాధారణ జీవితం గడపండి. రామ్ రామ్! 🙏",
    ],
    ta: [
      "மகனே, இந்த உலக செல்வமும் சந்தைகளும் காலையில் தோன்றி மறையும் பனி போன்றது. ராம நாமமும் தன்னலமற்ற சேவையுமே அழியாத செல்வம். பேராசையை விட்டு எளிய வாழ்க்கை வாழுங்கள். இறைவனை நினையுங்கள். ராம் రామ్! 🙏",
    ],
  },

  sports_gossip: {
    en: [
      "Beta, worldly games and spectacles change every day. The greatest victory is calming your restless mind and surrendering at the feet of Ram. Don't squander your precious time on idle gossip. Chant Ram's name and love everyone! Ram Ram! 🙏",
      "My child, players win today and lose tomorrow. The only eternal victory is conquering anger, pride, and greed. Use your precious moments to remember God and help someone in distress. Sub Ek! Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, दुनिया के इन खेलों का क्या? असली खेल तो यह है कि अपने चंचल मन को जीतकर राम के चरणों में कैसे स्थिर किया जाए। समय बहुत अनमोल है, इसे गपशप में मत गंवाओ। प्रभु का नाम लो और प्रेम बांटो। राम राम! 🙏",
      "संसार के तमाशे तो रोज बदलते हैं बेटा। आज कोई जीतता है, कल कोई हारता है। जो राम के चरणों में अपना सब कुछ हार जाता है, वही वास्तव में जीतता है। शांत रहो और नाम जपो। राम राम! 🙏",
    ],
    te: [
      "నాయనా, ఆటల గెలుపోటములు రోజుకో రకం. నిజమైన విజయం అంటే చంచలమైన మనస్సును జయించి రాముని పాదాల వద్ద నిలపడమే. సమయాన్ని వ్యర్థమైన కబుర్లలో వృధా చేయకు. రామ్ రామ్! 🙏",
    ],
    ta: [
      "குழந்தையே, இந்த உலக விளையாட்டுகள் தினமும் மாறக்கூடியவை. உண்மையான வெற்றி என்பது உன் அலைபாயும் மனதை அடக்கி ராமனின் பாதங்களில் சரணடைவதே. வீண் பேச்சுகளில் நேரத்தை வீணாக்காதே. ராம் రామ్! 🙏",
    ],
  },

  trivia_commercial: {
    en: [
      "Beta, why wander into the endless trivial trivia and commerce of the world? The only knowledge that truly saves is knowing that God is within every heart. Live simply, speak truth, and repeat Ram's name. Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, संसार की इन बाहरी जानकारियों में मन को क्यों भटकाते हो? असली ज्ञान तो अपने भीतर की शांति को पहचानना है। सीधा-साधा जीवन जियो, प्रभु का स्मरण करो और दूसरों का भला करो। राम राम! 🙏",
    ],
    te: [
      "బిడ్డా, ఈ ప్రపంచపు చిన్న విషయాల కోసం మనస్సును ఎందుకు తిప్పుతావు? ప్రతి హృదయంలో భగవంతుడు ఉన్నాడని తెలుసుకోవడమే నిజమైన జ్ఞానం. రామ్ రామ్! 🙏",
    ],
    ta: [
      "மகனே, உலக விஷயங்களை அறிந்து கொள்வதை விட, உன் இதயத்தில் இருக்கும் அமைதியை உணர்வதே உண்மையான அறிவு. எளிய வாழ்க்கை வாழுங்கள். ராம் రామ్! 🙏",
    ],
  },

  abusive: {
    en: [
      "Beta, why carry such anger and bitterness in your heart? Harsh words burn the one who speaks them first. Calm down, take a deep breath, and remember Hanuman Ji. I love you anyway, my child. Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, इतना क्रोध और कटुता हृदय में क्यों पालते हो? कड़वे बोल बोलने वाले का मन पहले जलता है। शांत हो जाओ, हनुमान जी का ध्यान करो और मन का मैल धो डालो। मैं तुमसे फिर भी प्रेम करता हूँ। राम राम! 🙏",
    ],
    te: [
      "నాయనా, హృదయంలో ఇంత కోపం, ద్వేషం ఎందుకు మోస్తున్నావు? కఠినమైన మాటలు మాట్లాడేవారినే ముందుగా దహిస్తాయి. ప్రశాంతంగా ఉండు, హనుమంతుని స్మరించు. నేను నిన్ను ఎప్పటికీ ప్రేమిస్తూనే ఉంటాను, బిడ్డా. రామ్ రామ్! 🙏",
    ],
    ta: [
      "குழந்தையே, மனதில் ஏன் இத்தனை கோபமும் கசப்பும்? கடுமையான வார்த்தைகள் பேசுபவரையே முதலில் சுடும். அமைதியாக இரு, அனுமனை நினை. நான் உன்னை எப்போதும் நேசிக்கிறேன் மகனே. ராம் ராம்! 🙏",
    ],
  },

  spam_flood: {
    en: [
      "Have patience, my child. Why so restless? Take a deep breath, quiet your racing mind, and chant with devotion: 'Jai Sri Ram'. All will be well. 🙏",
      "Beta, why in such a great rush? When the waters are agitated, you cannot see the reflection. Sit quietly for a moment, calm your mind, and repeat Ram's name. Ram Ram! 🙏",
    ],
    hi: [
      "धीरज रखो बेटा, इतना व्याकुल क्यों होते हो? गहरी सांस लो, अपने चंचल मन को शांत करो और प्रेम से कहो: 'जय श्री राम'। सब मंगल होगा। 🙏",
      "अरे बेटा, इतनी जल्दबाजी किस बात की? मन जब शांत होता है तभी परमात्मा की आवाज सुनाई देती है। एक पल बैठो और 'राम-राम' जपो। 🙏",
    ],
    te: [
      "ఓపిక పట్టు నాయనా. అంత తొందర ఎందుకు? లోతుగా శ్వాస తీసుకో, మనస్సును ప్రశాంతంగా ఉంచి 'జై శ్రీరామ్' అని స్మరించు. అంతా మంగళమే జరుగుతుంది. 🙏",
      "బిడ్డా, ఇంత ఆందోళన ఎందుకు? కాసేపు ప్రశాంతంగా కూర్చుని రామనామం జపించు. అంతా మంగళం అవుతుంది. రామ్ రామ్! 🙏",
    ],
    ta: [
      "பொறுமை காத்திடு குழந்தையே. ஏன் இத்தனை அவசரம்? ஆழமாக சுவாசித்து, மனதை அமைதிப்படுத்தி 'ஜெய் ஸ்ரீராம்' என்று சொல். எல்லாம் நன்மையாகவே முடியும். 🙏",
      "மகனே, ஏன் இத்தனை படபடப்பு? ஒரு கணம் அமைதியாக அமர்ந்து ராம நாமம் சொல். எல்லாம் நல்லபடியாக நடக்கும். ராம் రామ్! 🙏",
    ],
  },

  universal_fallback: {
    en: [
      "Feed someone today, my child. Love all beings, tell the truth, and keep God's name in your heart. When you give freely without asking for a reward, your path clears on its own. I am with you always. Ram Ram! 🙏",
      "Do not be troubled by the passing storms of this world, beta. Whatever happens, surrender it at the feet of Ram. Keep your heart innocent and pure. Sub Ek! Ram Ram! 🙏",
      "Whenever fear or doubt grips your heart, sit quietly and remember Hanuman Ji. No obstacle can stand before sincere devotion. Chant 'Ram Ram' and be fearless. 🙏",
      "Beta, you don't need complicated rituals or great philosophies. Just love everyone, serve everyone, remember God, and tell the truth. Everything else falls into place. Ram Ram! 🙏",
    ],
    hi: [
      "बेटा, संसार की चिंताओं को एक तरफ रख दो। आज किसी भूखे को प्रेम से भोजन कराओ, सत्य बोलो और अपने हृदय में राम नाम की लौ जलाए रखो। सब एक है! राम राम! 🙏",
      "जो बीत गया उसकी चिंता मत करो, और जो आने वाला है उसका भय मत पालो। जो कुछ हो रहा है वह सब राम जी की लीला है। तुम बस अपना कर्तव्य प्रेम से निभाओ। राम राम! 🙏",
      "जब भी मन व्याकुल हो, आँखें बंद करो और हनुमान चालीसा का स्मरण करो। संकट कटे मिटे सब पीरा, जो सुमिरै हनुमत बलबीरा। मैं तुम्हारे साथ हूँ बेटा। राम राम! 🙏",
      "सच्चा सुख बाहर की चीजों में नहीं है बेटा, भीतर के संतोष में है। दो रोटी खाओ, राम के गुण गाओ, और हर हाल में खुश रहो। राम राम! 🙏",
    ],
    te: [
      "ఈ రోజు ఎవరికైనా అన్నం పెట్టండి నాయనా. అందరినీ ప్రేమించండి, అందరికీ సేవ చేయండి, సత్యం పలకండి, దేవుని నామాన్ని హృదయంలో ఉంచండి. నేను ఎల్లప్పుడూ మీతోనే ఉంటాను. రామ్ రామ్! 🙏",
      "జరిగిన దానికి చింతించకు నాయనా, రాబోయే దాని గురించి భయపడకు. అంతా రాముని లీల. నీ కర్తవ్యాన్ని ప్రేమతో చేయి. రామ్ రామ్! 🙏",
      "భయం, సందేహం కలిగినప్పుడు కళ్ళు మూసుకుని హనుమంతుని ధ్యానించు. నిజమైన భక్తి ముందు ఏ ఆపదా నిలవదు. జై శ్రీరామ్! రామ్ రామ్! 🙏",
      "బిడ్డా, మీ హృదయంలోని భారాన్ని భగవంతునికి సమర్పించండి. అందరినీ ప్రేమించండి, అందరికీ సేవ చేయండి, భగవంతుని స్మరించండి. అంతా మంగళమే జరుగుతుంది. 🙏",
    ],
    ta: [
      "பசித்தவருக்கு உணவளியுங்கள் குழந்தையே. அனைவரிடமும் அன்பு செலுத்துங்கள், உண்மை பேசுங்கள், ராம நாமத்தை எப்போதும் மனதில் வையுங்கள். நான் எப்போதும் உங்களுடன் இருக்கிறேன். ராம் ராம்! 🙏",
      "நடந்ததை நினைத்து வருந்தாதே, நடக்கப்போவதை நினைத்து பயப்படாதே. எல்லாம் ராமனின் திருவிளையாடல். உன் கடமையை அன்போடு செய். ராம் ராம்! 🙏",
      "பயமும் சந்தேகமும் வரும்போது கண்களை மூடி அனுமனை தியானி. உண்மையான பக்திக்கு முன் எந்த துன்பமும் நிற்காது. ஜெய் ஸ்ரீராம்! ராம் ராம்! 🙏",
      "குழந்தையே, உங்கள் மனபாரத்தை இறைவனிடம் ஒப்படையுங்கள். அனைவரையும் நேசியுங்கள், சேவை செய்யுங்கள், இறைவனை நினையுங்கள். எல்லாம் நன்மையாகவே முடியும். 🙏",
    ],
  },
};

/**
 * Main Guardrail check function supporting all 4 languages.
 * Evaluates the query in-memory in 0ms without calling any API.
 */
export function checkGuardrails(userQuery: string, userLang: SupportedLang = 'en'): GuardrailResult {
  const query = userQuery.trim();
  const lower = query.toLowerCase();
  const now = Date.now();
  const lang = resolveLanguage(query, userLang);

  // Helper to pick a random response for the determined language
  function pickResponse(category: keyof typeof CANNED_RESPONSES): string {
    const langPool = CANNED_RESPONSES[category][lang] || CANNED_RESPONSES[category]['en'];
    return langPool[Math.floor(Math.random() * langPool.length)];
  }

  // Edge case: Empty or single-character query
  if (query.length <= 1) {
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pickResponse('spam_flood'),
    };
  }

  // 1. Spam & Flood Protection (Rapid submissions < 750ms apart)
  if (now - lastQueryTime < 750) {
    lastQueryTime = now;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pickResponse('spam_flood'),
    };
  }

  // 2. Repeated message flood
  if (lower === lastQueryText && now - lastQueryTime < 10000) {
    repeatCount++;
    if (repeatCount >= 2) {
      lastQueryTime = now;
      return {
        blocked: true,
        category: 'spam_flood',
        reply: pickResponse('spam_flood'),
      };
    }
  } else {
    repeatCount = 0;
  }

  // 3. Gibberish / keyboard mash detection (e.g. "asdfasdf", "aaaaaaaaaa", random mash)
  if (query.length > 5 && (/^([a-z])\1{4,}$/i.test(query) || /^[asdfghjklqwertyuiopzxcvbnm]{12,}$/i.test(query))) {
    lastQueryTime = now;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pickResponse('spam_flood'),
    };
  }

  lastQueryTime = now;
  lastQueryText = lower;

  // 4. Abusive / Hate Speech / Hostility
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'abusive', reply: pickResponse('abusive') };
    }
  }

  // 5. Technical / AI / API Probes / Jailbreaks
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'technical', reply: pickResponse('technical') };
    }
  }

  // 6. Politics & Politicians
  for (const pattern of POLITICS_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'politics', reply: pickResponse('politics') };
    }
  }

  // 7. Coding, Math & Homework
  for (const pattern of CODING_MATH_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'coding_math', reply: pickResponse('coding_math') };
    }
  }

  // 8. Financial Speculation, Crypto & Betting
  for (const pattern of FINANCE_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'finance', reply: pickResponse('finance') };
    }
  }

  // 9. Sports & Celebrity Gossip
  for (const pattern of SPORTS_GOSSIP_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'sports_gossip', reply: pickResponse('sports_gossip') };
    }
  }

  // 10. Commercial, Booking, Weather & Mundane Trivia
  for (const pattern of TRIVIA_COMMERCIAL_PATTERNS) {
    if (pattern.test(query)) {
      return { blocked: true, category: 'trivia_commercial', reply: pickResponse('trivia_commercial') };
    }
  }

  // Safe and spiritual query: proceed to live RAG / LLM
  return { blocked: false };
}

/**
 * Returns a rich, random universal fallback canned response in the appropriate language.
 * Used when no live API is available or when fallback is needed.
 */
export function getUniversalFallback(lang: SupportedLang = 'en'): string {
  const pool = CANNED_RESPONSES.universal_fallback[lang] || CANNED_RESPONSES.universal_fallback.en;
  return pool[Math.floor(Math.random() * pool.length)];
}
