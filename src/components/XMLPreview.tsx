import React, { useState, useEffect } from "react";
import {
  getCustomers,
  getSuppliers,
  getProducts,
  getSales,
  getSaleItems,
  getPurchases,
  getPurchaseItems,
  Customer,
  Supplier,
  Product,
  Sale,
  Purchase,
} from "../lib/db";
import { buildTallyEnvelope } from "../tally/xml-builder";
import { buildLedgerCreateXml } from "../tally/xml-templates/ledger-create";
import { buildStockItemXml } from "../tally/xml-templates/stock-item";
import { buildSalesVoucherXml } from "../tally/xml-templates/sales-voucher";
import { buildPurchaseVoucherXml } from "../tally/xml-templates/purchase-voucher";

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
      let reportName: "All Masters" | "Vouchers" = "All Masters";

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
        reportName = "Vouchers";
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
        reportName = "Vouchers";
      }

      const fullXml = buildTallyEnvelope({ reportName, bodyXml });
      setXmlContent(fullXml);
    } catch (err) {
      setError("Failed to generate XML: " + (err instanceof Error ? err.message : String(err)));
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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            disabled
            className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed"
            title="Not yet implemented"
          >
            Check Tally Connection
          </button>

          <button
            disabled
            className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed"
            title="Not yet implemented"
          >
            Send to Tally
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> This page generates Tally-compatible XML from saved data. 
          Check Connection and Send to Tally will be available in a future update.
        </p>
      </div>
    </div>
  );
};
