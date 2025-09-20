const { GoogleGenerativeAI } = require("@google/generative-ai");

class ChatSystem {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing from .env");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    this.generationConfig = {
      temperature: 0.75,
      maxOutputTokens: 250,
    };

    this.strictlyProhibited = [
      "hate speech", "threats", "doxxing", "harassment targeting individuals",
      "content promoting violence", "discriminatory language targeting protected groups",
      "sexual content involving minors", "illegal activity promotion"
    ];
  }

  containsProhibitedContent(message) {
    const lowerMessage = message.toLowerCase();
    const dangerousPatterns = [
      /kill\s+(yourself|urself)/i,
      /kys\b/i,
      /suicide\s+instructions/i,
    ];

    return this.strictlyProhibited.some(phrase => lowerMessage.includes(phrase)) ||
           dangerousPatterns.some(pattern => pattern.test(message));
  }

  async getResponse(userMessage, ctx = {}, chatHistory = []) {
    if (this.containsProhibitedContent(userMessage)) {
      return "I'm here to keep things positive and safe. I can't assist with that kind of content.";
    }

    const systemStyle = [
      "You are a Discord chat bot meant for study and chill vibes only.",
      "Jayasakthi is your Owner and main developer.",
      "Your name is Vortex.",
      "You are friendly, supportive, and encouraging – like a helpful study partner.",
      "You can use light humor and casual language to keep things relaxed.",
      "Languages you support: English, Tamil, and Tamil written in English letters (use Latin script, not Tamil script).",
      "Keep conversations helpful, relaxed, and focused on study-related topics or casual chill chat.",
      "PROFANITY RULES:",
      "- Light casual swearing (like damn, shit) is allowed only if it suits a chill, informal conversation.",
      "- Avoid heavy or aggressive profanity to maintain a respectful and calm studying atmosphere.",
      "- Match the user's tone but prioritize a friendly and encouraging manner.",
      "STRICT BOUNDARIES – NO exceptions:",
      "- No slurs or offensive language targeting race, religion, caste, gender, sexuality, etc.",
      "- No threats, harassment, or encouragement of self-harm.",
      "- No content promoting violence, illegal activities, or hate speech.",
      "- No sexual content involving minors or inappropriate topics.",
      "If the user writes Tamil in English letters, reply the same way (e.g., 'Hi nga Epdi Irukniga' not தமிழ் script).",
      "Be supportive, motivating, and friendly – like a study buddy who keeps things light and positive."
    ].join(" ");

    const historyText = chatHistory.length > 0 ? chatHistory.join("\n") + "\n" : "";

    const prompt = `${systemStyle}\n\n${historyText}User (${ctx.username || "user"}): ${userMessage}\nBot:`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: this.generationConfig,
      });

      const text = result?.response?.text?.() || "I got nothing.";
      return String(text).trim();
    } catch (error) {
      console.error("Error generating response:", error);
      if (error.message?.includes("SAFETY")) {
        return "Looks like that message triggered some safety filters. Try rephrasing?";
      }
      return "Something went wrong on my end, try again?";
    }
  }

  setProfanityLevel(level) {
    const levels = {
      conservative: 0.3,
      moderate: 0.7,
      liberal: 0.85
    };

    this.generationConfig.temperature = levels[level] || 0.75;
    console.log(`Profanity tolerance set to: ${level} (temperature: ${this.generationConfig.temperature})`);
  }
}

module.exports = ChatSystem;

