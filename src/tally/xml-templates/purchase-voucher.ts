import { escapeXml, formatDateForTally } from "../xml-builder";
import {
  buildPurchaseLedgerEntries,
  validateLedgerBalance,
} from "../voucher-builder";

interface PurchaseVoucherInput {
  voucherDate: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  purchaseLedgerName: string; // Required: Purchase ledger to allocate expense
  productName: string;
  qty: number;
  unit: string;
  buyingPrice: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstType?: "intra-state" | "inter-state"; // For GST split: CGST+SGST or IGST
  roundOffAmount?: number;
}

/**
 * Build Purchase Voucher XML with proper accounting allocations and debit/credit signs
 * 
 * Ledger Entry Sign Convention for Purchase:
 * - Party (Supplier/Payable): NEGATIVE amount, isDeemedPositive=true
 * - Purchase (Expense): POSITIVE amount, isDeemedPositive=false
 * - Input GST: POSITIVE amount, isDeemedPositive=false
 * 
 * Example: Purchase of 1000 + 50 GST = 1050 total
 * - Supplier: -1050, isDeemedPositive=true
 * - Purchase: +1000, isDeemedPositive=false
 * - Input CGST: +25, isDeemedPositive=false
 * - Input SGST: +25, isDeemedPositive=false
 * Total: 0 ✓
 */
export function buildPurchaseVoucherXml(input: PurchaseVoucherInput): string {
  const {
    voucherDate,
    supplierName,
    supplierInvoiceNumber,
    purchaseLedgerName,
    productName,
    qty,
    unit,
    buyingPrice,
    taxableAmount,
    gstAmount,
    totalAmount,
    gstType = "intra-state",
    roundOffAmount,
  } = input;

  // Validate required fields
  if (!voucherDate || !voucherDate.trim()) {
    throw new Error("Voucher date is required for purchase voucher");
  }
  if (!supplierName || !supplierName.trim()) {
    throw new Error("Supplier name is required for purchase voucher");
  }
  if (!purchaseLedgerName || !purchaseLedgerName.trim()) {
    throw new Error("Purchase ledger name is required for purchase voucher");
  }
  if (!productName || !productName.trim()) {
    throw new Error("Product name is required for purchase voucher");
  }

  const formattedDate = formatDateForTally(voucherDate);

  // Verify formatted date is valid (should be YYYYMMDD, 8 digits)
  if (!formattedDate || !/^\d{8}$/.test(formattedDate)) {
    throw new Error(`Invalid voucher date after formatting: "${formattedDate}"`);
  }

  // Build ledger entries with proper sign handling
  const ledgerEntries = buildPurchaseLedgerEntries({
    supplierName,
    purchaseLedgerName,
    taxableAmount,
    totalAmount,
    gstAmount,
    gstType,
    roundOffAmount,
  });

  // Validate ledger balance BEFORE generating XML
  const balanceValidation = validateLedgerBalance(ledgerEntries);
  if (!balanceValidation.balanced) {
    throw new Error(balanceValidation.error || "Ledger entries do not balance");
  }

  let xml = `          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>`;

  if (supplierInvoiceNumber) {
    xml += `\n            <REFERENCE>${escapeXml(supplierInvoiceNumber)}</REFERENCE>`;
  }

  xml += `\n            <PARTYLEDGERNAME>${escapeXml(supplierName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>`;

  // Add ledger entries (party, purchase, GST)
  for (const entry of ledgerEntries) {
    xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(entry.name)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${entry.isDeemedPositive ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
              <AMOUNT>${entry.amount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
  }

  // Add inventory entry with accounting allocation
  xml += `\n            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(productName)}</STOCKITEMNAME>
              <RATE>${buyingPrice}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${taxableAmount}</AMOUNT>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${escapeXml(purchaseLedgerName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${taxableAmount}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;

  xml += `\n          </VOUCHER>`;

  return xml;
}
