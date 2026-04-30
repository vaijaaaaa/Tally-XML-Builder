import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-gray-600 text-sm font-semibold">Customers</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">0</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm font-semibold">Suppliers</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">0</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-gray-600 text-sm font-semibold">Products</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">0</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="text-gray-600 text-sm font-semibold">Pending Tally Sync</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">0</div>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">About FarmStack Tally Demo</h2>
        <p className="text-blue-800 leading-relaxed">
          This demo converts FarmStack business data into Tally-compatible XML and sends it to 
          TallyPrime running on <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">localhost:9000</code>.
        </p>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Getting Started</h3>
          <ul className="text-gray-600 text-sm space-y-2">
            <li>• Create suppliers and customers in Admin</li>
            <li>• Add products with pricing tiers</li>
            <li>• Create sales and purchase vouchers</li>
            <li>• Preview Tally XML before sending</li>
            <li>• Send data to TallyPrime</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Price Layers</h3>
          <ul className="text-gray-600 text-sm space-y-2">
            <li><strong>No.0 (Selling Price):</strong> Actual business price</li>
            <li><strong>No.1 (Tally Price):</strong> Price sent to Tally</li>
            <li>GST calculated on No.1 price for Tally</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
