import React, { useState, useEffect } from "react";
import { addProductType, getProductTypes, ProductType } from "../lib/db";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

export const ProductTypes: React.FC = () => {
  const { translate } = useLanguage();
  const [formData, setFormData] = useState({
    typeName: "",
    gstRate: "",
  });

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    try {
      setError(null);
      const data = await getProductTypes();
      setProductTypes(data);
    } catch (err) {
      console.error("Error loading product types:", err);
      setError(translate(translations.failedToLoadProductTypes));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.typeName.trim()) {
      setError(translate(translations.typeNameRequired));
      return;
    }

    if (!formData.gstRate || isNaN(parseFloat(formData.gstRate))) {
      setError(translate(translations.gstRateRequired));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addProductType({
        name: formData.typeName,
        gst_rate: parseFloat(formData.gstRate),
      });
      setFormData({ typeName: "", gstRate: "" });
      await loadProductTypes();
    } catch (err) {
      console.error("Error saving product type:", err);
      setError(translate(translations.failedToSaveProductType));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{translate(translations.productTypes)}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* All Types */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{translate(translations.productTypes)} ({productTypes.length})</h2>
        {productTypes.length === 0 ? (
          <div className="text-gray-600 text-sm">
            <p>{translate(translations.noProductTypesFound)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productTypes.map((type) => (
              <div key={type.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{type.name}</h3>
                    <p className="text-gray-600 text-sm">{translate("GST")}: {type.gst_rate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Type Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{translate(translations.addNewProductType)}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.typeName)}
            </label>
            <input
              type="text"
              name="typeName"
              value={formData.typeName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={translate("Enter type name")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.gstRate)} (%)
            </label>
            <input
              type="number"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? translate("Saving...") : translate("Save Type")}
        </button>
      </div>
    </div>
  );
};
