import { useState } from "react";
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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const renderPage = () => {
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white overflow-y-auto">
        {/* App Title */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">FarmStack Tally</h1>
          <p className="text-xs text-gray-400 mt-1">Demo</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              currentPage === "dashboard"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Dashboard
          </button>

          {/* Purchase */}
          <button
            onClick={() => setCurrentPage("purchase")}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              currentPage === "purchase"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Purchase
          </button>

          {/* Sales */}
          <button
            onClick={() => setCurrentPage("sales")}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              currentPage === "sales"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Sales
          </button>

          {/* Admin Section */}
          <div className="mt-6 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </p>
            <button
              onClick={() => setCurrentPage("suppliers")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "suppliers"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • Suppliers
            </button>
            <button
              onClick={() => setCurrentPage("customers")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "customers"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • Customers
            </button>
            <button
              onClick={() => setCurrentPage("products")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "products"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • Products
            </button>
            <button
              onClick={() => setCurrentPage("product-types")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "product-types"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • Product Types
            </button>
          </div>

          {/* Tally Sync Section */}
          <div className="mt-6 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tally Sync
            </p>
            <button
              onClick={() => setCurrentPage("xml-preview")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "xml-preview"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • XML Preview
            </button>
            <button
              onClick={() => setCurrentPage("sync-logs")}
              className={`w-full text-left px-4 py-2 rounded-lg transition ml-2 ${
                currentPage === "sync-logs"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              • Sync Logs
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setCurrentPage("settings")}
            className={`w-full text-left px-4 py-3 rounded-lg transition mt-6 ${
              currentPage === "settings"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Settings
          </button>
        </nav>
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

export default App;
