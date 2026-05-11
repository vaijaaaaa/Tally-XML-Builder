import { escapeXml, formatDateForTally } from "../xml-builder";
import {
  buildSalesLedgerEntries,
  validateLedgerBalance,
} from "../voucher-builder";

interface SalesVoucherInput {
  voucherDate: string;
  customerName: string;
  salesLedgerName: string; // Required: Sales/Revenue ledger to allocate income
  productName: string;
  qty: number;
  unit: string;
  tallyPriceNo1: number; // IMPORTANT: This is No.1 Tally price, NOT No.0
  gstRate: number;
  tallyTaxableAmount: number;
  gstAmount: number;
  tallyTotalAmount: number;
  gstType?: "intra-state" | "inter-state"; // For GST split: CGST+SGST or IGST
  roundOffAmount?: number;
}

/**
 * Build Sales Voucher XML with proper accounting allocations and debit/credit signs
 * 
 * Ledger Entry Sign Convention for Sales:
 * - Party (Customer/Receivable): POSITIVE amount, isDeemedPositive=false
 * - Sales (Income): NEGATIVE amount, isDeemedPositive=true
 * - Output GST: NEGATIVE amount, isDeemedPositive=true
 * 
 * Example: Sale of 1000 + 50 GST = 1050 total
 * - Customer: +1050, isDeemedPositive=false
 * - Sales: -1000, isDeemedPositive=true
 * - Output CGST: -25, isDeemedPositive=true
 * - Output SGST: -25, isDeemedPositive=true
 * Total: 0 ✓
 * 
 * CRITICAL: Uses tallyPriceNo1 (No.1 price), NOT No.0 selling price
 */
export function buildSalesVoucherXml(input: SalesVoucherInput): string {
  const {
    voucherDate,
    customerName,
    salesLedgerName,
    productName,
    qty,
    unit,
    tallyPriceNo1,
    gstRate,
    tallyTaxableAmount,
    gstAmount,
    tallyTotalAmount,
    gstType = "intra-state",
    roundOffAmount,
  } = input;

  // Validate required fields
  if (!voucherDate || !voucherDate.trim()) {
    throw new Error("Voucher date is required for sales voucher");
  }
  if (!customerName || !customerName.trim()) {
    throw new Error("Customer name is required for sales voucher");
  }
  if (!salesLedgerName || !salesLedgerName.trim()) {
    throw new Error("Sales ledger name is required for sales voucher");
  }
  if (!productName || !productName.trim()) {
    throw new Error("Product name is required for sales voucher");
  }

  const formattedDate = formatDateForTally(voucherDate);

  // Verify formatted date is valid (should be YYYYMMDD, 8 digits)
  if (!formattedDate || !/^\d{8}$/.test(formattedDate)) {
    throw new Error(`Invalid voucher date after formatting: "${formattedDate}"`);
  }

  // Build ledger entries with proper sign handling
  const ledgerEntries = buildSalesLedgerEntries({
    customerName,
    salesLedgerName,
    taxableAmount: tallyTaxableAmount,
    totalAmount: tallyTotalAmount,
    gstAmount,
    gstType,
    roundOffAmount,
  });

  // Validate ledger balance BEFORE generating XML
  const balanceValidation = validateLedgerBalance(ledgerEntries);
  if (!balanceValidation.balanced) {
    throw new Error(balanceValidation.error || "Ledger entries do not balance");
  }

  let xml = `          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>${escapeXml(customerName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>`;

  // Add ledger entries (party, sales, GST)
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
              <RATE>${tallyPriceNo1}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${tallyTaxableAmount}</AMOUNT>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${escapeXml(salesLedgerName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${tallyTaxableAmount}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;

  xml += `\n          </VOUCHER>`;

  return xml;
}
