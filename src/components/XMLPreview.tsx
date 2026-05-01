import React, { useState, useEffect } from "react";
import {
  getCustomers,
  getSuppliers,
  getProducts,
  getSales,
  getSaleItems,
  getPurchases,
  getPurchaseItems,
  addTallySyncLog,
  updateSaleSyncStatus,
  updatePurchaseSyncStatus,
  Customer,
  Supplier,
  Product,
  Sale,
  Purchase,
} from "../lib/db";
import { buildMasterEnvelope, buildVoucherEnvelope } from "../tally/xml-builder";
import { buildLedgerCreateXml } from "../tally/xml-templates/ledger-create";
import { buildStockItemXml } from "../tally/xml-templates/stock-item";
import { buildSalesVoucherXml } from "../tally/xml-templates/sales-voucher";
import { buildPurchaseVoucherXml } from "../tally/xml-templates/purchase-voucher";
import { checkTallyConnection, sendXmlToTally } from "../tally/tally-connection";
import { parseTallyResponse, formatTallyErrorDisplay } from "../tally/response-parser";

type XmlType = "customer" | "supplier" | "product" | "sales" | "purchase";

export const XMLPreview: React.FC = () => {
  const [xmlType, setXmlType] = useState<XmlType>("customer");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [xmlContent, setXmlContent] = useState(
    "<!-- Select an XML type and record to generate XML -->"
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tally connection state
  const [tallyHost, setTallyHost] = useState("localhost");
  const [tallyPort, setTallyPort] = useState("9000");
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "success" | "failed">(
    "idle"
  );
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "failed">("idle");
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [responsePreview, setResponsePreview] = useState<string | null>(null);
  const [fullResponseDisplay, setFullResponseDisplay] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, suppliersData, productsData, salesData, purchasesData] =
        await Promise.all([
          getCustomers(),
          getSuppliers(),
          getProducts(),
          getSales(),
          getPurchases(),
        ]);

      setCustomers(customersData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setSales(salesData);
      setPurchases(purchasesData);
      setError(null);
    } catch (err) {
      setError("Failed to load data: " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset selected ID when XML type changes
  useEffect(() => {
    setSelectedId(null);
    setXmlContent("<!-- Select an XML type and record to generate XML -->");
  }, [xmlType]);

  const generateXml = async () => {
    if (selectedId === null) {
      setError("Please select a record");
      return;
    }

    try {
      setError(null);
      let bodyXml = "";

      if (xmlType === "customer") {
        const customer = customers.find((c) => c.id === selectedId);
        if (!customer) throw new Error("Customer not found");
        bodyXml = buildLedgerCreateXml({
          name: customer.name,
          ledgerType: "customer",
          address: customer.address,
          state: customer.state,
          gstin: customer.gstin,
        });
      } else if (xmlType === "supplier") {
        const supplier = suppliers.find((s) => s.id === selectedId);
        if (!supplier) throw new Error("Supplier not found");
        bodyXml = buildLedgerCreateXml({
          name: supplier.name,
          ledgerType: "supplier",
          address: supplier.address,
          state: supplier.state,
          gstin: supplier.gstin,
        });
      } else if (xmlType === "product") {
        const product = products.find((p) => p.id === selectedId);
        if (!product) throw new Error("Product not found");
        bodyXml = buildStockItemXml({
          name: product.name,
          hsnCode: product.hsn_code,
          gstRate: product.gst_rate,
          productType: product.product_type_name,
          unit: product.unit,
        });
      } else if (xmlType === "sales") {
        const sale = sales.find((s) => s.id === selectedId);
        if (!sale) throw new Error("Sale not found");

        // Generate XML for each item in the sale
        const saleItems = await getSaleItems(sale.id);
        if (saleItems.length === 0) throw new Error("Sale has no items");

        // For demo, use first item
        const item = saleItems[0];
        bodyXml = buildSalesVoucherXml({
          voucherDate: sale.voucher_date,
          customerName: sale.customer_name,
          productName: item.product_name,
          qty: item.qty,
          unit: "Bag", // From product, defaulting to Bag for now
          tallyPriceNo1: item.tally_price_no1, // CRITICAL: Using No.1 price
          gstRate: item.gst_rate,
          tallyTaxableAmount: item.tally_taxable_amount,
          gstAmount: item.gst_amount,
          tallyTotalAmount: item.tally_total_amount,
        });
      } else if (xmlType === "purchase") {
        const purchase = purchases.find((p) => p.id === selectedId);
        if (!purchase) throw new Error("Purchase not found");

        // Generate XML for each item in the purchase
        const purchaseItems = await getPurchaseItems(purchase.id);
        if (purchaseItems.length === 0) throw new Error("Purchase has no items");

        // For demo, use first item
        const item = purchaseItems[0];
        bodyXml = buildPurchaseVoucherXml({
          voucherDate: purchase.voucher_date,
          supplierName: purchase.supplier_name,
          supplierInvoiceNumber: purchase.supplier_invoice_number || undefined,
          productName: item.product_name,
          qty: item.qty,
          unit: "Bag", // From product, defaulting to Bag for now
          buyingPrice: item.buying_price,
          gstRate: item.gst_rate,
          taxableAmount: item.taxable_amount,
          gstAmount: item.gst_amount,
          totalAmount: item.total_amount,
        });
      }

      // Use proper envelope based on XML type
      let fullXml: string;
      if (xmlType === "sales" || xmlType === "purchase") {
        // Vouchers use a different envelope structure
        fullXml = buildVoucherEnvelope(bodyXml);
      } else {
        // Masters use the standard master envelope
        fullXml = buildMasterEnvelope({ reportName: "All Masters", bodyXml });
      }
      setXmlContent(fullXml);

      // Track sale/purchase IDs for sync status updates
      if (xmlType === "sales") {
        setSelectedSaleId(selectedId);
      } else if (xmlType === "purchase") {
        setSelectedPurchaseId(selectedId);
      }
    } catch (err) {
      setError("Failed to generate XML: " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    }
  };

  const handleCheckConnection = async () => {
    try {
      setConnectionStatus("checking");
      setConnectionMessage(null);
      setResponsePreview(null);
      setFullResponseDisplay(null);

      const result = await checkTallyConnection({
        host: tallyHost,
        port: tallyPort,
      });

      console.log("✓ Full Tally check response:", result.responseText);

      if (result.success) {
        setConnectionStatus("success");
        setConnectionMessage("✓ Connected to TallyPrime");
        setResponsePreview(result.responseText);
        setFullResponseDisplay(result.responseText);
      } else {
        setConnectionStatus("failed");
        setConnectionMessage("✗ Failed to connect: " + (result.error || "No response"));
        setResponsePreview(result.responseText);
        setFullResponseDisplay(result.responseText);
      }
    } catch (err) {
      setConnectionStatus("failed");
      setConnectionMessage("✗ Error: " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    }
  };

  const handleSendToTally = async () => {
    if (!xmlContent || xmlContent.includes("Select an XML type")) {
      setSendMessage("Please generate XML first");
      return;
    }

    try {
      setSendStatus("sending");
      setSendMessage(null);
      setResponsePreview(null);
      setFullResponseDisplay(null);

      const result = await sendXmlToTally(xmlContent, {
        host: tallyHost,
        port: tallyPort,
      });

      // Log full response to console
      console.log("✓ Full Tally send response:", result.responseText);

      // Parse the response
      const parsed = parseTallyResponse(result.responseText);

      // Format for display
      const displayText = formatTallyErrorDisplay(parsed);
      setFullResponseDisplay(displayText);

      // Save sync log
      await addTallySyncLog({
        entity_type: xmlType,
        entity_id: selectedId || undefined,
        xml_type: xmlType,
        request_xml: xmlContent,
        response_xml: result.responseText,
        status: parsed.success ? "success" : "failed",
        error_message: parsed.readableError || undefined,
      });

      // Update sync status for vouchers
      if (xmlType === "sales" && selectedSaleId) {
        await updateSaleSyncStatus(selectedSaleId, parsed.success ? "success" : "failed");
        // Reload sales data
        const salesData = await getSales();
        setSales(salesData);
      } else if (xmlType === "purchase" && selectedPurchaseId) {
        await updatePurchaseSyncStatus(selectedPurchaseId, parsed.success ? "success" : "failed");
        // Reload purchases data
        const purchasesData = await getPurchases();
        setPurchases(purchasesData);
      }

      if (parsed.success) {
        setSendStatus("success");
        setSendMessage("✓ XML sent successfully to TallyPrime");
      } else {
        setSendStatus("failed");
        setSendMessage("✗ Tally XML import failed");
      }

      setResponsePreview(parsed.readableError || result.responseText);
    } catch (err) {
      setSendStatus("failed");
      setSendMessage("✗ Error: " + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    }
  };

  // Get available records based on XML type
  const getAvailableRecords = () => {
    switch (xmlType) {
      case "customer":
        return customers.map((c) => ({ id: c.id, name: c.name }));
      case "supplier":
        return suppliers.map((s) => ({ id: s.id, name: s.name }));
      case "product":
        return products.map((p) => ({ id: p.id, name: p.name }));
      case "sales":
        return sales.map((s) => ({
          id: s.id,
          name: `${s.voucher_date} - ${s.customer_name}`,
        }));
      case "purchase":
        return purchases.map((p) => ({
          id: p.id,
          name: `${p.voucher_date} - ${p.supplier_name}`,
        }));
      default:
        return [];
    }
  };

  const availableRecords = getAvailableRecords();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">XML Preview</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* XML Type Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate XML</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">XML Type</label>
            <select
              value={xmlType}
              onChange={(e) => setXmlType(e.target.value as XmlType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="customer">Customer Ledger</option>
              <option value="supplier">Supplier Ledger</option>
              <option value="product">Stock Item</option>
              <option value="sales">Sales Voucher</option>
              <option value="purchase">Purchase Voucher</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Record</label>
            <select
              value={selectedId || ""}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select {xmlType} --</option>
              {availableRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateXml}
          disabled={loading || selectedId === null}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate XML
        </button>

        {availableRecords.length === 0 && (
          <p className="text-sm text-gray-600 mt-2">No {xmlType}s available. Create one first.</p>
        )}
      </div>

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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tally Connection</h2>

        {/* Tally Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tally Host</label>
            <input
              type="text"
              value={tallyHost}
              onChange={(e) => setTallyHost(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tally Port</label>
            <input
              type="text"
              value={tallyPort}
              onChange={(e) => setTallyPort(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Connection Buttons */}
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleCheckConnection}
            disabled={connectionStatus === "checking"}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {connectionStatus === "checking" ? "Checking..." : "Check Tally Connection"}
          </button>

          <button
            onClick={handleSendToTally}
            disabled={sendStatus === "sending" || !xmlContent || xmlContent.includes("Select an")}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sendStatus === "sending" ? "Sending..." : "Send to Tally"}
          </button>
        </div>

        {/* Connection Status */}
        {connectionStatus !== "idle" && connectionMessage && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              connectionStatus === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{connectionMessage}</p>
            {fullResponseDisplay && (
              <div className="text-xs mt-3 bg-white text-gray-800 rounded p-3 border border-gray-200 font-mono overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap break-words text-xs">{fullResponseDisplay}</pre>
              </div>
            )}
          </div>
        )}

        {/* Send Status */}
        {sendStatus !== "idle" && sendMessage && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              sendStatus === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{sendMessage}</p>
            {fullResponseDisplay && (
              <div className="text-xs mt-3 bg-white text-gray-800 rounded p-3 border border-gray-200 font-mono overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap break-words text-xs">{fullResponseDisplay}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> This page generates Tally-compatible XML from saved data and sends it to TallyPrime.
          Ensure TallyPrime is running on the specified host and port (default: localhost:9000).
        </p>
      </div>
    </div>
  );
};
