import { escapeXml, formatDateForTally } from "../xml-builder";

interface PurchaseVoucherInput {
  voucherDate: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  productName: string;
  qty: number;
  unit: string;
  buyingPrice: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

/**
 * Build Purchase Voucher XML
 * Uses buying price and Input GST
 * Used in "Vouchers" report
 */
export function buildPurchaseVoucherXml(input: PurchaseVoucherInput): string {
  const {
    voucherDate,
    supplierName,
    supplierInvoiceNumber,
    productName,
    qty,
    unit,
    buyingPrice,
    taxableAmount,
    gstAmount,
    totalAmount,
  } = input;

  // Validate required fields
  if (!voucherDate || !voucherDate.trim()) {
    throw new Error("Voucher date is required for purchase voucher");
  }
  if (!supplierName || !supplierName.trim()) {
    throw new Error("Supplier name is required for purchase voucher");
  }
  if (!productName || !productName.trim()) {
    throw new Error("Product name is required for purchase voucher");
  }

  const formattedDate = formatDateForTally(voucherDate);
  
  // Verify formatted date is valid (should be YYYYMMDD, 8 digits)
  if (!formattedDate || !/^\d{8}$/.test(formattedDate)) {
    throw new Error(`Invalid voucher date after formatting: "${formattedDate}"`);
  }

  // Supplier ledger amount is positive (payment to be made)
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
            </ALLINVENTORYENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Input GST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gstAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
          </VOUCHER>`;

  return xml;
}
