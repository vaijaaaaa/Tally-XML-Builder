/**
 * Voucher Builder Examples and Tests
 * 
 * This file demonstrates correct usage of the voucher builder with proper
 * debit/credit sign handling and ledger balance validation.
 */

import {
  LedgerEntry,
  buildSalesLedgerEntries,
  buildPurchaseLedgerEntries,
  validateLedgerBalance,
} from "./voucher-builder";

/**
 * Example 1: Valid Sales Voucher
 * 
 * Sale of 1000 + 50 GST = 1050 total
 * Expected ledger entries:
 * - Customer (Receivable): +1050, isDeemedPositive=false
 * - Sales (Income): -1000, isDeemedPositive=true
 * - Output CGST: -25, isDeemedPositive=true
 * - Output SGST: -25, isDeemedPositive=true
 * Total: 0 ✓
 */
export function exampleValidSalesVoucher() {
  console.log("\n=== EXAMPLE 1: Valid Sales Voucher ===");
  console.log("Scenario: Sale of 1000 + 50 GST = 1050 total");

  try {
    const entries = buildSalesLedgerEntries({
      customerName: "Raj Kumar (Customer)",
      salesLedgerName: "Sales/Revenue",
      taxableAmount: 1000,
      totalAmount: 1050,
      gstAmount: 50,
      gstType: "intra-state",
    });

    console.log("\nGenerated Ledger Entries:");
    entries.forEach((e) => {
      console.log(
        `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
      );
    });

    const validation = validateLedgerBalance(entries);
    console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

    if (validation.balanced) {
      console.log("✓ VALID: All ledger entries balance to 0");
    } else {
      console.log(`✗ ERROR: ${validation.error}`);
    }
  } catch (error) {
    console.error(`✗ FAILED: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Example 2: Valid Purchase Voucher
 * 
 * Purchase of 1000 + 50 GST = 1050 total
 * Expected ledger entries:
 * - Supplier (Payable): -1050, isDeemedPositive=true
 * - Purchase (Expense): +1000, isDeemedPositive=false
 * - Input CGST: +25, isDeemedPositive=false
 * - Input SGST: +25, isDeemedPositive=false
 * Total: 0 ✓
 */
export function exampleValidPurchaseVoucher() {
  console.log("\n=== EXAMPLE 2: Valid Purchase Voucher ===");
  console.log("Scenario: Purchase of 1000 + 50 GST = 1050 total");

  try {
    const entries = buildPurchaseLedgerEntries({
      supplierName: "ABC Supplies (Supplier)",
      purchaseLedgerName: "Purchase/Expense",
      taxableAmount: 1000,
      totalAmount: 1050,
      gstAmount: 50,
      gstType: "intra-state",
    });

    console.log("\nGenerated Ledger Entries:");
    entries.forEach((e) => {
      console.log(
        `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
      );
    });

    const validation = validateLedgerBalance(entries);
    console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

    if (validation.balanced) {
      console.log("✓ VALID: All ledger entries balance to 0");
    } else {
      console.log(`✗ ERROR: ${validation.error}`);
    }
  } catch (error) {
    console.error(`✗ FAILED: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Example 3: Invalid Voucher - Both ledgers positive (WRONG!)
 * 
 * This demonstrates an incorrect voucher structure where both ledgers are positive.
 * The validator should catch this and report the imbalance.
 */
export function exampleInvalidVoucher_BothPositive() {
  console.log("\n=== EXAMPLE 3: Invalid Voucher (Both Ledgers Positive) ===");
  console.log("Scenario: Customer +1050, Sales +1050 (WRONG!)");

  const entries: LedgerEntry[] = [
    { name: "Customer", amount: 1050, isDeemedPositive: false },
    { name: "Sales", amount: 1050, isDeemedPositive: true },
  ];

  console.log("\nLedger Entries (Manually Created):");
  entries.forEach((e) => {
    console.log(
      `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
    );
  });

  const validation = validateLedgerBalance(entries);
  console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

  if (!validation.balanced) {
    console.log(`✗ INVALID: ${validation.error}`);
  }
}

/**
 * Example 4: Invalid Voucher - Missing ledger entry
 * 
 * This shows what happens when one required ledger entry is missing.
 */
export function exampleInvalidVoucher_MissingEntry() {
  console.log("\n=== EXAMPLE 4: Invalid Voucher (Missing Entry) ===");
  console.log("Scenario: Only customer entry, missing sales entry");

  const entries: LedgerEntry[] = [
    { name: "Customer", amount: 1050, isDeemedPositive: false },
  ];

  console.log("\nLedger Entries (Manually Created):");
  entries.forEach((e) => {
    console.log(
      `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
    );
  });

  const validation = validateLedgerBalance(entries);
  console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

  if (!validation.balanced) {
    console.log(`✗ INVALID: ${validation.error}`);
  }
}

/**
 * Example 5: Inter-state GST (IGST instead of CGST+SGST)
 * 
 * For inter-state sales, use single IGST instead of splitting between CGST and SGST.
 */
export function exampleInterStateGst() {
  console.log("\n=== EXAMPLE 5: Inter-state GST (Single IGST) ===");
  console.log("Scenario: Sale with IGST (inter-state transaction)");

  try {
    const entries = buildSalesLedgerEntries({
      customerName: "Customer (Inter-state)",
      salesLedgerName: "Sales",
      taxableAmount: 1000,
      totalAmount: 1050,
      gstAmount: 50,
      gstType: "inter-state", // Note: inter-state GST
    });

    console.log("\nGenerated Ledger Entries:");
    entries.forEach((e) => {
      console.log(
        `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
      );
    });

    const validation = validateLedgerBalance(entries);
    console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

    if (validation.balanced) {
      console.log("✓ VALID: Single IGST entry, ledger balances to 0");
    }
  } catch (error) {
    console.error(`✗ FAILED: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Example 6: With Round Off
 * 
 * Demonstrates including a round-off ledger entry when there's rounding difference.
 */
export function exampleWithRoundOff() {
  console.log("\n=== EXAMPLE 6: With Round Off Ledger ===");
  console.log("Scenario: Sale with 0.50 rounding difference");

  try {
    const entries = buildSalesLedgerEntries({
      customerName: "Customer",
      salesLedgerName: "Sales",
      taxableAmount: 1000.33,
      totalAmount: 1050.83,
      gstAmount: 50.5,
      gstType: "intra-state",
      roundOffAmount: 0.5, // Include round-off entry
    });

    console.log("\nGenerated Ledger Entries:");
    entries.forEach((e) => {
      console.log(
        `  ${e.name.padEnd(20)} | Amount: ${String(e.amount).padStart(8)} | isDeemedPositive: ${e.isDeemedPositive}`
      );
    });

    const validation = validateLedgerBalance(entries);
    console.log(`\nTotal: ${validation.total} (Balanced: ${validation.balanced ? "✓ YES" : "✗ NO"})`);

    if (validation.balanced) {
      console.log("✓ VALID: Round-off entry included, ledger balances to 0");
    }
  } catch (error) {
    console.error(`✗ FAILED: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║      TALLY VOUCHER BUILDER - EXAMPLES AND TESTS         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  exampleValidSalesVoucher();
  exampleValidPurchaseVoucher();
  exampleInvalidVoucher_BothPositive();
  exampleInvalidVoucher_MissingEntry();
  exampleInterStateGst();
  exampleWithRoundOff();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    EXAMPLES COMPLETE                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

// Auto-run examples if this file is executed directly
if (typeof module !== "undefined" && require.main === module) {
  runAllExamples();
}
