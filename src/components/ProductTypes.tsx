import React, { useState } from "react";

const defaultTypes = [
  { name: "Fertilizers", gst: 5 },
  { name: "Micronutrients", gst: 12 },
  { name: "Pesticide", gst: 18 },
  { name: "Seeds", gst: 0 },
];

export const ProductTypes: React.FC = () => {
  const [formData, setFormData] = useState({
    typeName: "",
    gstRate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Save product type:", formData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Product Types</h1>

      {/* Default Types */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Default Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultTypes.map((type) => (
            <div key={type.name} className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{type.name}</h3>
                  <p className="text-gray-600 text-sm">GST: {type.gst}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Type Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Product Type</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Name
            </label>
            <input
              type="text"
              name="typeName"
              value={formData.typeName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter type name"
            />
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
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Save Type
        </button>
      </div>
    </div>
  );
};
