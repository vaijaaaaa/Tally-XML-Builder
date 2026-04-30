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

  const formattedDate = formatDateForTally(voucherDate);

  // Customer ledger amount is negative of total (payment received)
  const customerAmount = -tallyTotalAmount;

  let xml = `          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>${escapeXml(customerName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(customerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${customerAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(productName)}</STOCKITEMNAME>
              <RATE>${tallyPriceNo1}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${tallyTaxableAmount}</AMOUNT>
            </ALLINVENTORYENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output GST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gstAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>`;

  return xml;
}
