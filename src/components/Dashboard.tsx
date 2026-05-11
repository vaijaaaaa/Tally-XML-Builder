import React, { useState, useEffect } from "react";
import { getCustomers, getSuppliers, getProducts, getPendingSalesCount, getPendingPurchasesCount } from "../lib/db";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

export const Dashboard: React.FC = () => {
  const [counts, setCounts] = useState({
    customers: 0,
    suppliers: 0,
    products: 0,
    pendingTallySync: 0,
  });
  const [loading, setLoading] = useState(true);
  const { translate } = useLanguage();

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [customers, suppliers, products, pendingSales, pendingPurchases] = await Promise.all([
        getCustomers(),
        getSuppliers(),
        getProducts(),
        getPendingSalesCount(),
        getPendingPurchasesCount(),
      ]);
      setCounts({
        customers: customers.length,
        suppliers: suppliers.length,
        products: products.length,
        pendingTallySync: pendingSales + pendingPurchases,
      });
    } catch (err) {
      console.error("Error loading counts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{translate(translations.dashboard)}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-gray-600 text-sm font-semibold">{translate(translations.customers)}</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">{loading ? "-" : counts.customers}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm font-semibold">{translate(translations.suppliers)}</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">{loading ? "-" : counts.suppliers}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-gray-600 text-sm font-semibold">{translate(translations.products)}</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">{loading ? "-" : counts.products}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="text-gray-600 text-sm font-semibold">{translate("Pending Tally Sync")}</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">{loading ? "-" : counts.pendingTallySync}</div>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">{translate("About FarmStack Tally Demo")}</h2>
        <p className="text-blue-800 leading-relaxed">
          {translate("This demo converts FarmStack business data into Tally-compatible XML and sends it to TallyPrime running on")} <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">localhost:9000</code>.
        </p>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">{translate("Getting Started")}</h3>
          <ul className="text-gray-600 text-sm space-y-2">
            <li>• {translate("Create suppliers and customers in Admin")}</li>
            <li>• {translate("Add products with pricing tiers")}</li>
            <li>• {translate("Create sales and purchase vouchers")}</li>
            <li>• {translate("Preview Tally XML before sending")}</li>
            <li>• {translate("Send data to TallyPrime")}</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">{translate("Price Layers")}</h3>
          <ul className="text-gray-600 text-sm space-y-2">
            <li><strong>{translate("No.0 (Selling Price)")}</strong> {translate("Actual business price")}</li>
            <li><strong>{translate("No.1 (Tally Price)")}</strong> {translate("Price sent to Tally")}</li>
            <li>{translate("GST calculated on No.1 price for Tally")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
