import React, { useState, useEffect } from "react";
import { addProduct, getProducts, getProductTypes, Product, ProductType } from "../lib/db";

export const Products: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    hsnCode: "",
    type: "",
    gstRate: "",
    unit: "",
    sellingPrice: "",
    tallyPrice: "",
    expiryDate: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [types, prods] = await Promise.all([
        getProductTypes(),
        getProducts(),
      ]);
      setProductTypes(types);
      setProducts(prods);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;

    // If product type is selected, auto-fill GST rate
    if (name === "type" && value) {
      const selectedType = productTypes.find((t) => t.id.toString() === value);
      if (selectedType) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          gstRate: selectedType.gst_rate.toString(),
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    if (!formData.unit.trim()) {
      setError("Unit is required");
      return;
    }

    if (!formData.gstRate || isNaN(parseFloat(formData.gstRate))) {
      setError("GST rate must be a number");
      return;
    }

    if (!formData.sellingPrice || isNaN(parseFloat(formData.sellingPrice))) {
      setError("Selling price (No.0) must be a number");
      return;
    }

    if (!formData.tallyPrice || isNaN(parseFloat(formData.tallyPrice))) {
      setError("Tally price (No.1) must be a number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addProduct({
        name: formData.name,
        hsn_code: formData.hsnCode || undefined,
        product_type_id: formData.type ? parseInt(formData.type) : undefined,
        gst_rate: parseFloat(formData.gstRate),
        unit: formData.unit,
        selling_price_no0: parseFloat(formData.sellingPrice),
        tally_price_no1: parseFloat(formData.tallyPrice),
        expiry_date: formData.expiryDate || undefined,
      });
      setFormData({
        name: "",
        hsnCode: "",
        type: "",
        gstRate: "",
        unit: "",
        sellingPrice: "",
        tallyPrice: "",
        expiryDate: "",
      });
      await loadData();
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Products</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Products Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Product</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HSN Code
            </label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter HSN code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select product type</option>
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Rate (%)
            </label>
            <input
              type="number"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-gray-500 text-xs mt-1">Auto-filled from product type</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Bag, Kg, L"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (No.0)
            </label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tally Price (No.1)
            </label>
            <input
              type="number"
              name="tallyPrice"
              value={formData.tallyPrice}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Products ({products.length})</h2>
        </div>
        {products.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600 text-sm">
            <p>No products added yet. Create your first product using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">No.0 Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">No.1 Price</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">GST %</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.product_type_name || "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-800 font-mono">₹{product.selling_price_no0.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-800 font-mono">₹{product.tally_price_no1.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-gray-800">{product.gst_rate}%</td>
                    <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
