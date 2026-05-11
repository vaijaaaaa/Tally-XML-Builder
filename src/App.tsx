import { useState, useEffect } from "react";
import "./App.css";
import { Dashboard } from "./components/Dashboard";
import { Sales } from "./components/Sales";
import { Purchase } from "./components/Purchase";
import { Suppliers } from "./components/Suppliers";
import { Customers } from "./components/Customers";
import { Products } from "./components/Products";
import { ProductTypes } from "./components/ProductTypes";
import { XMLPreview } from "./components/XMLPreview";
import { SyncLogs } from "./components/SyncLogs";
import { Settings } from "./components/Settings";
import { initDatabase } from "./lib/db";
import { LanguageProvider, useLanguage } from "./lib/LanguageContext";
import { translations } from "./lib/translations";

type Page =
  | "dashboard"
  | "sales"
  | "purchase"
  | "suppliers"
  | "customers"
  | "products"
  | "product-types"
  | "xml-preview"
  | "sync-logs"
  | "settings";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const { translate, toggleLanguage, language } = useLanguage();

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("Database init error:", err);
        setDbError("Failed to initialize database");
      });
  }, []);

  const renderPage = () => {
    if (!dbReady) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{translate(translations.initializingDatabase)}</p>
            {dbError && (
              <p className="text-red-600 text-sm">{translate(dbError)}</p>
            )}
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "sales":
        return <Sales />;
      case "purchase":
        return <Purchase />;
      case "suppliers":
        return <Suppliers />;
      case "customers":
        return <Customers />;
      case "products":
        return <Products />;
      case "product-types":
        return <ProductTypes />;
      case "xml-preview":
        return <XMLPreview />;
      case "sync-logs":
        return <SyncLogs />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const navButtonClass = (page: Page) =>
    `w-full text-left px-4 py-3 rounded-lg transition ${
      currentPage === page
        ? "bg-blue-600 text-white font-medium"
        : "text-gray-300 hover:bg-gray-800"
    }`;

  const subNavButtonClass = (page: Page) =>
    `w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
      currentPage === page
        ? "bg-blue-600 text-white font-medium"
        : "text-gray-400 hover:bg-gray-800"
    }`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white overflow-y-auto flex flex-col">
        {/* App Title */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">{translate(translations.farmstackTally)}</h1>
          <p className="text-xs text-gray-400 mt-1">{translate(translations.demo)}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={navButtonClass("dashboard")}
          >
            {translate(translations.dashboard)}
          </button>

          {/* Purchase */}
          <button
            onClick={() => setCurrentPage("purchase")}
            className={navButtonClass("purchase")}
          >
            {translate(translations.purchase)}
          </button>

          {/* Sales */}
          <button
            onClick={() => setCurrentPage("sales")}
            className={navButtonClass("sales")}
          >
            {translate(translations.sales)}
          </button>

          {/* Admin Section */}
          <div className="mt-6 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {translate(translations.admin)}
            </p>
            <button
              onClick={() => setCurrentPage("suppliers")}
              className={subNavButtonClass("suppliers")}
            >
              • {translate(translations.suppliers)}
            </button>
            <button
              onClick={() => setCurrentPage("customers")}
              className={subNavButtonClass("customers")}
            >
              • {translate(translations.customers)}
            </button>
            <button
              onClick={() => setCurrentPage("products")}
              className={subNavButtonClass("products")}
            >
              • {translate(translations.products)}
            </button>
            <button
              onClick={() => setCurrentPage("product-types")}
              className={subNavButtonClass("product-types")}
            >
              • {translate(translations.productTypes)}
            </button>
          </div>

          {/* Tally Sync Section */}
          <div className="mt-6 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {translate(translations.tallySync)}
            </p>
            <button
              onClick={() => setCurrentPage("xml-preview")}
              className={subNavButtonClass("xml-preview")}
            >
              • {translate(translations.xmlPreview)}
            </button>
            <button
              onClick={() => setCurrentPage("sync-logs")}
              className={subNavButtonClass("sync-logs")}
            >
              • {translate(translations.syncLogs)}
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setCurrentPage("settings")}
            className={navButtonClass("settings")}
          >
            {translate(translations.settings)}
          </button>
        </nav>

        {/* Language Toggle - Fixed at bottom */}
        <div className="p-4 border-t border-gray-700 mt-auto">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-medium text-sm"
            title="Toggle language"
          >
            <span className="text-lg">🌐</span>
            <span>{language === "english" ? translate(translations.kannada) : translate(translations.english)}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
