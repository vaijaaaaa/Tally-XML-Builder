import React, { useState, useEffect } from "react";
import {
  getSuppliers,
  getProducts,
  addPurchase,
  getPurchases,
  Supplier,
  Product,
  Purchase as PurchaseType,
} from "../lib/db";

export const Purchase: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    buyingPrice: "",
    invoiceNumber: "",
    expiryDate: "",
  });

  const [calculations, setCalculations] = useState({
    taxableAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  // Load suppliers, products, and purchases
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, productsData, purchasesData] = await Promise.all([
          getSuppliers(),
          getProducts(),
          getPurchases(),
        ]);
        setSuppliers(suppliersData);
        setProducts(productsData);
        setPurchases(purchasesData);
      } catch (err) {
        setError("Failed to load data: " + String(err));
      }
    };

    loadData();
  }, []);

  // Calculate when quantity or buying price changes
  useEffect(() => {
    if (!formData.productId || !formData.quantity || !formData.buyingPrice) {
      setCalculations({
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const product = products.find((p) => p.id === Number(formData.productId));
    if (!product) return;

    const qty = Number(formData.quantity) || 0;
    const buyingPrice = Number(formData.buyingPrice) || 0;
    const taxableAmount = qty * buyingPrice;
    const gstAmount = taxableAmount * (product.gst_rate / 100);
    const totalAmount = taxableAmount + gstAmount;

    setCalculations({
      taxableAmount,
      gstAmount,
      totalAmount,
    });
  }, [formData.productId, formData.quantity, formData.buyingPrice, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePurchase = async () => {
    if (!formData.supplierId || !formData.productId || !formData.quantity || !formData.buyingPrice) {
      setError("Please fill in all required fields");
      return;
    }

    const supplier = suppliers.find((s) => s.id === Number(formData.supplierId));
    const product = products.find((p) => p.id === Number(formData.productId));

    if (!supplier || !product) {
      setError("Invalid supplier or product");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addPurchase({
        voucher_date: new Date().toISOString().split("T")[0],
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_invoice_number: formData.invoiceNumber,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            qty: Number(formData.quantity),
            buying_price: Number(formData.buyingPrice),
            gst_rate: product.gst_rate,
            expiry_date: formData.expiryDate,
          },
        ],
      });

      // Reset form
      setFormData({
        supplierId: "",
        productId: "",
        quantity: "",
        buyingPrice: "",
        invoiceNumber: "",
        expiryDate: "",
      });

      // Reload purchases
      const updatedPurchases = await getPurchases();
      setPurchases(updatedPurchases);
    } catch (err) {
      setError("Failed to save purchase: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Purchase</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Purchase Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Purchase Voucher</h2>

        {suppliers.length === 0 || products.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              ℹ️ Please create suppliers and products in the Admin section first.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Invoice number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buying Price
                </label>
                <input
                  type="number"
                  name="buyingPrice"
                  value={formData.buyingPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
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

            {/* Calculation Preview */}
            {formData.productId && formData.quantity && formData.buyingPrice && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Calculation Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Taxable Amount</p>
                    <p className="text-lg font-bold text-emerald-600">₹{calculations.taxableAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">GST Amount</p>
                    <p className="text-lg font-bold text-amber-600">₹{calculations.gstAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-teal-600">₹{calculations.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSavePurchase}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save Purchase"}
            </button>
          </>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Purchases ({purchases.length})
        </h2>

        {purchases.length === 0 ? (
          <p className="text-gray-600 text-sm">No purchases added yet. Create your first purchase using the form above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Supplier</th>
                  <th className="text-left py-2 px-4">Invoice No</th>
                  <th className="text-right py-2 px-4">Taxable Amount</th>
                  <th className="text-right py-2 px-4">GST</th>
                  <th className="text-right py-2 px-4">Grand Total</th>
                  <th className="text-left py-2 px-4">Sync Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-4">{new Date(purchase.voucher_date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{purchase.supplier_name}</td>
                    <td className="py-2 px-4">{purchase.supplier_invoice_number || "-"}</td>
                    <td className="text-right py-2 px-4">₹{purchase.total_taxable_amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4">₹{purchase.total_gst_amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4 font-semibold">₹{purchase.grand_total.toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {purchase.tally_sync_status}
                      </span>
                    </td>
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
