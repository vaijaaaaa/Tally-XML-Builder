import { escapeXml, formatDateForTally } from "../xml-builder";

interface SalesVoucherInput {
  voucherDate: string;
  customerName: string;
  productName: string;
  qty: number;
  unit: string;
  tallyPriceNo1: number; // IMPORTANT: This is No.1 Tally price, NOT No.0
  gstRate: number;
  tallyTaxableAmount: number;
  gstAmount: number;
  tallyTotalAmount: number;
}

/**
 * Build Sales Voucher XML
 * CRITICAL: Uses tallyPriceNo1 (No.1 price), NOT No.0 selling price
 * Used in "Vouchers" report
 */
export function buildSalesVoucherXml(input: SalesVoucherInput): string {
  const {
    voucherDate,
    customerName,
    productName,
    qty,
    unit,
    tallyPriceNo1, // Using No.1 price
    tallyTaxableAmount,
    gstAmount,
    tallyTotalAmount,
  } = input;

  // Validate required fields
  if (!voucherDate || !voucherDate.trim()) {
    throw new Error("Voucher date is required for sales voucher");
  }
  if (!customerName || !customerName.trim()) {
    throw new Error("Customer name is required for sales voucher");
  }
  if (!productName || !productName.trim()) {
    throw new Error("Product name is required for sales voucher");
  }

  const formattedDate = formatDateForTally(voucherDate);
  
  // Verify formatted date is valid (should be YYYYMMDD, 8 digits)
  if (!formattedDate || !/^\d{8}$/.test(formattedDate)) {
    throw new Error(`Invalid voucher date after formatting: "${formattedDate}"`);
  }

  // Customer ledger amount is negative of total (payment received)
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
            </ALLINVENTORYENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Output GST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
          </VOUCHER>`;

  return xml;
}
