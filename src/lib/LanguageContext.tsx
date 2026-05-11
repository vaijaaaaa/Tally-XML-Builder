import { createContext, useContext, useState, ReactNode, useMemo } from "react";

type Language = "english" | "kannada";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  translate: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Offline Kannada transliteration mapping for common UI strings
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

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "english" ? "kannada" : "english"));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, translate }}>
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
