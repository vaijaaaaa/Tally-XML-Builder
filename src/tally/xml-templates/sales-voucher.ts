import { escapeXml, formatDateForTally } from "../xml-builder";

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
 * Build Sales Voucher XML with proper accounting allocations
 * 
 * Amount signs for Sales:
 * - Party ledger (Customer): NEGATIVE (money received)
 * - Sales ledger (ACCOUNTINGALLOCATIONS): POSITIVE (income)
 * - Output GST: POSITIVE (liability)
 * 
 * Example for Sale of 1000 + 50 GST = 1050 total:
 * Party (Customer): -1050
 * Sales (Accounting Allocation): +1000
 * Output GST: +50
 * Total: 0 (balanced)
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

  // Amount calculations for Sales:
  // Customer ledger = negative total (money we receive from customer)
  const customerAmount = -tallyTotalAmount;

  let xml = `          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>${escapeXml(customerName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(customerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${customerAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(productName)}</STOCKITEMNAME>
              <RATE>${tallyPriceNo1}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${tallyTaxableAmount}</AMOUNT>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${escapeXml(salesLedgerName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${tallyTaxableAmount}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;

  // Add GST ledger entries only if GST amount > 0
  if (gstAmount > 0) {
    if (gstType === "inter-state") {
      // Inter-state: Single IGST entry
      xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output IGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
    } else {
      // Intra-state: Split between CGST and SGST (50/50)
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;
      xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${cgstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${sgstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
    }
  }

  // Add round off ledger only if round off amount is non-zero
  if (roundOffAmount && roundOffAmount !== 0) {
    xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Round Off</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${roundOffAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
  }

  xml += `\n          </VOUCHER>`;

  return xml;
}
