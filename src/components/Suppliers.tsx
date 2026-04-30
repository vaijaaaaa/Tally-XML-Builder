import React, { useState, useEffect } from "react";
import { addSupplier, getSuppliers, Supplier } from "../lib/db";

export const Suppliers: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    gstin: "",
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setError("Failed to load suppliers");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Supplier name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addSupplier(formData);
      setFormData({ name: "", address: "", state: "", gstin: "" });
      await loadSuppliers();
    } catch (err) {
      console.error("Error saving supplier:", err);
      setError("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Suppliers Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Supplier</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter GSTIN"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Saving..." : "Save Supplier"}
        </button>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Suppliers ({suppliers.length})</h2>
        </div>
        {suppliers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600 text-sm">
            <p>No suppliers added yet. Create your first supplier using the form above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">State</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">GSTIN</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.address || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.state || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.gstin || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
