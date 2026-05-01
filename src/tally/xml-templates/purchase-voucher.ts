import { escapeXml, formatDateForTally } from "../xml-builder";

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
 * Build Purchase Voucher XML with proper accounting allocations
 * 
 * Amount signs for Purchase:
 * - Supplier ledger: POSITIVE (money we owe to supplier)
 * - Purchase ledger (ACCOUNTINGALLOCATIONS): NEGATIVE (expense)
 * - Input GST: NEGATIVE (recoverable tax)
 * 
 * Example for Purchase of 1000 + 50 GST = 1050 total:
 * Supplier: +1050
 * Purchase (Accounting Allocation): -1000
 * Input GST: -50
 * Total: 0 (balanced)
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

  // Amount calculations for Purchase:
  // Supplier ledger = positive total (money we owe to supplier)
  const supplierAmount = totalAmount;

  let xml = `          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>`;

  if (supplierInvoiceNumber) {
    xml += `\n            <REFERENCE>${escapeXml(supplierInvoiceNumber)}</REFERENCE>`;
  }

  xml += `\n            <PARTYLEDGERNAME>${escapeXml(supplierName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(supplierName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${supplierAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(productName)}</STOCKITEMNAME>
              <RATE>${buyingPrice}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${taxableAmount}</AMOUNT>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${escapeXml(purchaseLedgerName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${taxableAmount}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;

  // Add GST ledger entries only if GST amount > 0
  if (gstAmount > 0) {
    if (gstType === "inter-state") {
      // Inter-state: Single IGST entry (negative for input tax)
      xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Input IGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${gstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
    } else {
      // Intra-state: Split between IGST and SGST (50/50)
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;
      xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Input CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${cgstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Input SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${sgstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
    }
  }

  // Add round off ledger only if round off amount is non-zero
  if (roundOffAmount && roundOffAmount !== 0) {
    xml += `\n            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Round Off</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${roundOffAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>`;
  }

  xml += `\n          </VOUCHER>`;

  return xml;
}
