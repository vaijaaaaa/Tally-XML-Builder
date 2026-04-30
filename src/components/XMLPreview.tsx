import React, { useState } from "react";

export const XMLPreview: React.FC = () => {
  const [xmlContent] = useState(
    `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <!-- Generated voucher XML will appear here -->
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
  );

  const handleGenerateSample = () => {
    console.log("Generate sample XML clicked");
  };

  const handleCheckConnection = () => {
    console.log("Check Tally connection clicked");
  };

  const handleSendToTally = () => {
    console.log("Send to Tally clicked");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">XML Preview</h1>

      {/* XML Preview Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tally XML Envelope</h2>
        <textarea
          value={xmlContent}
          readOnly
          className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleGenerateSample}
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Generate Sample XML
          </button>

          <button
            onClick={handleCheckConnection}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
          >
            Check Tally Connection
          </button>

          <button
            onClick={handleSendToTally}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            Send to Tally
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> These buttons are placeholders. They will send XML to TallyPrime 
          at <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">localhost:9000</code> in the production version.
        </p>
      </div>
    </div>
  );
};
