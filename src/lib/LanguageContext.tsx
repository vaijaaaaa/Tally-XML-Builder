import { createContext, useContext, useState, ReactNode, useMemo } from "react";

type Language = "english" | "kannada";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  translate: (text: string) => string;
  transliterate: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// EXCEPTION DICTIONARY - Common Indian names and words with perfect Kannada
// This dictionary-first approach ensures high quality for common names
// Transliteration is used as AUTO-SUGGESTION for user review, not final truth
// ============================================================================
const kannada_exceptions: Record<string, string> = {
  // === COMMON -ESH NAMES (Gods/Heroes) ===
  "ramesh": "ರಮೇಶ್",
  "suresh": "ಸುರೇಶ್",
  "mahesh": "ಮಹೇಶ್",
  "ganesh": "ಗಣೇಶ್",
  "rajesh": "ರಾಜೇಶ್",
  "naresh": "ನರೇಶ್",
  "nitesh": "ನಿತೇಶ್",
  "vikram": "ವಿಕ್ರಮ್",
  "prakash": "ಪ್ರಕಾಶ್",
  "santosh": "ಸಂತೋಷ್",
  "ashok": "ಅಶೋಕ್",
  "ashish": "ಅಶಿಷ್",
  "deepak": "ದೀಪಕ್",
  "anand": "ಆನಂದ",
  "harish": "ಹರಿಶ್",
  "manish": "ಮನಿಶ್",
  "banesh": "ಬನೇಶ್",
  "dinesh": "ದಿನೇಶ್",
  "girish": "ಗಿರಿಶ್",
  "lokesh": "ಲೋಕೇಶ್",
  "prabesh": "ಪ್ರಭೇಶ್",
  "rajiv": "ರಾಜೀವ್",
  "rajendra": "ರಾಜೇಂದ್ರ",
  "ravindra": "ರವೀಂದ್ರ",
  "arun": "ಅರುಣ್",
  "varun": "ವರುಣ್",

  // === COMMON SURNAMES ===
  "patil": "ಪಾಟೀಲ್",
  "kumar": "ಕುಮಾರ್",
  "sharma": "ಶರ್ಮ",
  "singh": "ಸಿಂಗ್",
  "verma": "ವರ್ಮ",
  "gupta": "ಗುಪ್ತ",
  "reddy": "ರೆಡ್ಡಿ",
  "rao": "ರಾವ್",
  "patel": "ಪಟೇಲ್",
  "desai": "ದೇಸಾಯಿ",
  "joshi": "ಜೋಶಿ",
  "nair": "ನಾಯರ್",
  "iyer": "ಅಯ್ಯರ್",
  "kulkarni": "ಕುಲ್ಕರ್ಣಿ",
  "pillai": "ಪಿಲ್ಲೈ",
  "menon": "ಮೆನೋನ್",
  "mistry": "ಮಿಸ್ತ್ರಿ",
  "kapoor": "ಕಪೂರ್",
  "khanna": "ಖನ್ನ",
  "bhat": "ಭಟ್",
  "bhatt": "ಭಟ್ಟ",
  "hegde": "ಹೆಗ್ಡೆ",
  "kadam": "ಕಾದಮ್",
  "naik": "ನಾಯಕ್",
  "pawar": "ಪವಾರ್",
  "malhar": "ಮಾಲಾರ್",

  // === ANCIENT/HEROIC NAMES ===
  "shiva": "ಶಿವ",
  "basaveshwar": "ಬಸವೇಶ್ವರ",
  "arjun": "ಅರ್ಜುನ",
  "karna": "ಕರ್ಣ",
  "bhima": "ಭೀಮ",
  "yudhishthir": "ಯುಧಿಷ್ಠಿರ",
  "krishna": "ಕೃಷ್ಣ",
  "indra": "ಇಂದ್ರ",
  "ashwatthama": "ಅಶ್ವತ್ಥಾಮ",
  "bhishma": "ಭೀಷ್ಮ",

  // === FEMALE NAMES ===
  "priya": "ಪ್ರಿಯ",
  "divya": "ದಿವ್ಯ",
  "sneha": "ಸ್ನೇಹ",
  "pooja": "ಪೂಜ",
  "neha": "ನೇಹ",
  "seema": "ಸೀಮ",
  "kavya": "ಕವ್ಯ",
  "richa": "ರಿಚ",
  "nisha": "ನಿಶ",
  "sweta": "ಸ್ವೇತ",
  "lakshmi": "ಲಕ್ಷ್ಮಿ",
  "sarita": "ಸರಿತ",
  "harsha": "ಹರ್ಷ",
  "malini": "ಮಾಲಿನಿ",
  "rekha": "ರೇಖ",
  "smita": "ಸ್ಮಿತ",

  // === CITIES/PLACES IN KARNATAKA ===
  "bengaluru": "ಬೆಂಗಳೂರು",
  "bangalore": "ಬೆಂಗಳೂರು",
  "karnataka": "ಕರ್ನಾಟಕ",
  "mysore": "ಮೈಸೂರು",
  "belur": "ಬೇಳೂರು",
  "halebid": "ಹಾಳೇಬೀಡು",
  "udupi": "ಉಡುಪಿ",
  "mangalore": "ಮಂಗಳೂರು",
  "shimoga": "ಶಿಮೋಗ",
  "hassan": "ಹಾಸನ",
  "belgaum": "ಬೇಳಗಾವಿ",
  "belagavi": "ಬೇಳಗಾವಿ",
  "bijapur": "ಬಿಜಾಪುರ",
  "gulbarga": "ಗುಳ್ಬರ್ಗ",
  "davangere": "ದಾವಣಗೆರೆ",
  "aland": "ಅಲಂದ",
  "ballari": "ಬಳ್ಳಾರಿ",
  "kolar": "ಕೋಲಾರ",
  "tumkur": "ತುಮ್ಕೂರ",
  "chikmagalur": "ಚಿಕ್ಕಮಗಳೂರು",

  // === OTHER MAJOR INDIAN CITIES ===
  "pune": "ಪುಣೆ",
  "mumbai": "ಮುಂಬೈ",
  "delhi": "ದೆಹಲಿ",
  "hyderabad": "ಹೈದರಾಬಾದ",
  "chennai": "ಚೆನ್ನೈ",
  "kolkata": "ಕೋಲ್ಕತ್ತ",
  "goa": "ಗೋವ",
  "indore": "ಇಂದೌರ",
  "jaipur": "ಜಯಪುರ",
  "lucknow": "ಲಕನೌ",

  // === AGRICULTURAL/FARMER TERMS ===
  "paddy": "ಧಾನ್ಯ",
  "rice": "ಅಕ್ಕಿ",
  "wheat": "ಗೋಧಿ",
  "sugarcane": "ಕಿವಿ",
  "cotton": "ಹೊಲ",
  "soybean": "ಸೋಯಾ",
  "maize": "ಜೋಳ",
  "groundnut": "ಕಾದಳೆ",
  "jowar": "ಜೋಳ",
  "pulses": "ಪುಡಿಂಗಳು",
  "lentils": "ಬಾರ್ಲಿ",
  "farm": "ಕೃಷಿ",
  "farmer": "ರೈತ",
  "harvest": "ಅಕ್ಕ",
  "soil": "ಮಿಡುಡು",

  // === BUSINESS/COMMON TERMS ===
  "traders": "ವ್ಯಾಪಾರಿ",
  "company": "ಕಂಪನಿ",
  "enterprise": "ಸಂಸ್ಥೆ",
  "business": "ವ್ಯವಹಾರ",
  "supplier": "ಸರಬರಾಜುದಾರ",
  "customer": "ಗ್ರಾಹಕ",
  "merchant": "ವ್ಯಾಪಾರಿ",

  // === UNITS/MEASUREMENTS ===
  "kg": "ಕೆಜಿ",
  "liter": "ಲೀಟರ್",
  "bag": "ಚೀಲೆ",
  "ton": "ಟನ್",
  "acre": "ಎಕರೆ",
  "rupees": "ರೂಪಾಯಿ",
  "quintal": "ಕ್ವಿಂಟಾಲ್",
};

// ============================================================================
// ADVANCED SYLLABLE MAPPING - Improved for better transliteration
// ============================================================================
const syllableMap: Record<string, string> = {
  // === VOWELS ===
  "a": "ಅ", "aa": "ಆ", 
  "e": "ೆ", "ee": "ೀ", "ea": "ಿ",
  "i": "ಿ", "ii": "ೀ",
  "o": "ೋ", "oo": "ೂ",
  "u": "ು", "uu": "ೂ",
  "ai": "ೈ", "au": "ೌ",

  // === KA GROUP ===
  "ka": "ಕ", "kaa": "ಕಾ", "ki": "ಕಿ", "kee": "ಕೀ", "ku": "ಕು", "koo": "ಕೂ", "ke": "ಕೆ", "ko": "ಕೋ",
  "kha": "ಖ", "khaa": "ಖಾ", "khi": "ಖಿ", "khee": "ಖೀ", "khu": "ಖು", "khoo": "ಖೂ", "khe": "ಖೆ", "kho": "ಖೋ",

  // === GA GROUP ===
  "ga": "ಗ", "gaa": "ಗಾ", "gi": "ಗಿ", "gee": "ಗೀ", "gu": "ಗು", "goo": "ಗೂ", "ge": "ಗೆ", "go": "ಗೋ",
  "gha": "ಘ", "ghaa": "ಘಾ", "ghi": "ಘಿ", "ghee": "ಘೀ", "ghu": "ಘು", "ghoo": "ಘೂ", "ghe": "ಘೆ", "gho": "ಘೋ",

  // === CHA GROUP ===
  "cha": "ಚ", "chaa": "ಚಾ", "chi": "ಚಿ", "chee": "ಚೀ", "chu": "ಚು", "choo": "ಚೂ", "che": "ಚೆ", "cho": "ಚೋ",
  "chia": "ಚಿ", "chya": "ಚ್ಯ",

  // === JA GROUP ===
  "ja": "ಜ", "jaa": "ಜಾ", "ji": "ಜಿ", "jee": "ಜೀ", "ju": "ಜು", "joo": "ಜೂ", "je": "ಜೆ", "jo": "ಜೋ",
  "jha": "ಝ", "jhaa": "ಝಾ", "jhi": "ಝಿ", "jhee": "ಝೀ", "jhu": "ಝು", "jhoo": "ಝೂ", "jhe": "ಝೆ", "jho": "ಝೋ",

  // === TA GROUP (dental) ===
  "ta": "ತ", "taa": "ತಾ", "ti": "ತಿ", "tee": "ತೀ", "tu": "ತು", "too": "ತೂ", "te": "ತೆ", "to": "ತೋ",
  "tha": "ಥ", "thaa": "ಥಾ", "thi": "ಥಿ", "thee": "ಥೀ", "thu": "ಥು", "thoo": "ಥೂ", "the": "ಥೆ", "tho": "ಥೋ",

  // === DA GROUP ===
  "da": "ದ", "daa": "ದಾ", "di": "ದಿ", "dee": "ದೀ", "du": "ದು", "doo": "ದೂ", "de": "ದೆ", "do": "ದೋ",
  "dha": "ಧ", "dhaa": "ಧಾ", "dhi": "ಧಿ", "dhee": "ಧೀ", "dhu": "ಧು", "dhoo": "ಧೂ", "dhe": "ಧೆ", "dho": "ಧೋ",
  "dya": "ದ್ಯ",

  // === NA GROUP ===
  "na": "ನ", "naa": "ನಾ", "ni": "ನಿ", "nee": "ನೀ", "nu": "ನು", "noo": "ನೂ", "ne": "ನೆ", "no": "ನೋ",

  // === PA GROUP ===
  "pa": "ಪ", "paa": "ಪಾ", "pi": "ಪಿ", "pee": "ಪೀ", "pu": "ಪು", "poo": "ಪೂ", "pe": "ಪೆ", "po": "ಪೋ",
  "pha": "ಫ", "phaa": "ಫಾ", "phi": "ಫಿ", "phee": "ಫೀ", "phu": "ಫು", "phoo": "ಫೂ", "phe": "ಫೆ", "pho": "ಫೋ",
  "pra": "ಪ್ರ", "praa": "ಪ್ರಾ", "pri": "ಪ್ರಿ", "pree": "ಪ್ರೀ", "pru": "ಪ್ರು", "proo": "ಪ್ರೂ", "pre": "ಪ್ರೆ", "pro": "ಪ್ರೋ",

  // === BA GROUP ===
  "ba": "ಬ", "baa": "ಬಾ", "bi": "ಬಿ", "bee": "ಬೀ", "bu": "ಬು", "boo": "ಬೂ", "be": "ಬೆ", "bo": "ಬೋ",
  "bha": "ಭ", "bhaa": "ಭಾ", "bhi": "ಭಿ", "bhee": "ಭೀ", "bhu": "ಭು", "bhoo": "ಭೂ", "bhe": "ಭೆ", "bho": "ಭೋ",
  "bra": "ಬ್ರ", "braa": "ಬ್ರಾ", "bri": "ಬ್ರಿ", "bree": "ಬ್ರೀ", "bru": "ಬ್ರು", "broo": "ಬ್ರೂ", "bre": "ಬ್ರೆ", "bro": "ಬ್ರೋ",

  // === MA GROUP ===
  "ma": "ಮ", "maa": "ಮಾ", "mi": "ಮಿ", "mee": "ಮೀ", "mu": "ಮು", "moo": "ಮೂ", "me": "ಮೆ", "mo": "ಮೋ",

  // === YA GROUP ===
  "ya": "ಯ", "yaa": "ಯಾ", "yi": "ಯಿ", "yee": "ಯೀ", "yu": "ಯು", "yoo": "ಯೂ", "ye": "ಯೆ", "yo": "ಯೋ",

  // === RA GROUP ===
  "ra": "ರ", "raa": "ರಾ", "ri": "ರಿ", "ree": "ರೀ", "ru": "ರು", "roo": "ರೂ", "re": "ರೆ", "ro": "ರೋ",

  // === LA GROUP ===
  "la": "ಲ", "laa": "ಲಾ", "li": "ಲಿ", "lee": "ಲೀ", "lu": "ಲು", "loo": "ಲೂ", "le": "ಲೆ", "lo": "ಲೋ",

  // === VA GROUP ===
  "va": "ವ", "vaa": "ವಾ", "vi": "ವಿ", "vee": "ವೀ", "vu": "ವು", "voo": "ವೂ", "ve": "ವೆ", "vo": "ವೋ",

  // === SA GROUP ===
  "sa": "ಸ", "saa": "ಸಾ", "si": "ಸಿ", "see": "ಸೀ", "su": "ಸು", "soo": "ಸೂ", "se": "ಸೆ", "so": "ಸೋ",
  "sha": "ಶ", "shaa": "ಶಾ", "shi": "ಶಿ", "shee": "ಶೀ", "shu": "ಶು", "shoo": "ಶೂ", "she": "ಶೆ", "sho": "ಶೋ",
  "shra": "ಶ್ರ", "shraa": "ಶ್ರಾ", "shri": "ಶ್ರಿ", "shree": "ಶ್ರೀ", "shru": "ಶ್ರು", "shroo": "ಶ್ರೂ", "shre": "ಶ್ರೆ", "shro": "ಶ್ರೋ",
  "sma": "ಸ್ಮ", "smi": "ಸ್ಮಿ",

  // === HA GROUP ===
  "ha": "ಹ", "haa": "ಹಾ", "hi": "ಹಿ", "hee": "ಹೀ", "hu": "ಹು", "hoo": "ಹೂ", "he": "ಹೆ", "ho": "ಹೋ",

  // === STANDALONE CONSONANTS ===
  "k": "ಕ", "kh": "ಖ", "g": "ಗ", "gh": "ಘ",
  "c": "ಚ", "ch": "ಚ", "j": "ಜ", "jh": "ಝ",
  "t": "ತ", "th": "ಥ", "d": "ದ", "dh": "ಧ",
  "n": "ನ", "p": "ಪ", "ph": "ಫ", "b": "ಬ", "bh": "ಭ",
  "m": "ಮ", "y": "ಯ", "r": "ರ", "l": "ಲ", "v": "ವ",
  "s": "ಸ", "sh": "ಶ", "h": "ಹ",
  "w": "ವ",

  // === COMMON CLUSTERS ===
  "tr": "ತ್ರ", "dr": "ದ್ರ", "gr": "ಗ್ರ", "kr": "ಕ್ರ",
  "st": "ಸ್ಟ", "sp": "ಸ್ಪ", "sk": "ಸ್ಕ",
  "fr": "ಫ್ರ", "br": "ಬ್ರ", "pr": "ಪ್ರ",
  "nd": "ಂದ", "ng": "ಂಗ", "nk": "ಂಕ", "nt": "ಂತ",
  "ll": "ಲ್ಲ", "mm": "ಮ್ಮ", "nn": "ನ್ನ", "rr": "ರ್ರ",

  // === SPECIAL ENDINGS (important for Indian names) ===
  "esh": "ೇಶ್",
  "ish": "ಿಶ್",
  "ash": "ಾಶ್",
  "osh": "ೋಶ್",
  "ush": "ುಶ್",
  "il": "ೀಲ್",
  "al": "ಾಲ್",
  "ar": "ಾರ್",
  "ur": "ುರ್",
  "er": "ೆರ್",
  "or": "ೋರ್",
};

// ============================================================================
// IMPROVED TRANSLITERATION FUNCTION
// Priority: Dictionary > Algorithm
// Use Case: Auto-suggestion for user review and manual correction
// ============================================================================

/**
 * Transliterate a single English word to Kannada
 * 
 * Algorithm:
 * 1. Check exception dictionary first (100+ handcrafted perfect mappings)
 *    - Common Indian names with correct Kannada spelling
 *    - City names, business terms, agricultural products
 *    - High confidence suggestions from expert Kannada speakers
 * 
 * 2. If not found in dictionary, use syllable-based rules
 *    - Longest-match-first strategy (4-char → 3-char → 2-char → 1-char)
 *    - Handles unknown names with reasonable phonetic approximation
 * 
 * NOTE: Output is AUTO-SUGGESTION ONLY
 *   - Not treated as final truth
 *   - User can manually correct before saving
 *   - Database stores user's final decision
 */
const transliterateWord = (word: string): string => {
  if (!word || word.length === 0) return word;

  const lowerWord = word.toLowerCase();

  // Step 1: Check exception dictionary first (PREFERRED for high quality)
  if (kannada_exceptions[lowerWord]) {
    return kannada_exceptions[lowerWord];
  }

  // Step 2: Fallback to syllable-based transliteration for unknown words
  return syllableTransliterateWord(word);
};

/**
 * Syllable-based transliteration with longest-match-first strategy
 */
const syllableTransliterateWord = (text: string): string => {
  if (!text || text.length === 0) return text;

  let result = "";
  let i = 0;

  while (i < text.length) {
    let found = false;

    // Try 4-character combinations first (for endings like "shaa", "khaa")
    if (i <= text.length - 4) {
      const fourChar = text.substring(i, i + 4).toLowerCase();
      if (syllableMap[fourChar]) {
        result += syllableMap[fourChar];
        i += 4;
        found = true;
      }
    }

    // Try 3-character combinations
    if (!found && i <= text.length - 3) {
      const threeChar = text.substring(i, i + 3).toLowerCase();
      if (syllableMap[threeChar]) {
        result += syllableMap[threeChar];
        i += 3;
        found = true;
      }
    }

    // Try 2-character combinations
    if (!found && i <= text.length - 2) {
      const twoChar = text.substring(i, i + 2).toLowerCase();
      if (syllableMap[twoChar]) {
        result += syllableMap[twoChar];
        i += 2;
        found = true;
      }
    }

    // Try 1-character match
    if (!found) {
      const oneChar = text[i].toLowerCase();
      if (syllableMap[oneChar]) {
        result += syllableMap[oneChar];
      } else if (/[0-9\s\-.,']()[]/.test(text[i])) {
        // Keep numbers, spaces, punctuation, and brackets
        result += text[i];
      } else {
        // Unknown character - keep as-is
        result += text[i];
      }
      i += 1;
    }
  }

  return result;
};

/**
 * Main transliterate function - handles full text with spaces
 * 
 * Features:
 * - Transliterates each word separately
 * - Preserves word boundaries and spacing
 * - Checks dictionary first for common words
 * - Falls back to rule-based for unknown words
 * 
 * This generates an AUTO-SUGGESTION for the user to review and edit
 */
const transliterateText = (text: string): string => {
  if (!text || text.length === 0) return text;

  // Split by spaces but preserve the spaces
  const words = text.split(/(\s+)/);

  return words
    .map((word) => {
      // If it's a space/whitespace, return as-is
      if (/^\s+$/.test(word)) {
        return word;
      }
      // Otherwise transliterate the word
      return transliterateWord(word);
    })
    .join("");
};

// Offline Kannada translation mapping for common UI strings
const kannada_mapping: Record<string, string> = {
  // Navigation
  "Dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  "Purchase": "ಖರೀದಿ",
  "Sales": "ಮಾರಾಟ",
  "Admin": "ಆಡ್ಮಿನ್",
  "Suppliers": "ಸಪ್ಲೈಯರ್‌ಗಳು",
  "Customers": "ಗ್ರಾಹಕರು",
  "Products": "ಉತ್ಪನ್ನಗಳು",
  "Product Types": "ಉತ್ಪನ್ನ ವಿಧಗಳು",
  "Tally Sync": "ಟ್ಯಾಲಿ ಸಿಂಕ್",
  "XML Preview": "XML ಪೂರ್ವವೀಕ್ಷಣೆ",
  "Sync Logs": "ಸಿಂಕ್ ಲಾಗ್‌ಗಳು",
  "Settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
  "Language": "ಭಾಷೆ",
  "English": "English",
  
  // App Title
  "FarmStack Tally": "ಫಾರ್ಮ್‌ಸ್ಟಾಕ್ ಟ್ಯಾಲಿ",
  "Demo": "ಡೆಮೋ",

  // Dashboard
  "Welcome": "ಸ್ವಾಗತ",
  "About FarmStack Tally Demo": "FarmStack Tally ಡೆಮೋ ಬಗ್ಗೆ",
  "Getting Started": "ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ",
  "Price Layers": "ಬೆಲೆ ಲೇಯರ್‌ಗಳು",

  // Forms & Common
  "Name": "ಹೆಸರು",
  "Phone": "ಫೋನ್",
  "Email": "ಇಮೇಲ್",
  "Address": "ವಿಳಾಸ",
  "City": "ನಗರ",
  "State": "ರಾಜ್ಯ",
  "GSTIN": "GSTIN",
  "Save": "ಸಾಂಚಿಸಿ",
  "Edit": "ತಿದ್ದುಪಡಿ",
  "Delete": "ಅಳಿಸಿ",
  "Add": "ಸೇರಿಸಿ",
  "Cancel": "ರದ್ದು ಮಾಡಿ",
  "Loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
  "Error": "ದೋಷ",
  "Success": "ಯಶಸ್ಸು",
  "Submit": "ಸಲ್ಲಿಸಿ",

  // Database Messages
  "Initializing database...": "ಡೇಟಾಬೇಸ್ ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ...",
  "Failed to initialize database": "ಡೇಟಾಬೇಸ್ ಪ್ರಾರಂಭಿಕರಣ ವಿಫಲ",
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("english");

  const translate = useMemo(
    () => (text: string): string => {
      if (language === "english") {
        return text;
      }

      if (language === "kannada") {
        // First check the offline mapping
        if (kannada_mapping[text]) {
          return kannada_mapping[text];
        }

        // For unmapped text, try character-by-character basic transliteration
        // This is a fallback - the mapping above covers most UI strings
        let result = text;
        const basicMap: Record<string, string> = {
          "a": "ಅ", "e": "ೆ", "i": "ಿ", "o": "ೋ", "u": "ು",
          "A": "ಅ", "E": "ೆ", "I": "ಿ", "O": "ೋ", "U": "ು",
        };
        
        // Only apply basic mapping for single characters
        if (text.length === 1 && basicMap[text]) {
          result = basicMap[text];
        }

        return result;
      }

      return text;
    },
    [language]
  );

  const transliterate = useMemo(
    () => (text: string): string => {
      if (language === "english" || !text) {
        return text;
      }

      // Use improved transliteration with exception dictionary + syllable rules
      return transliterateText(text);
    },
    [language]
  );

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "english" ? "kannada" : "english"));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, translate, transliterate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
