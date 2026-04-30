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

  const formattedDate = formatDateForTally(voucherDate);

  // Supplier ledger amount is positive (payment to be made)
  const supplierAmount = totalAmount;

  let xml = `          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>`;

  if (supplierInvoiceNumber) {
    xml += `\n            <REFERENCE>${escapeXml(supplierInvoiceNumber)}</REFERENCE>`;
  }

  xml += `\n            <PARTYLEDGERNAME>${escapeXml(supplierName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(supplierName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${supplierAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(productName)}</STOCKITEMNAME>
              <RATE>${buyingPrice}/${escapeXml(unit)}</RATE>
              <ACTUALQTY>${qty} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${qty} ${escapeXml(unit)}</BILLEDQTY>
              <AMOUNT>${taxableAmount}</AMOUNT>
            </ALLINVENTORYENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input GST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${gstAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>`;

  return xml;
}
