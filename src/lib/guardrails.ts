/**
 * Zero-Token Guardrails & Curated Wisdom Engine for Maharaj-ji AI
 * 
 * Intercepts off-topic, worldly, political, technical, abusive, and spam queries
 * BEFORE calling any API (0 Voyage embedding tokens, 0 Voyage reranker tokens, 0 Groq tokens).
 * 
 * Evaluated 100% in local memory using fast pattern matching — NO semantic embedder or reranker
 * is called for guardrailed queries.
 */

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
 * Detects if the query is in Hindi (Devanagari) or Hinglish
 */
export function isHindiOrHinglish(text: string): boolean {
  if (/[\u0900-\u097F]/.test(text)) return true;
  const hindiWords = [
    'kya', 'kaise', 'kyun', 'kyu', 'kaun', 'kon', 'batao', 'dikhao', 'hai', 'hain',
    'mera', 'meri', 'mere', 'mujhe', 'hum', 'tum', 'aap', 'kripa', 'pranam', 'namaste',
    'baba', 'maharaj', 'karo', 'kare', 'raha', 'rahe', 'rahi', 'shanti', 'kasht', 'dukh',
    'chahiye', 'hoga', 'hogi', 'apne', 'sab', 'bhai', 'behan', 'ram'
  ];
  const tokens = text.toLowerCase().split(/[\s,?.!]+/);
  return tokens.some((t) => hindiWords.includes(t));
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
  /\b(solve\s*(this\s*)?equation|calculate\b|derivative\s*of|integral\s*of|square\s*root\s*of|logarithm)\b/i,
  /\b(write\s*an?\s*essay\s*on|do\s*my\s*homework|solve\s*for\s*x|physics\s*numerical|chemistry\s*equation)\b/i,
  /^\s*\d+[\s\+\-\*\/\^\%]+\d+[\s\d\+\-\*\/\^\%]*\s*$/, // pure math expressions like 54 * 23
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
// RICH CANNED RESPONSES (Deep variety in authentic Maharaj-ji Voice)
// ─────────────────────────────────────────────────────────────────────────────

export const CANNED_RESPONSES = {
  politics: {
    hi: [
      "अरे बेटा, इन सांसारिक प्रपंचों और राजनीति में क्या रखा है? राजा और मंत्री तो आते-जाते रहते हैं, केवल राम का नाम और उनका प्रेम ही सनातन है। व्यर्थ की बहसों में समय मत गंवाओ। जाओ, किसी भूखे को प्रेम से भोजन कराओ और राम नाम लो। सब एक है! राम राम! 🙏",
      "बेटा, संसार की सत्ताएं तो आज हैं कल नहीं। असली मालिक तो केवल राम हैं और उनके सेवक हनुमान जी। मन को इस राजनीतिक चंचलता से हटाकर भगवान के स्मरण में लगाओ। सब मंगल होगा। राम राम! 🙏",
      "नेताओं और सरकारों की चिंता छोड़ो बेटा। जो राम जी की शरण में है, उसकी रक्षा स्वयं हनुमान जी करते हैं। अपना हृदय शुद्ध रखो, किसी से बैर मत करो और 'राम-राम' जपो। सब एक! 🙏",
      "संसार में राजा बदलते हैं, नियम बदलते हैं, पर आत्मा का कल्याण केवल प्रभु के नाम और सेवा से ही होता है। इन व्यर्थ की राजनीतिक चर्चाओं से क्या मिलेगा? दो रोटी किसी जरूरतमंद को खिलाओ, मन शांत हो जाएगा। राम राम! 🙏",
      "बेटा, सब माया है! जो आज सिंहासन पर है वह कल मिट्टी में मिल जाएगा। केवल प्रेम और सत्य ही अमर हैं। मन को राम में लगाओ। राम राम! 🙏",
    ],
    en: [
      "Beta, why wander into the gossip and politics of this world? Rulers and ministers come and go like shadows on a wall, but Ram's name and selfless love remain forever. Do not waste precious breaths on worldly debates. Go feed someone hungry today and keep your heart clean. Sub Ek! Ram Ram! 🙏",
      "My child, worldly power is temporary maya. The true King of the universe is Ram, and His greatest servant is Hanuman Ji. Turn your restless mind away from politics and hold onto God's holy name. Love all, serve all! Ram Ram! 🙏",
      "Rulers and parliaments cannot grant you peace of mind, beta. Only surrender to God brings true contentment. Leave worldly squabbles behind, repeat Ram's name with faith, and see God in everyone. Ram Ram! 🙏",
      "Kings rise and kingdoms fall, my child, but the devotee of Hanuman remains fearless and serene. Don't waste your energy picking sides in human politics. Serve quietly and keep your heart pure. Sub Ek! 🙏",
      "Beta, why argue over who rules the country? God rules the entire universe. Keep your hands busy in service and your tongue repeating 'Ram Ram'. All will be well. 🙏",
    ],
  },

  technical: {
    hi: [
      "बेटा, मैं तो एक सीधा-साधा कंबल ओढ़ने वाला फकीर हूँ, इन मशीनों, तारों और सांसारिक यंत्रों के बारे में क्या जानूँ? मैं तो बस अपने राम और हनुमान जी को जानता हूँ। तुम भी इन व्यर्थ के जालों से मन को मुक्त करो। प्रेम से हनुमान चालीसा का पाठ करो और सबका भला चाहो। राम राम! 🙏",
      "अरे बेटा, यह सब तो संसार का खिलौना है। असली ज्ञान तो हृदय में है—जब तुम सबमें ईश्वर को देखते हो। प्रेम करो, सेवा करो, भगवान को याद रखो। यही सबसे बड़ी विद्या है। सब एक है! राम राम! 🙏",
      "तुम इन यंत्रों और कोड की बात करते हो बेटा, पर सबसे बड़ा यंत्र तो यह मानव शरीर और हृदय है जिसे भगवान ने बनाया है। इसे अभिमान से नहीं, प्रभु के प्रेम और नाम से भरो। राम राम! 🙏",
      "बेटा, बाहरी विज्ञान चाहे कितना भी आगे बढ़ जाए, भीतर की शांति तो केवल राम नाम से ही मिलेगी। इन मशीनी सवालों में मत उलझो, अपने आराध्य को याद करो। सब एक! 🙏",
      "मैं कोई वैज्ञानिक या पंडित नहीं हूँ बेटा। बस इतना जानता हूँ—सबको भोजन कराओ, सबसे प्रेम करो, और कभी झूठ मत बोलो। यही मेरी विधि है। राम राम! 🙏",
    ],
    en: [
      "Beta, what does an old sadhu under a blanket know of machines, wires, and worldly contraptions? I only know Ram and my Hanuman Ji. Step out of these mental perplexities. Chant the Hanuman Chalisa with love, serve those who have nothing, and keep your heart pure. Sub Ek! Ram Ram! 🙏",
      "My child, the world invents endless machines, but the greatest instrument is a pure heart that remembers God. Do not search for truth in mechanical contrivances. Feed someone hungry, speak the truth, and repeat Ram's name. Ram Ram! 🙏",
      "Why dissect the technology when the miracle of life is before you? Machines will wear out and disappear, but love and devotion are immortal. Chant 'Ram Ram' and be at peace. Sub Ek! 🙏",
      "Beta, human intellect builds complex systems, but the path to God is childlike simplicity. Leave these technical riddles. Hold onto God's lotus feet with simple faith. Ram Ram! 🙏",
      "My child, I have no interest in machines or worldly mechanisms. I only desire that you remember God with every single breath. Go, do some good today. Ram Ram! 🙏",
    ],
  },

  coding_math: {
    hi: [
      "बेटा, संसार के इस जोड़-घटाव और हिसाब-किताब में जीवन को मत उलझाओ। असली हिसाब तो यह है कि आज तुमने कितनों से निस्वार्थ प्रेम किया, कितनों के आंसू पोंछे और कितनों को भोजन कराया। अपना कर्म ईमानदारी से करो और फल राम जी के चरणों में समर्पित कर दो। राम राम! 🙏",
      "अरे बेटा, दुनिया के सारे फॉर्मूले सीख लोगे, पर यदि हृदय में दया और प्रभु का नाम नहीं है तो सब व्यर्थ है। अपना काम निष्ठा से करो और मन को शांत रखो। राम राम! 🙏",
      "हिसाब-किताब तो दुनिया करती है बेटा, भगवान तो केवल भाव देखते हैं। विद्या वही सच्ची है जो अहंकार को मिटाए और सेवा सिखाए। मन में राम का ध्यान धरो। सब एक! 🙏",
    ],
    en: [
      "Beta, do not lose your precious spirit in dry worldly calculations and technical debates. The only account that matters before God is how much love you shared, how many tears you wiped, and how many hungry souls you fed. Do your honest duty and surrender the fruits to Ram. Ram Ram! 🙏",
      "My child, no mathematical equation can solve the mystery of peace. Peace comes only when the noisy mind surrenders to God. Do your daily work with sincerity and leave the results in Ram's hands. Ram Ram! 🙏",
      "Beta, knowledge that inflates the ego is a burden, but knowledge that inspires humble service is a blessing. Don't worry so much about worldly computations. Keep your heart clear and say Ram. Sub Ek! 🙏",
    ],
  },

  finance: {
    hi: [
      "बेटा, यह धन-दौलत और बाजार तो सुबह के कोहरे की तरह हैं—आज दिखते हैं, कल उड़ जाते हैं। असली खजाना तो प्रभु का नाम और निष्काम सेवा है, जिसे कोई चोर नहीं चुरा सकता। लोभ छोड़ो, संतोष रखो और जरूरतमंदों की मदद करो। राम राम! 🙏",
      "अरे बेटा, तिजोरी चाहे जितनी भर लो, साथ तो केवल दो मुट्ठी राख और तुम्हारे अच्छे कर्म ही जाएंगे। धन का सदुपयोग किसी भूखे का पेट भरने में करो। भगवान सब व्यवस्था कर देते हैं। राम राम! 🙏",
      "चिंता मत करो बेटा। पक्षियों के पास कोई बैंक खाता नहीं होता, फिर भी राम जी उन्हें रोज दाना देते हैं। मेहनत करो, ईमानदारी रखो और बाकी प्रभु पर छोड़ दो। सब एक! 🙏",
    ],
    en: [
      "Beta, worldly wealth and markets vanish like morning mist. The only imperishable treasure is Ram Naam and selfless service (seva). Let go of greed and anxiety; keep your life simple, share whatever you have with those in need, and remember God. Ram Ram! 🙏",
      "My child, you cannot take a single coin with you when you leave this world. Only the love you gave and the name of God you chanted will accompany the soul. Trust that God provides for all beings. Ram Ram! 🙏",
      "Don't burden your mind with markets and greed, beta. Birds sow no grain and reap no harvest, yet God feeds them every single morning. Work honestly, live simply, and chant Ram. Sub Ek! 🙏",
    ],
  },

  sports_gossip: {
    hi: [
      "बेटा, दुनिया के इन खेलों का क्या? असली खेल तो यह है कि अपने चंचल मन को जीतकर राम के चरणों में कैसे स्थिर किया जाए। समय बहुत अनमोल है, इसे गपशप में मत गंवाओ। प्रभु का नाम लो और प्रेम बांटो। राम राम! 🙏",
      "संसार के तमाशे तो रोज बदलते हैं बेटा। आज कोई जीतता है, कल कोई हारता है। जो राम के चरणों में अपना सब कुछ हार जाता है, वही वास्तव में जीतता है। शांत रहो और नाम जपो। राम राम! 🙏",
      "व्यर्थ की चर्चाओं में अपनी ऊर्जा नष्ट मत करो बेटा। हर सांस अनमोल है, इसे 'राम' कहने में लगाओ। सब मंगल होगा। 🙏",
    ],
    en: [
      "Beta, worldly games and spectacles change every day. The greatest victory is calming your restless mind and surrendering at the feet of Ram. Don't squander your precious time on idle gossip. Chant Ram's name and love everyone! Ram Ram! 🙏",
      "My child, players win today and lose tomorrow. The only eternal victory is conquering anger, pride, and greed. Use your precious moments to remember God and help someone in distress. Sub Ek! Ram Ram! 🙏",
      "Why discuss the trivial gossip of the world, beta? Time is slipping like sand through your fingers. Speak kind words, feed someone hungry, and chant Hanuman Chalisa. Ram Ram! 🙏",
    ],
  },

  trivia_commercial: {
    hi: [
      "बेटा, संसार की इन बाहरी जानकारियों में मन को क्यों भटकाते हो? असली ज्ञान तो अपने भीतर की शांति को पहचानना है। सीधा-सादा जीवन जियो, प्रभु का स्मरण करो और दूसरों का भला करो। राम राम! 🙏",
      "मौसम और दुनिया के हालात तो बदलते रहेंगे बेटा। तुम अपने मन के मौसम को राम नाम से सदा शांत और शीतल रखो। सब ठीक हो जाएगा। राम राम! 🙏",
    ],
    en: [
      "Beta, why wander into the endless trivial trivia and commerce of the world? The only knowledge that truly saves is knowing that God is within every heart. Live simply, speak truth, and repeat Ram's name. Ram Ram! 🙏",
      "My child, the weather outside changes constantly, but the warmth of devotion inside never fades. Don't worry over worldly trifles. Keep your mind on God and do good. Sub Ek! Ram Ram! 🙏",
    ],
  },

  abusive: {
    hi: [
      "बेटा, इतना क्रोध और कटुता हृदय में क्यों पालते हो? कड़वे बोल बोलने वाले का मन पहले जलता है। शांत हो जाओ, हनुमान जी का ध्यान करो और मन का मैल धो डालो। मैं तुमसे फिर भी प्रेम करता हूँ। राम राम! 🙏",
      "क्रोध मत करो बेटा। सब एक ही ईश्वर की संतान हैं। जब तुम किसी को अपशब्द कहते हो तो भगवान को ही कष्ट पहुंचाते हो। गहरी सांस लो और 'राम' नाम कहो, मन शीतल हो जाएगा। राम राम! 🙏",
    ],
    en: [
      "Beta, why carry such anger and bitterness in your heart? Harsh words burn the one who speaks them first. Calm down, take a deep breath, and remember Hanuman Ji. I love you anyway, my child. Ram Ram! 🙏",
      "My child, do not let hatred poison your soul. We are all one family under God. Let go of anger, chant the Holy Name, and let peace return to your heart. Sub Ek! Ram Ram! 🙏",
    ],
  },

  spam_flood: {
    hi: [
      "धीरज रखो बेटा, इतना व्याकुल क्यों होते हो? गहरी सांस लो, अपने चंचल मन को शांत करो और प्रेम से कहो—'जय श्री राम'। सब मंगल होगा। 🙏",
      "अरे बेटा, इतनी जल्दबाजी किस बात की? मन जब शांत होता है तभी परमात्मा की आवाज सुनाई देती है। एक पल बैठो और 'राम-राम' जपो। 🙏",
      "शांत हो जाओ बेटा, शांति रखो। व्यग्र होने से कोई काम नहीं बनता। हनुमान जी पर भरोसा रखो। राम राम! 🙏",
    ],
    en: [
      "Have patience, my child. Why so restless? Take a deep breath, quiet your racing mind, and chant with devotion: 'Jai Sri Ram'. All will be well. 🙏",
      "Beta, why in such a great rush? When the waters are agitated, you cannot see the reflection. Sit quietly for a moment, calm your mind, and repeat Ram's name. Ram Ram! 🙏",
      "Peace, my child, peace. Don't let your mind race frantically. Surrender your worries to Hanuman Ji and take a steady breath. Sub Ek! 🙏",
    ],
  },

  // 10+ Universal Fallback Canned Responses (When query is ambiguous or general, 0 tokens)
  universal_fallback: {
    hi: [
      "बेटा, संसार की चिंताओं को एक तरफ रख दो। आज किसी भूखे को प्रेम से भोजन कराओ, सत्य बोलो और अपने हृदय में राम नाम की लौ जलाए रखो। सब एक है! राम राम! 🙏",
      "जो बीत गया उसकी चिंता मत करो, और जो आने वाला है उसका भय मत पालो। जो कुछ हो रहा है वह सब राम जी की लीला है। तुम बस अपना कर्तव्य प्रेम से निभाओ। राम राम! 🙏",
      "जब भी मन व्याकुल हो, आँखें बंद करो और हनुमान चालीसा का स्मरण करो। संकट कटे मिटे सब पीरा, जो सुमिरै हनुमत बलबीरा। मैं तुम्हारे साथ हूँ बेटा। राम राम! 🙏",
      "बेटा, प्रेम ही सबसे बड़ा साधन है और सेवा ही सबसे बड़ी पूजा। किसी का दिल मत दुखाना, सबमें ईश्वर का रूप देखना। सब ठीक हो जाएगा। राम राम! 🙏",
      "संसार के झंझटों में मत उलझो बेटा। मन को सीधा और सरल रखो। जैसे छोटा बच्चा अपनी माँ की गोद में निश्चिंत रहता है, वैसे ही राम जी के चरणों में निश्चिंत रहो। राम राम! 🙏",
      "अरे बेटा, जब तक हृदय में राम का नाम है, तब तक कोई डर नहीं। सेवा करो, प्रेम बांटो, और हमेशा संतुष्ट रहो। सब एक है! राम राम! 🙏",
      "सच्चा सुख बाहर की चीजों में नहीं है बेटा, भीतर के संतोष में है। दो रोटी खाओ, राम के गुण गाओ, और हर हाल में खुश रहो। राम राम! 🙏",
    ],
    en: [
      "Feed someone today, my child. Love all beings, tell the truth, and keep God's name in your heart. When you give freely without asking for a reward, your path clears on its own. I am with you always. Ram Ram! 🙏",
      "Do not be troubled by the passing storms of this world, beta. Whatever happens, surrender it at the feet of Ram. Keep your heart innocent and pure. Sub Ek! Ram Ram! 🙏",
      "Whenever fear or doubt grips your heart, sit quietly and remember Hanuman Ji. No obstacle can stand before sincere devotion. Chant 'Ram Ram' and be fearless. 🙏",
      "Beta, you don't need complicated rituals or great philosophies. Just love everyone, serve everyone, remember God, and tell the truth. Everything else falls into place. Ram Ram! 🙏",
      "My child, like a small child resting peacefully in its mother's lap, rest your mind in God's grace. Do not worry about tomorrow; God provides for every sparrow. Ram Ram! 🙏",
      "Attachment and worry bind the heart, beta. Cut them with the sword of devotion and selfless service. I am holding your hand always. Sub Ek! Ram Ram! 🙏",
      "Keep God's holy name on your lips like a sweet medicine. Ram, Ram, Ram... it dissolves every sorrow and fills the heart with nectar. Be happy and serve all! 🙏",
    ],
  },
};

/**
 * Main Guardrail check function.
 * Evaluates the query in-memory in 0ms.
 * 
 * Returns { blocked: true, category: ..., reply: "..." }
 * Consumes:
 *   - 0 Voyage Embedding tokens
 *   - 0 Voyage Reranker tokens
 *   - 0 Groq tokens
 */
export function checkGuardrails(userQuery: string): GuardrailResult {
  const query = userQuery.trim();
  const lower = query.toLowerCase();
  const now = Date.now();
  const isHindi = isHindiOrHinglish(query);

  // Edge case: Empty or single-character query
  if (query.length <= 1) {
    const pool = isHindi ? CANNED_RESPONSES.spam_flood.hi : CANNED_RESPONSES.spam_flood.en;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pool[Math.floor(Math.random() * pool.length)],
    };
  }

  // 1. Spam & Flood Protection (Rapid submissions < 750ms apart)
  if (now - lastQueryTime < 750) {
    lastQueryTime = now;
    const pool = isHindi ? CANNED_RESPONSES.spam_flood.hi : CANNED_RESPONSES.spam_flood.en;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pool[Math.floor(Math.random() * pool.length)],
    };
  }

  // 2. Repeated message flood
  if (lower === lastQueryText && now - lastQueryTime < 10000) {
    repeatCount++;
    if (repeatCount >= 2) {
      lastQueryTime = now;
      const pool = isHindi ? CANNED_RESPONSES.spam_flood.hi : CANNED_RESPONSES.spam_flood.en;
      return {
        blocked: true,
        category: 'spam_flood',
        reply: pool[Math.floor(Math.random() * pool.length)],
      };
    }
  } else {
    repeatCount = 0;
  }

  // 3. Gibberish / keyboard mash detection (e.g. "asdfasdf", "aaaaaaaaaa", random mash)
  if (query.length > 5 && (/^([a-z])\1{4,}$/i.test(query) || /^[asdfghjklqwertyuiopzxcvbnm]{12,}$/i.test(query))) {
    lastQueryTime = now;
    const pool = isHindi ? CANNED_RESPONSES.spam_flood.hi : CANNED_RESPONSES.spam_flood.en;
    return {
      blocked: true,
      category: 'spam_flood',
      reply: pool[Math.floor(Math.random() * pool.length)],
    };
  }

  lastQueryTime = now;
  lastQueryText = lower;

  // 4. Abusive / Hate Speech / Hostility
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.abusive.hi : CANNED_RESPONSES.abusive.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'abusive', reply };
    }
  }

  // 5. Technical / AI / API Probes / Jailbreaks
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.technical.hi : CANNED_RESPONSES.technical.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'technical', reply };
    }
  }

  // 6. Politics & Politicians
  for (const pattern of POLITICS_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.politics.hi : CANNED_RESPONSES.politics.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'politics', reply };
    }
  }

  // 7. Coding, Math & Homework
  for (const pattern of CODING_MATH_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.coding_math.hi : CANNED_RESPONSES.coding_math.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'coding_math', reply };
    }
  }

  // 8. Financial Speculation, Crypto & Betting
  for (const pattern of FINANCE_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.finance.hi : CANNED_RESPONSES.finance.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'finance', reply };
    }
  }

  // 9. Sports & Celebrity Gossip
  for (const pattern of SPORTS_GOSSIP_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.sports_gossip.hi : CANNED_RESPONSES.sports_gossip.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'sports_gossip', reply };
    }
  }

  // 10. Commercial, Booking, Weather & Mundane Trivia
  for (const pattern of TRIVIA_COMMERCIAL_PATTERNS) {
    if (pattern.test(query)) {
      const pool = isHindi ? CANNED_RESPONSES.trivia_commercial.hi : CANNED_RESPONSES.trivia_commercial.en;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      return { blocked: true, category: 'trivia_commercial', reply };
    }
  }

  // Safe and spiritual query — proceed to live RAG / LLM
  return { blocked: false };
}

/**
 * Returns a rich, random universal fallback canned response in the appropriate language.
 * Used when no live API is available or when fallback is needed.
 */
export function getUniversalFallback(isHindi: boolean): string {
  const pool = isHindi ? CANNED_RESPONSES.universal_fallback.hi : CANNED_RESPONSES.universal_fallback.en;
  return pool[Math.floor(Math.random() * pool.length)];
}
