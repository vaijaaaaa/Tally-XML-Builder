import React, { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";

export const Settings: React.FC = () => {
  const { translate } = useLanguage();
  const [formData, setFormData] = useState({
    tallyHost: "localhost",
    tallyPort: "9000",
    defaultUnit: "Bag",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Save settings:", formData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{translate(translations.settings)}</h1>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{translate(translations.applicationSettings)}</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.tallyHost)}
            </label>
            <input
              type="text"
              name="tallyHost"
              value={formData.tallyHost}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="localhost"
            />
            <p className="text-gray-500 text-xs mt-1">{translate(translations.default)}: localhost</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.tallyPort)}
            </label>
            <input
              type="text"
              name="tallyPort"
              value={formData.tallyPort}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9000"
            />
            <p className="text-gray-500 text-xs mt-1">{translate(translations.default)}: 9000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translate(translations.defaultUnit)}
            </label>
            <input
              type="text"
              name="defaultUnit"
              value={formData.defaultUnit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bag"
            />
            <p className="text-gray-500 text-xs mt-1">{translate(translations.default)}: Bag</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-8 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          {translate(translations.saveSettings)}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
        <p className="text-blue-800 text-sm">
          <strong>{translate(translations.note)}:</strong> {translate(translations.settingsPlaceholder)}
        </p>
      </div>
    </div>
  );
};
