/**
 * Tally Voucher Validator
 * Validates voucher XML structure before sending to Tally
 */

export interface VoucherValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    dateFormat: boolean;
    effectiveDateFormat: boolean;
    voucherTypeExists: boolean;
    partyLedgerExists: boolean;
    partyLedgerNonEmpty: boolean;
    salesPurchaseLedgerExists: boolean;
    salesPurchaseLedgerNonEmpty: boolean;
    inventoryItemsExist: boolean;
    stockItemsHaveRequiredFields: boolean;
    accountingAllocationsExist: boolean;
    accountingAllocationAmountsMatch: boolean;
    ledgerNamesNonEmpty: boolean;
    amountsAreNumbers: boolean;
    ledgerBalance: { balanced: boolean; total: number };
    gstValidation: boolean;
    roundOffValidation: boolean;
  };
}

interface VoucherData {
  date?: string;
  effectiveDate?: string;
  voucherType?: string;
  partyLedger?: string;
  ledgerEntries?: Array<{
    name?: string;
    amount?: number | string;
  }>;
  inventoryEntries?: Array<{
    stockItemName?: string;
    rate?: string;
    actualQty?: string;
    billedQty?: string;
    amount?: number | string;
    accountingAllocations?: Array<{
      ledgerName?: string;
      amount?: number | string;
    }>;
  }>;
  gstEntries?: Array<{
    type: "CGST" | "SGST" | "IGST";
    amount: number;
  }>;
  roundOffAmount?: number;
}

/**
 * Validate voucher date format (YYYYMMDD)
 */
function isValidDateFormat(date: string | undefined): boolean {
  if (!date) return false;
  return /^\d{8}$/.test(date.toString());
}

/**
 * Check if value is a valid number
 */
function isValidNumber(value: any): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

/**
 * Validate voucher structure and fields
 */
export function validateVoucher(voucher: VoucherData): VoucherValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: VoucherValidationResult["checks"] = {
    dateFormat: false,
    effectiveDateFormat: false,
    voucherTypeExists: false,
    partyLedgerExists: false,
    partyLedgerNonEmpty: false,
    salesPurchaseLedgerExists: false,
    salesPurchaseLedgerNonEmpty: false,
    inventoryItemsExist: false,
    stockItemsHaveRequiredFields: false,
    accountingAllocationsExist: false,
    accountingAllocationAmountsMatch: false,
    ledgerNamesNonEmpty: false,
    amountsAreNumbers: false,
    ledgerBalance: { balanced: false, total: 0 },
    gstValidation: false,
    roundOffValidation: false,
  };

  // 1. Validate date format
  if (isValidDateFormat(voucher.date)) {
    checks.dateFormat = true;
  } else {
    errors.push(`DATE is missing or invalid format. Expected YYYYMMDD, got: "${voucher.date}"`);
  }

  // 2. Validate effective date format
  if (isValidDateFormat(voucher.effectiveDate)) {
    checks.effectiveDateFormat = true;
  } else {
    errors.push(
      `EFFECTIVEDATE is missing or invalid format. Expected YYYYMMDD, got: "${voucher.effectiveDate}"`
    );
  }

  // 3. Check voucher type
  if (voucher.voucherType && voucher.voucherType.trim()) {
    checks.voucherTypeExists = true;
  } else {
    errors.push("VOUCHERTYPENAME is required");
  }

  // 4. Check party ledger exists
  if (voucher.partyLedger) {
    checks.partyLedgerExists = true;
  } else {
    errors.push("PARTYLEDGERNAME is required");
  }

  // 5. Check party ledger is non-empty
  if (voucher.partyLedger && voucher.partyLedger.trim()) {
    checks.partyLedgerNonEmpty = true;
  } else {
    errors.push("Party ledger name cannot be empty");
  }

  // 6. Check ledger entries exist
  if (voucher.ledgerEntries && voucher.ledgerEntries.length > 0) {
    checks.salesPurchaseLedgerExists = true;
  } else {
    errors.push("At least one ledger entry is required");
  }

  // 7. Check ledger entries are non-empty
  let allLedgersNonEmpty = true;
  if (voucher.ledgerEntries) {
    for (const entry of voucher.ledgerEntries) {
      if (!entry.name || !entry.name.trim()) {
        allLedgersNonEmpty = false;
        errors.push("All ledger names must be non-empty");
        break;
      }
    }
  }
  if (allLedgersNonEmpty) {
    checks.salesPurchaseLedgerNonEmpty = true;
  }

  // 8. Check inventory items exist (for inventory vouchers)
  if (voucher.inventoryEntries && voucher.inventoryEntries.length > 0) {
    checks.inventoryItemsExist = true;
  }

  // 9. Check stock items have required fields
  let stockItemsValid = true;
  if (voucher.inventoryEntries) {
    for (const item of voucher.inventoryEntries) {
      if (!item.stockItemName || !item.stockItemName.trim()) {
        errors.push("All stock items must have STOCKITEMNAME");
        stockItemsValid = false;
        break;
      }
      if (!item.rate || !item.rate.trim()) {
        errors.push(`Stock item "${item.stockItemName}" is missing RATE`);
        stockItemsValid = false;
        break;
      }
      if (!item.actualQty || !item.actualQty.trim()) {
        errors.push(`Stock item "${item.stockItemName}" is missing ACTUALQTY`);
        stockItemsValid = false;
        break;
      }
      if (!item.billedQty || !item.billedQty.trim()) {
        errors.push(`Stock item "${item.stockItemName}" is missing BILLEDQTY`);
        stockItemsValid = false;
        break;
      }
      if (!isValidNumber(item.amount)) {
        errors.push(`Stock item "${item.stockItemName}" has invalid AMOUNT: ${item.amount}`);
        stockItemsValid = false;
        break;
      }
    }
  }
  if (stockItemsValid && (voucher.inventoryEntries?.length || 0) > 0) {
    checks.stockItemsHaveRequiredFields = true;
  }

  // 10. Check accounting allocations exist for each inventory item
  let allocationExists = true;
  if (voucher.inventoryEntries) {
    for (const item of voucher.inventoryEntries) {
      if (!item.accountingAllocations || item.accountingAllocations.length === 0) {
        errors.push(
          `Inventory item "${item.stockItemName}" is missing ACCOUNTINGALLOCATIONS.LIST`
        );
        allocationExists = false;
        break;
      }
      for (const alloc of item.accountingAllocations) {
        if (!alloc.ledgerName || !alloc.ledgerName.trim()) {
          errors.push(`Accounting allocation for "${item.stockItemName}" has empty ledger name`);
          allocationExists = false;
          break;
        }
      }
    }
  }
  if (allocationExists && (voucher.inventoryEntries?.length || 0) > 0) {
    checks.accountingAllocationsExist = true;
  }

  // 11. Check accounting allocation amounts match item amounts
  let allocAmountsMatch = true;
  if (voucher.inventoryEntries) {
    for (const item of voucher.inventoryEntries) {
      if (item.accountingAllocations) {
        const itemAmount = parseFloat(item.amount as any);
        let allocSum = 0;
        for (const alloc of item.accountingAllocations) {
          allocSum += parseFloat(alloc.amount as any) || 0;
        }
        if (Math.abs(itemAmount - allocSum) > 0.01) {
          errors.push(
            `Item "${item.stockItemName}" amount (${itemAmount}) does not match allocations sum (${allocSum})`
          );
          allocAmountsMatch = false;
          break;
        }
      }
    }
  }
  if (allocAmountsMatch && (voucher.inventoryEntries?.length || 0) > 0) {
    checks.accountingAllocationAmountsMatch = true;
  }

  // 12. Validate all ledger names are non-empty strings
  let allNamesValid = true;
  if (voucher.ledgerEntries) {
    for (const entry of voucher.ledgerEntries) {
      if (
        !entry.name ||
        entry.name === "undefined" ||
        entry.name === "null" ||
        (typeof entry.name === "string" && !entry.name.trim())
      ) {
        errors.push(`Ledger entry has invalid name: ${entry.name}`);
        allNamesValid = false;
        break;
      }
    }
  }
  if (allNamesValid) {
    checks.ledgerNamesNonEmpty = true;
  }

  // 13. Validate all amounts are valid numbers
  let allAmountsValid = true;
  if (voucher.ledgerEntries) {
    for (const entry of voucher.ledgerEntries) {
      if (!isValidNumber(entry.amount)) {
        errors.push(`Ledger entry "${entry.name}" has invalid amount: ${entry.amount}`);
        allAmountsValid = false;
        break;
      }
    }
  }
  if (voucher.inventoryEntries) {
    for (const item of voucher.inventoryEntries) {
      if (!isValidNumber(item.amount)) {
        errors.push(`Inventory item "${item.stockItemName}" has invalid amount: ${item.amount}`);
        allAmountsValid = false;
        break;
      }
      if (item.accountingAllocations) {
        for (const alloc of item.accountingAllocations) {
          if (!isValidNumber(alloc.amount)) {
            errors.push(
              `Allocation in "${item.stockItemName}" has invalid amount: ${alloc.amount}`
            );
            allAmountsValid = false;
            break;
          }
        }
      }
    }
  }
  if (allAmountsValid) {
    checks.amountsAreNumbers = true;
  }

  // 14. Validate ledger balance (total must be 0 or very close due to rounding)
  let total = 0;
  if (voucher.ledgerEntries) {
    for (const entry of voucher.ledgerEntries) {
      total += parseFloat(entry.amount as any) || 0;
    }
  }
  if (voucher.inventoryEntries) {
    for (const item of voucher.inventoryEntries) {
      total += parseFloat(item.amount as any) || 0;
    }
  }
  if (voucher.roundOffAmount) {
    total += voucher.roundOffAmount;
  }

  // Allow for floating point rounding errors (within 0.01)
  checks.ledgerBalance = {
    balanced: Math.abs(total) < 0.01,
    total: parseFloat(total.toFixed(2)),
  };

  if (!checks.ledgerBalance.balanced) {
    errors.push(
      `Ledger entries do not balance. Total: ${checks.ledgerBalance.total} (expected: 0)`
    );
  }

  // 15. Validate GST entries
  if (voucher.gstEntries && voucher.gstEntries.length > 0) {
    let gstValid = true;
    for (const gst of voucher.gstEntries) {
      if (gst.amount === 0 || gst.amount === null || gst.amount === undefined) {
        warnings.push(`GST entry type ${gst.type} has zero amount and will not be included`);
      }
    }
    checks.gstValidation = true;
  } else {
    checks.gstValidation = true; // No GST entries is valid
  }

  // 16. Validate Round Off
  if (
    voucher.roundOffAmount !== undefined &&
    voucher.roundOffAmount !== 0 &&
    !isValidNumber(voucher.roundOffAmount)
  ) {
    errors.push(`Round Off amount is invalid: ${voucher.roundOffAmount}`);
  } else {
    checks.roundOffValidation = true;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks,
  };
}

/**
 * Format validation result for display
 */
export function formatValidationError(result: VoucherValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push("❌ Validation Errors:");
    for (const error of result.errors) {
      lines.push(`  • ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("\n⚠️  Warnings:");
    for (const warning of result.warnings) {
      lines.push(`  • ${warning}`);
    }
  }

  if (!result.valid) {
    lines.push("\n📋 Validation Checklist:");
    lines.push(`  ${result.checks.dateFormat ? "✓" : "✗"} DATE format (YYYYMMDD)`);
    lines.push(`  ${result.checks.effectiveDateFormat ? "✓" : "✗"} EFFECTIVEDATE format`);
    lines.push(`  ${result.checks.voucherTypeExists ? "✓" : "✗"} VOUCHERTYPENAME exists`);
    lines.push(`  ${result.checks.partyLedgerExists ? "✓" : "✗"} Party ledger exists`);
    lines.push(`  ${result.checks.salesPurchaseLedgerExists ? "✓" : "✗"} Sales/Purchase ledger exists`);
    lines.push(`  ${result.checks.ledgerNamesNonEmpty ? "✓" : "✗"} All ledger names non-empty`);
    lines.push(`  ${result.checks.amountsAreNumbers ? "✓" : "✗"} All amounts are valid numbers`);
    lines.push(
      `  ${result.checks.ledgerBalance.balanced ? "✓" : "✗"} Ledger balance (Total: ${result.checks.ledgerBalance.total})`
    );
    if (result.checks.inventoryItemsExist) {
      lines.push(
        `  ${result.checks.accountingAllocationsExist ? "✓" : "✗"} Accounting allocations exist`
      );
      lines.push(
        `  ${result.checks.accountingAllocationAmountsMatch ? "✓" : "✗"} Allocation amounts match items`
      );
    }
  }

  return lines.join("\n");
}
