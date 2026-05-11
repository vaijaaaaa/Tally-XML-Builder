/**
 * Voucher Builder Helper Functions
 * Handles proper debit/credit sign conventions for Tally
 * 
 * Tally Amount Sign Convention:
 * - Positive amount: Money flowing in / increasing
 * - Negative amount: Money flowing out / decreasing
 * - ISDEEMEDPOSITIVE: How to interpret the sign in accounting
 */

export interface LedgerEntry {
  name: string;
  amount: number;
  isDeemedPositive: boolean;
}

/**
 * Normalize amount to safe number
 */
export function normalizeAmount(amount: any): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return num;
}

/**
 * Validate ledger balance (within tolerance)
 */
export function validateLedgerBalance(entries: LedgerEntry[]): {
  balanced: boolean;
  total: number;
  error?: string;
} {
  let total = 0;
  
  for (const entry of entries) {
    if (!entry.name || !entry.name.trim()) {
      return {
        balanced: false,
        total,
        error: `Ledger entry has empty name`,
      };
    }
    if (typeof entry.amount !== 'number' || !isFinite(entry.amount)) {
      return {
        balanced: false,
        total,
        error: `Ledger entry "${entry.name}" has invalid amount: ${entry.amount}`,
      };
    }
    total += entry.amount;
  }

  // Allow for floating point rounding errors (within 0.01)
  const balanced = Math.abs(total) <= 0.01;
  total = parseFloat(total.toFixed(2));

  return {
    balanced,
    total,
    error: balanced ? undefined : `Ledger entries do not balance. Total: ${total} (expected: 0)`,
  };
}

/**
 * Build Sales Voucher Ledger Entries
 * 
 * For Sales voucher (customer buys from us):
 * - Party (Receivable): POSITIVE amount, ISDEEMEDPOSITIVE=false (credit entry shown positive)
 * - Sales Income: NEGATIVE amount, ISDEEMEDPOSITIVE=true (debit entry shown negative)
 * - Output GST: NEGATIVE amount, ISDEEMEDPOSITIVE=true (debit entry shown negative)
 * 
 * Example: 1000 sale + 50 GST = 1050 total
 * - Customer: +1050, isDeemedPositive=false
 * - Sales: -1000, isDeemedPositive=true
 * - Output CGST: -25, isDeemedPositive=true
 * - Output SGST: -25, isDeemedPositive=true
 * Total: 0 ✓
 */
export function buildSalesLedgerEntries(params: {
  customerName: string;
  salesLedgerName: string;
  taxableAmount: number;
  totalAmount: number;
  gstAmount: number;
  gstType: 'intra-state' | 'inter-state';
  roundOffAmount?: number;
}): LedgerEntry[] {
  const {
    customerName,
    salesLedgerName,
    taxableAmount,
    totalAmount,
    gstAmount,
    gstType,
    roundOffAmount,
  } = params;

  // Validate inputs
  if (!customerName?.trim()) throw new Error('Customer name is required');
  if (!salesLedgerName?.trim()) throw new Error('Sales ledger name is required');
  if (typeof taxableAmount !== 'number' || !isFinite(taxableAmount)) {
    throw new Error(`Invalid taxable amount: ${taxableAmount}`);
  }
  if (typeof totalAmount !== 'number' || !isFinite(totalAmount)) {
    throw new Error(`Invalid total amount: ${totalAmount}`);
  }

  const entries: LedgerEntry[] = [];

  // Party ledger: POSITIVE (money received from customer)
  // ISDEEMEDPOSITIVE=false means treat this positive amount as a credit entry
  entries.push({
    name: customerName,
    amount: totalAmount, // POSITIVE: receivable increases
    isDeemedPositive: false, // Credit entry
  });

  // Sales/Income: NEGATIVE (revenue we earned)
  // ISDEEMEDPOSITIVE=true means treat this negative amount as a debit entry
  entries.push({
    name: salesLedgerName,
    amount: -taxableAmount, // NEGATIVE: income decreases balance (it's a credit)
    isDeemedPositive: true, // Debit entry
  });

  // GST entries (only if GST amount > 0)
  if (gstAmount > 0) {
    if (gstType === 'inter-state') {
      // Inter-state: Single IGST entry
      entries.push({
        name: 'Output IGST',
        amount: -gstAmount, // NEGATIVE: tax liability
        isDeemedPositive: true, // Debit entry
      });
    } else {
      // Intra-state: Split between CGST and SGST
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;
      entries.push({
        name: 'Output CGST',
        amount: -cgstAmount, // NEGATIVE: tax liability
        isDeemedPositive: true, // Debit entry
      });
      entries.push({
        name: 'Output SGST',
        amount: -sgstAmount, // NEGATIVE: tax liability
        isDeemedPositive: true, // Debit entry
      });
    }
  }

  // Round Off (only if non-zero)
  if (roundOffAmount && roundOffAmount !== 0) {
    entries.push({
      name: 'Round Off',
      amount: -roundOffAmount, // NEGATIVE
      isDeemedPositive: true,
    });
  }

  return entries;
}

/**
 * Build Purchase Voucher Ledger Entries
 * 
 * For Purchase voucher (we buy from supplier):
 * - Party (Payable): NEGATIVE amount, ISDEEMEDPOSITIVE=true (debit entry shown negative)
 * - Purchase Expense: POSITIVE amount, ISDEEMEDPOSITIVE=false (credit entry shown positive)
 * - Input GST: POSITIVE amount, ISDEEMEDPOSITIVE=false (credit entry shown positive)
 * 
 * Example: 1000 purchase + 50 GST = 1050 total
 * - Supplier: -1050, isDeemedPositive=true
 * - Purchase: +1000, isDeemedPositive=false
 * - Input CGST: +25, isDeemedPositive=false
 * - Input SGST: +25, isDeemedPositive=false
 * Total: 0 ✓
 */
export function buildPurchaseLedgerEntries(params: {
  supplierName: string;
  purchaseLedgerName: string;
  taxableAmount: number;
  totalAmount: number;
  gstAmount: number;
  gstType: 'intra-state' | 'inter-state';
  roundOffAmount?: number;
}): LedgerEntry[] {
  const {
    supplierName,
    purchaseLedgerName,
    taxableAmount,
    totalAmount,
    gstAmount,
    gstType,
    roundOffAmount,
  } = params;

  // Validate inputs
  if (!supplierName?.trim()) throw new Error('Supplier name is required');
  if (!purchaseLedgerName?.trim()) throw new Error('Purchase ledger name is required');
  if (typeof taxableAmount !== 'number' || !isFinite(taxableAmount)) {
    throw new Error(`Invalid taxable amount: ${taxableAmount}`);
  }
  if (typeof totalAmount !== 'number' || !isFinite(totalAmount)) {
    throw new Error(`Invalid total amount: ${totalAmount}`);
  }

  const entries: LedgerEntry[] = [];

  // Party ledger: NEGATIVE (money we owe to supplier)
  // ISDEEMEDPOSITIVE=true means treat this negative amount as a debit entry
  entries.push({
    name: supplierName,
    amount: -totalAmount, // NEGATIVE: payable increases (we owe more)
    isDeemedPositive: true, // Debit entry
  });

  // Purchase/Expense: POSITIVE (expense we incurred)
  // ISDEEMEDPOSITIVE=false means treat this positive amount as a credit entry
  entries.push({
    name: purchaseLedgerName,
    amount: taxableAmount, // POSITIVE: expense increases
    isDeemedPositive: false, // Credit entry
  });

  // GST entries (only if GST amount > 0)
  if (gstAmount > 0) {
    if (gstType === 'inter-state') {
      // Inter-state: Single IGST entry
      entries.push({
        name: 'Input IGST',
        amount: gstAmount, // POSITIVE: recoverable tax
        isDeemedPositive: false, // Credit entry
      });
    } else {
      // Intra-state: Split between CGST and SGST
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;
      entries.push({
        name: 'Input CGST',
        amount: cgstAmount, // POSITIVE: recoverable tax
        isDeemedPositive: false, // Credit entry
      });
      entries.push({
        name: 'Input SGST',
        amount: sgstAmount, // POSITIVE: recoverable tax
        isDeemedPositive: false, // Credit entry
      });
    }
  }

  // Round Off (only if non-zero)
  if (roundOffAmount && roundOffAmount !== 0) {
    entries.push({
      name: 'Round Off',
      amount: roundOffAmount, // POSITIVE
      isDeemedPositive: false,
    });
  }

  return entries;
}

/**
 * Example and test cases
 */
export function exampleValidSalesVoucher() {
  console.log('\n=== EXAMPLE: Valid Sales Voucher (1000 + 50 GST = 1050 total) ===');
  
  const entries = buildSalesLedgerEntries({
    customerName: 'Raj Kumar',
    salesLedgerName: 'Sales',
    taxableAmount: 1000,
    totalAmount: 1050,
    gstAmount: 50,
    gstType: 'intra-state',
  });

  console.log('Ledger Entries:');
  entries.forEach(e => {
    console.log(`  ${e.name}: ${e.amount} (isDeemedPositive: ${e.isDeemedPositive})`);
  });

  const validation = validateLedgerBalance(entries);
  console.log(`Total: ${validation.total} (Balanced: ${validation.balanced})`);
  if (!validation.balanced) console.error(`Error: ${validation.error}`);
}

export function exampleValidPurchaseVoucher() {
  console.log('\n=== EXAMPLE: Valid Purchase Voucher (1000 + 50 GST = 1050 total) ===');
  
  const entries = buildPurchaseLedgerEntries({
    supplierName: 'ABC Supplies',
    purchaseLedgerName: 'Purchase',
    taxableAmount: 1000,
    totalAmount: 1050,
    gstAmount: 50,
    gstType: 'intra-state',
  });

  console.log('Ledger Entries:');
  entries.forEach(e => {
    console.log(`  ${e.name}: ${e.amount} (isDeemedPositive: ${e.isDeemedPositive})`);
  });

  const validation = validateLedgerBalance(entries);
  console.log(`Total: ${validation.total} (Balanced: ${validation.balanced})`);
  if (!validation.balanced) console.error(`Error: ${validation.error}`);
}

export function exampleInvalidVoucher() {
  console.log('\n=== EXAMPLE: Invalid Voucher (both ledgers positive) ===');
  
  const entries: LedgerEntry[] = [
    { name: 'Customer', amount: 1050, isDeemedPositive: false },
    { name: 'Sales', amount: 1050, isDeemedPositive: true },
  ];

  console.log('Ledger Entries:');
  entries.forEach(e => {
    console.log(`  ${e.name}: ${e.amount} (isDeemedPositive: ${e.isDeemedPositive})`);
  });

  const validation = validateLedgerBalance(entries);
  console.log(`Total: ${validation.total} (Balanced: ${validation.balanced})`);
  if (!validation.balanced) console.error(`Error: ${validation.error}`);
}
