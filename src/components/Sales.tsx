import React, { useState, useEffect } from "react";
import {
  getCustomers,
  getProducts,
  addSale,
  getSales,
  Customer,
  Product,
  Sale,
} from "../lib/db";

export const Sales: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    quantity: "",
  });

  const [calculations, setCalculations] = useState({
    actualAmount: 0,
    tallyTaxableAmount: 0,
    gstAmount: 0,
    tallyTotal: 0,
  });

  // Load customers, products, and sales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, productsData, salesData] = await Promise.all([
          getCustomers(),
          getProducts(),
          getSales(),
        ]);
        setCustomers(customersData);
        setProducts(productsData);
        setSales(salesData);
      } catch (err) {
        setError("Failed to load data: " + String(err));
      }
    };

    loadData();
  }, []);

  // Calculate when quantity or product changes
  useEffect(() => {
    if (!formData.productId || !formData.quantity) {
      setCalculations({
        actualAmount: 0,
        tallyTaxableAmount: 0,
        gstAmount: 0,
        tallyTotal: 0,
      });
      return;
    }

    const product = products.find((p) => p.id === Number(formData.productId));
    if (!product) return;

    const qty = Number(formData.quantity) || 0;
    const actualAmount = qty * product.selling_price_no0;
    const tallyTaxableAmount = qty * product.tally_price_no1;
    const gstAmount = tallyTaxableAmount * (product.gst_rate / 100);
    const tallyTotal = tallyTaxableAmount + gstAmount;

    setCalculations({
      actualAmount,
      tallyTaxableAmount,
      gstAmount,
      tallyTotal,
    });
  }, [formData.productId, formData.quantity, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSale = async () => {
    if (!formData.customerId || !formData.productId || !formData.quantity) {
      setError("Please fill in all fields");
      return;
    }

    const customer = customers.find((c) => c.id === Number(formData.customerId));
    const product = products.find((p) => p.id === Number(formData.productId));

    if (!customer || !product) {
      setError("Invalid customer or product");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addSale({
        voucher_date: new Date().toISOString().split("T")[0],
        customer_id: customer.id,
        customer_name: customer.name,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            qty: Number(formData.quantity),
            selling_price_no0: product.selling_price_no0,
            tally_price_no1: product.tally_price_no1,
            gst_rate: product.gst_rate,
          },
        ],
      });

      // Reset form
      setFormData({
        customerId: "",
        productId: "",
        quantity: "",
      });

      // Reload sales
      const updatedSales = await getSales();
      setSales(updatedSales);
    } catch (err) {
      setError("Failed to save sale: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Sales</h1>

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          <strong>Important:</strong> Tally XML will use No.1 price. No.0 is the actual selling price.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Sales Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Sales Voucher</h2>

        {customers.length === 0 || products.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              ℹ️ Please create customers and products in the Admin section first.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
            </div>

            {/* Calculation Preview */}
            {formData.productId && formData.quantity && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Calculation Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Actual Amount (No.0)</p>
                    <p className="text-lg font-bold text-blue-600">₹{calculations.actualAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tally Taxable (No.1)</p>
                    <p className="text-lg font-bold text-indigo-600">₹{calculations.tallyTaxableAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">GST Amount</p>
                    <p className="text-lg font-bold text-amber-600">₹{calculations.gstAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tally Total</p>
                    <p className="text-lg font-bold text-green-600">₹{calculations.tallyTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveSale}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Save Sale"}
            </button>
          </>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Sales ({sales.length})
        </h2>

        {sales.length === 0 ? (
          <p className="text-gray-600 text-sm">No sales added yet. Create your first sale using the form above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Customer</th>
                  <th className="text-right py-2 px-4">Actual Amount</th>
                  <th className="text-right py-2 px-4">Tally Amount</th>
                  <th className="text-right py-2 px-4">GST</th>
                  <th className="text-right py-2 px-4">Grand Total</th>
                  <th className="text-left py-2 px-4">Sync Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-4">{new Date(sale.voucher_date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{sale.customer_name}</td>
                    <td className="text-right py-2 px-4">₹{sale.total_actual_amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4">₹{sale.total_tally_amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4">₹{sale.total_gst_amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4 font-semibold">₹{sale.grand_total.toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {sale.tally_sync_status}
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
