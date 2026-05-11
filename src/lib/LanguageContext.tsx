import { createContext, useContext, useState, ReactNode, useMemo } from "react";

type Language = "english" | "kannada";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  translate: (text: string) => string;
  transliterate: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Pure dynamic syllable-based transliteration - no hardcoded dictionary needed
// Maps consonant+vowel pairs to proper Kannada syllables
const syllableMap: Record<string, string> = {
  // Consonant + vowel combinations (most common)
  // Ka group
  "ka": "ಕ", "ki": "ಕಿ", "ku": "ಕು", "ke": "ಕೆ", "ko": "ಕೋ", "kaa": "ಕಾ", "kee": "ಕೀ", "koo": "ಕೂ",
  "kha": "ಖ", "khi": "ಖಿ", "khu": "ಖು", "khe": "ಖೆ", "kho": "ಖೋ", "khaa": "ಖಾ", "khee": "ಖೀ", "khoo": "ಖೂ",
  
  // Ga group
  "ga": "ಗ", "gi": "ಗಿ", "gu": "ಗು", "ge": "ಗೆ", "go": "ಗೋ", "gaa": "ಗಾ", "gee": "ಗೀ", "goo": "ಗೂ",
  "gha": "ಘ", "ghi": "ಘಿ", "ghu": "ಘು", "ghe": "ಘೆ", "gho": "ಘೋ", "ghaa": "ಘಾ", "ghee": "ಘೀ", "ghoo": "ಘೂ",
  
  // Cha group
  "cha": "ಚ", "chi": "ಚಿ", "chu": "ಚು", "che": "ಚೆ", "cho": "ಚೋ", "chaa": "ಚಾ", "chee": "ಚೀ", "choo": "ಚೂ",
  "chia": "ಚಿ", "chya": "ಚ್ಯ",
  
  // Ja group
  "ja": "ಜ", "ji": "ಜಿ", "ju": "ಜು", "je": "ಜೆ", "jo": "ಜೋ", "jaa": "ಜಾ", "jee": "ಜೀ", "joo": "ಜೂ",
  "jha": "ಝ", "jhi": "ಝಿ", "jhu": "ಝು", "jhe": "ಝೆ", "jho": "ಝೋ",
  
  // Ta group (dental)
  "ta": "ತ", "ti": "ತಿ", "tu": "ತು", "te": "ತೆ", "to": "ತೋ", "taa": "ತಾ", "tee": "ತೀ", "too": "ತೂ",
  "tha": "ಥ", "thi": "ಥಿ", "thu": "ಥು", "the": "ಥೆ", "tho": "ಥೋ", "thaa": "ಥಾ", "thee": "ಥೀ", "thoo": "ಥೂ",
  
  // Da group
  "da": "ದ", "di": "ದಿ", "du": "ದು", "de": "ದೆ", "do": "ದೋ", "daa": "ದಾ", "dee": "ದೀ", "doo": "ದೂ",
  "dha": "ಧ", "dhi": "ಧಿ", "dhu": "ಧು", "dhe": "ಧೆ", "dho": "ಧೋ", "dhaa": "ಧಾ", "dhee": "ಧೀ", "dhoo": "ಧೂ",
  "dya": "ದ್ಯ",
  
  // Na group
  "na": "ನ", "ni": "ನಿ", "nu": "ನು", "ne": "ನೆ", "no": "ನೋ", "naa": "ನಾ", "nee": "ನೀ", "noo": "ನೂ",
  
  // Pa group
  "pa": "ಪ", "pi": "ಪಿ", "pu": "ಪು", "pe": "ಪೆ", "po": "ಪೋ", "paa": "ಪಾ", "pee": "ಪೀ", "poo": "ಪೂ",
  "pha": "ಫ", "phi": "ಫಿ", "phu": "ಫು", "phe": "ಫೆ", "pho": "ಫೋ", "phaa": "ಫಾ", "phee": "ಫೀ", "phoo": "ಫೂ",
  "pra": "ಪ್ರ", "pri": "ಪ್ರಿ", "pru": "ಪ್ರು", "pre": "ಪ್ರೆ", "pro": "ಪ್ರೋ", "praa": "ಪ್ರಾ",
  
  // Ba group
  "ba": "ಬ", "bi": "ಬಿ", "bu": "ಬು", "be": "ಬೆ", "bo": "ಬೋ", "baa": "ಬಾ", "bee": "ಬೀ", "boo": "ಬೂ",
  "bha": "ಭ", "bhi": "ಭಿ", "bhu": "ಭು", "bhe": "ಭೆ", "bho": "ಭೋ", "bhaa": "ಭಾ", "bhee": "ಭೀ", "bhoo": "ಭೂ",
  "bra": "ಬ್ರ", "bri": "ಬ್ರಿ", "bru": "ಬ್ರು", "bre": "ಬ್ರೆ", "bro": "ಬ್ರೋ", "braa": "ಬ್ರಾ",
  
  // Ma group
  "ma": "ಮ", "mi": "ಮಿ", "mu": "ಮು", "me": "ಮೆ", "mo": "ಮೋ", "maa": "ಮಾ", "mee": "ಮೀ", "moo": "ಮೂ",
  
  // Ya group
  "ya": "ಯ", "yi": "ಯಿ", "yu": "ಯು", "ye": "ಯೆ", "yo": "ಯೋ", "yaa": "ಯಾ", "yee": "ಯೀ", "yoo": "ಯೂ",
  
  // Ra group
  "ra": "ರ", "ri": "ರಿ", "ru": "ರು", "re": "ರೆ", "ro": "ರೋ", "raa": "ರಾ", "ree": "ರೀ", "roo": "ರೂ",
  
  // La group
  "la": "ಲ", "li": "ಲಿ", "lu": "ಲು", "le": "ಲೆ", "lo": "ಲೋ", "laa": "ಲಾ", "lee": "ಲೀ", "loo": "ಲೂ",
  
  // Va group
  "va": "ವ", "vi": "ವಿ", "vu": "ವು", "ve": "ವೆ", "vo": "ವೋ", "vaa": "ವಾ", "vee": "ವೀ", "voo": "ವೂ",
  
  // Sa group
  "sa": "ಸ", "si": "ಸಿ", "su": "ಸು", "se": "ಸೆ", "so": "ಸೋ", "saa": "ಸಾ", "see": "ಸೀ", "soo": "ಸೂ",
  "sha": "ಶ", "shi": "ಶಿ", "shu": "ಶು", "she": "ಶೆ", "sho": "ಶೋ", "shaa": "ಶಾ", "shee": "ಶೀ", "shoo": "ಶೂ",
  "shra": "ಶ್ರ", "shri": "ಶ್ರಿ", "shru": "ಶ್ರು", "shre": "ಶ್ರೆ", "shro": "ಶ್ರೋ", "shraa": "ಶ್ರಾ",
  "sma": "ಸ್ಮ", "smi": "ಸ್ಮಿ",
  
  // Ha group
  "ha": "ಹ", "hi": "ಹಿ", "hu": "ಹು", "he": "ಹೆ", "ho": "ಹೋ", "haa": "ಹಾ", "hee": "ಹೀ", "hoo": "ಹೂ",
  
  // Standalone vowels
  "a": "ಅ", "i": "ಇ", "u": "ಉ", "e": "ಎ", "o": "ಒ",
  "aa": "ಆ", "ee": "ಈ", "oo": "ೂ", "ai": "ಐ", "au": "ಔ",
  
  // Common consonant clusters
  "tr": "ತ್ರ", "dr": "ದ್ರ", "gr": "ಗ್ರ", "kr": "ಕ್ರ",
  "st": "ಸ್ಟ", "sp": "ಸ್ಪ", "sk": "ಸ್ಕ",
  "fr": "ಫ್ರ", "br": "ಬ್ರ", "pr": "ಪ್ರ",
  "nd": "ಂದ", "ng": "ಂಗ", "nk": "ಂಕ",
};

// Transliterate using syllable-based approach - completely dynamic
const syllableTransliterate = (text: string): string => {
  if (!text || text.length === 0) return text;
  
  let result = "";
  let i = 0;
  
  while (i < text.length) {
    let found = false;
    
    // Try 4-character combinations first (like "shaa", "khaa")
    if (i < text.length - 3) {
      const fourChar = text.substring(i, i + 4).toLowerCase();
      if (syllableMap[fourChar]) {
        result += syllableMap[fourChar];
        i += 4;
        found = true;
      }
    }
    
    // Try 3-character combinations (like "tha", "kha", "sha", "bra", "pra", "shra")
    if (!found && i < text.length - 2) {
      const threeChar = text.substring(i, i + 3).toLowerCase();
      if (syllableMap[threeChar]) {
        result += syllableMap[threeChar];
        i += 3;
        found = true;
      }
    }
    
    // Try 2-character combinations (like "ka", "ta", "ra", "na", "nd", "ng", "ai")
    if (!found && i < text.length - 1) {
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
      } else if (/[0-9\s\-.,']/.test(text[i])) {
        result += text[i];  // Keep numbers, spaces, punctuation
      } else {
        result += text[i];  // Keep other characters as-is
      }
      i += 1;
    }
  }
  
  return result;
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

      // Use pure syllable-based transliteration (no hardcoded dictionary)
      return syllableTransliterate(text);
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
