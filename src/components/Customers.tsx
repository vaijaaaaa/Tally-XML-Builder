import React, { useState, useEffect } from "react";
import { addCustomer, getCustomers, Customer } from "../lib/db";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

export const Customers: React.FC = () => {
  const { translate, transliterate } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    gstin: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError(translate(translations.failedToLoadCustomers));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError(translate(translations.customerNameRequired));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addCustomer(formData);
      setFormData({ name: "", address: "", state: "", gstin: "" });
      await loadCustomers();
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(translate(translations.failedToSaveCustomer));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{translate(translations.customers)}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Customers Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{translate(translations.addNewCustomer)}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.customerName)}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={translate(translations.enterCustomerName)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.address)}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={translate(translations.enterAddress)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.state)}
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={translate("Enter state")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.gstin)} (Optional)
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={translate("Enter GSTIN")}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? translate("Saving...") : translate("Save Customer")}
        </button>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{translate(translations.customers)} ({customers.length})</h2>
        </div>
        {customers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600 text-sm">
            <p>{translate("No customers added yet. Create your first customer using the form above.")}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.name)}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.address)}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.state)}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{translate(translations.gstin)}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{transliterate(customer.name)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{transliterate(customer.address) || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{transliterate(customer.state) || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.gstin || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
