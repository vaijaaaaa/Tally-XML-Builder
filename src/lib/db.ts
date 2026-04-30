import Database from "@tauri-apps/plugin-sql";

// Check if we're running in Tauri context
const isTauri = typeof (window as any).__TAURI__ !== "undefined";

// In-memory storage for development
let memoryDatabase: {
  customers: Customer[];
  suppliers: Supplier[];
  product_types: ProductType[];
  products: Product[];
  sales: Sale[];
  sale_items: SaleItem[];
  purchases: Purchase[];
  purchase_items: PurchaseItem[];
  tally_sync_logs: TallySyncLog[];
  nextCustomerId: number;
  nextSupplierId: number;
  nextProductTypeId: number;
  nextProductId: number;
  nextSaleId: number;
  nextSaleItemId: number;
  nextPurchaseId: number;
  nextPurchaseItemId: number;
  nextTallySyncLogId: number;
} = {
  customers: [],
  suppliers: [],
  product_types: [
    { id: 1, name: "Fertilizers", gst_rate: 5, created_at: new Date().toISOString() },
    { id: 2, name: "Micronutrients", gst_rate: 12, created_at: new Date().toISOString() },
    { id: 3, name: "Pesticide", gst_rate: 18, created_at: new Date().toISOString() },
    { id: 4, name: "Seeds", gst_rate: 0, created_at: new Date().toISOString() },
  ],
  products: [],
  sales: [],
  sale_items: [],
  purchases: [],
  purchase_items: [],
  tally_sync_logs: [],
  nextCustomerId: 1,
  nextSupplierId: 1,
  nextProductTypeId: 5,
  nextProductId: 1,
  nextSaleId: 1,
  nextSaleItemId: 1,
  nextPurchaseId: 1,
  nextPurchaseItemId: 1,
  nextTallySyncLogId: 1,
};

// TypeScript Interfaces
export interface Customer {
  id: number;
  name: string;
  address?: string;
  state?: string;
  gstin?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  address?: string;
  state?: string;
  gstin?: string;
  created_at: string;
}

export interface ProductType {
  id: number;
  name: string;
  gst_rate: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  hsn_code?: string;
  product_type_id?: number;
  gst_rate: number;
  unit: string;
  selling_price_no0: number;
  tally_price_no1: number;
  expiry_date?: string;
  created_at: string;
  product_type_name?: string; // For display
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  selling_price_no0: number;
  tally_price_no1: number;
  gst_rate: number;
  actual_amount: number;
  tally_taxable_amount: number;
  gst_amount: number;
  tally_total_amount: number;
}

export interface Sale {
  id: number;
  voucher_date: string;
  customer_id: number;
  customer_name: string;
  total_actual_amount: number;
  total_tally_amount: number;
  total_gst_amount: number;
  grand_total: number;
  tally_sync_status: string;
  created_at: string;
  items?: SaleItem[];
}

export interface CreateSaleInput {
  voucher_date: string;
  customer_id: number;
  customer_name: string;
  items: {
    product_id: number;
    product_name: string;
    qty: number;
    selling_price_no0: number;
    tally_price_no1: number;
    gst_rate: number;
  }[];
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  buying_price: number;
  gst_rate: number;
  taxable_amount: number;
  gst_amount: number;
  total_amount: number;
  expiry_date?: string;
}

export interface Purchase {
  id: number;
  voucher_date: string;
  supplier_id: number;
  supplier_name: string;
  supplier_invoice_number?: string;
  total_taxable_amount: number;
  total_gst_amount: number;
  grand_total: number;
  tally_sync_status: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface CreatePurchaseInput {
  voucher_date: string;
  supplier_id: number;
  supplier_name: string;
  supplier_invoice_number?: string;
  items: {
    product_id: number;
    product_name: string;
    qty: number;
    buying_price: number;
    gst_rate: number;
    expiry_date?: string;
  }[];
}

export interface TallySyncLog {
  id: number;
  entity_type: string;
  entity_id?: number;
  xml_type: string;
  request_xml: string;
  response_xml?: string;
  status: "success" | "failed" | "pending";
  error_message?: string;
  created_at: string;
}

export interface CreateTallySyncLogInput {
  entity_type: string;
  entity_id?: number;
  xml_type: string;
  request_xml: string;
  response_xml?: string;
  status: "success" | "failed" | "pending";
  error_message?: string;
}

// Database connection
let db: Database | null = null;

export async function getDb(): Promise<Database | null> {
  if (!isTauri) {
    return null; // In-memory mode
  }

  if (!db) {
    try {
      db = await Database.load("sqlite:farmstack-tally-demo.db");
    } catch (err) {
      console.error("Failed to load database:", err);
      return null;
    }
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  if (!isTauri) {
    return; // Already initialized in-memory
  }

  const database = await getDb();
  if (!database) return;

  // Create customers table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      state TEXT,
      gstin TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create suppliers table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      state TEXT,
      gstin TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create product_types table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS product_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      gst_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create products table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hsn_code TEXT,
      product_type_id INTEGER,
      gst_rate REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'Bag',
      selling_price_no0 REAL NOT NULL DEFAULT 0,
      tally_price_no1 REAL NOT NULL DEFAULT 0,
      expiry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_type_id) REFERENCES product_types(id)
    )
  `);

  // Create sales table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_date TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      total_actual_amount REAL NOT NULL DEFAULT 0,
      total_tally_amount REAL NOT NULL DEFAULT 0,
      total_gst_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      tally_sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )
  `);

  // Create sale_items table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      selling_price_no0 REAL NOT NULL,
      tally_price_no1 REAL NOT NULL,
      gst_rate REAL NOT NULL,
      actual_amount REAL NOT NULL,
      tally_taxable_amount REAL NOT NULL,
      gst_amount REAL NOT NULL,
      tally_total_amount REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  // Create purchases table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_date TEXT NOT NULL,
      supplier_id INTEGER NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_invoice_number TEXT,
      total_taxable_amount REAL NOT NULL DEFAULT 0,
      total_gst_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      tally_sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )
  `);

  // Create purchase_items table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      buying_price REAL NOT NULL,
      gst_rate REAL NOT NULL,
      taxable_amount REAL NOT NULL,
      gst_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      expiry_date TEXT,
      FOREIGN KEY(purchase_id) REFERENCES purchases(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  // Create tally_sync_logs table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS tally_sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      xml_type TEXT NOT NULL,
      request_xml TEXT NOT NULL,
      response_xml TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default product types
  const countResult = await database.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM product_types"
  );

  if (!countResult || countResult.length === 0 || countResult[0]?.count === 0) {
    await database.execute(
      "INSERT INTO product_types (name, gst_rate) VALUES (?, ?)",
      ["Fertilizers", 5]
    );
    await database.execute(
      "INSERT INTO product_types (name, gst_rate) VALUES (?, ?)",
      ["Micronutrients", 12]
    );
    await database.execute(
      "INSERT INTO product_types (name, gst_rate) VALUES (?, ?)",
      ["Pesticide", 18]
    );
    await database.execute(
      "INSERT INTO product_types (name, gst_rate) VALUES (?, ?)",
      ["Seeds", 0]
    );
  }
}

// Customer functions
export async function addCustomer(input: {
  name: string;
  address?: string;
  state?: string;
  gstin?: string;
}): Promise<Customer> {
  const customer: Customer = {
    id: memoryDatabase.nextCustomerId++,
    name: input.name,
    address: input.address,
    state: input.state,
    gstin: input.gstin,
    created_at: new Date().toISOString(),
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO customers (name, address, state, gstin) 
         VALUES (?, ?, ?, ?)`,
        [input.name, input.address || null, input.state || null, input.gstin || null]
      );

      const dbCustomer = await database.select<Customer[]>(
        "SELECT * FROM customers WHERE id = ?",
        [result.lastInsertId]
      );

      return dbCustomer[0];
    }
  }

  memoryDatabase.customers.push(customer);
  return customer;
}

export async function getCustomers(): Promise<Customer[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<Customer[]>(
        "SELECT * FROM customers ORDER BY created_at DESC"
      );
    }
  }

  return memoryDatabase.customers.slice().reverse();
}

// Supplier functions
export async function addSupplier(input: {
  name: string;
  address?: string;
  state?: string;
  gstin?: string;
}): Promise<Supplier> {
  const supplier: Supplier = {
    id: memoryDatabase.nextSupplierId++,
    name: input.name,
    address: input.address,
    state: input.state,
    gstin: input.gstin,
    created_at: new Date().toISOString(),
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO suppliers (name, address, state, gstin) 
         VALUES (?, ?, ?, ?)`,
        [input.name, input.address || null, input.state || null, input.gstin || null]
      );

      const dbSupplier = await database.select<Supplier[]>(
        "SELECT * FROM suppliers WHERE id = ?",
        [result.lastInsertId]
      );

      return dbSupplier[0];
    }
  }

  memoryDatabase.suppliers.push(supplier);
  return supplier;
}

export async function getSuppliers(): Promise<Supplier[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<Supplier[]>(
        "SELECT * FROM suppliers ORDER BY created_at DESC"
      );
    }
  }

  return memoryDatabase.suppliers.slice().reverse();
}

// Product Type functions
export async function addProductType(input: {
  name: string;
  gst_rate: number;
}): Promise<ProductType> {
  const productType: ProductType = {
    id: memoryDatabase.nextProductTypeId++,
    name: input.name,
    gst_rate: input.gst_rate,
    created_at: new Date().toISOString(),
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO product_types (name, gst_rate) 
         VALUES (?, ?)`,
        [input.name, input.gst_rate]
      );

      const dbProductType = await database.select<ProductType[]>(
        "SELECT * FROM product_types WHERE id = ?",
        [result.lastInsertId]
      );

      return dbProductType[0];
    }
  }

  memoryDatabase.product_types.push(productType);
  return productType;
}

export async function getProductTypes(): Promise<ProductType[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<ProductType[]>(
        "SELECT * FROM product_types ORDER BY name"
      );
    }
  }

  return memoryDatabase.product_types.slice().sort((a, b) => a.name.localeCompare(b.name));
}

// Product functions
export async function addProduct(input: {
  name: string;
  hsn_code?: string;
  product_type_id?: number;
  gst_rate: number;
  unit: string;
  selling_price_no0: number;
  tally_price_no1: number;
  expiry_date?: string;
}): Promise<Product> {
  const productTypeId = input.product_type_id;
  const productTypeName = memoryDatabase.product_types.find((p) => p.id === productTypeId)?.name;

  const product: Product = {
    id: memoryDatabase.nextProductId++,
    name: input.name,
    hsn_code: input.hsn_code,
    product_type_id: input.product_type_id,
    gst_rate: input.gst_rate,
    unit: input.unit,
    selling_price_no0: input.selling_price_no0,
    tally_price_no1: input.tally_price_no1,
    expiry_date: input.expiry_date,
    created_at: new Date().toISOString(),
    product_type_name: productTypeName,
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO products (name, hsn_code, product_type_id, gst_rate, unit, selling_price_no0, tally_price_no1, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.hsn_code || null,
          input.product_type_id || null,
          input.gst_rate,
          input.unit,
          input.selling_price_no0,
          input.tally_price_no1,
          input.expiry_date || null,
        ]
      );

      const dbProduct = await database.select<Product[]>(
        `SELECT p.*, pt.name as product_type_name FROM products p 
         LEFT JOIN product_types pt ON p.product_type_id = pt.id 
         WHERE p.id = ?`,
        [result.lastInsertId]
      );

      return dbProduct[0];
    }
  }

  memoryDatabase.products.push(product);
  return product;
}

export async function getProducts(): Promise<Product[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<Product[]>(
        `SELECT p.*, pt.name as product_type_name FROM products p 
         LEFT JOIN product_types pt ON p.product_type_id = pt.id 
         ORDER BY p.created_at DESC`
      );
    }
  }

  return memoryDatabase.products.slice().reverse();
}

// Sale functions
export async function addSale(input: CreateSaleInput): Promise<Sale> {
  // Calculate totals from items
  let total_actual_amount = 0;
  let total_tally_amount = 0;
  let total_gst_amount = 0;
  let grand_total = 0;

  input.items.forEach((item) => {
    const actual_amount = item.qty * item.selling_price_no0;
    const tally_taxable_amount = item.qty * item.tally_price_no1;
    const gst_amount = tally_taxable_amount * (item.gst_rate / 100);
    const tally_total_amount = tally_taxable_amount + gst_amount;

    total_actual_amount += actual_amount;
    total_tally_amount += tally_taxable_amount;
    total_gst_amount += gst_amount;
    grand_total += tally_total_amount;
  });

  const sale: Sale = {
    id: memoryDatabase.nextSaleId++,
    voucher_date: input.voucher_date,
    customer_id: input.customer_id,
    customer_name: input.customer_name,
    total_actual_amount,
    total_tally_amount,
    total_gst_amount,
    grand_total,
    tally_sync_status: "pending",
    created_at: new Date().toISOString(),
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO sales (voucher_date, customer_id, customer_name, total_actual_amount, total_tally_amount, total_gst_amount, grand_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.voucher_date,
          input.customer_id,
          input.customer_name,
          total_actual_amount,
          total_tally_amount,
          total_gst_amount,
          grand_total,
        ]
      );

      const saleId = result.lastInsertId;

      // Insert sale items
      for (const item of input.items) {
        const actual_amount = item.qty * item.selling_price_no0;
        const tally_taxable_amount = item.qty * item.tally_price_no1;
        const gst_amount = tally_taxable_amount * (item.gst_rate / 100);
        const tally_total_amount = tally_taxable_amount + gst_amount;

        await database.execute(
          `INSERT INTO sale_items (sale_id, product_id, product_name, qty, selling_price_no0, tally_price_no1, gst_rate, actual_amount, tally_taxable_amount, gst_amount, tally_total_amount) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.product_id,
            item.product_name,
            item.qty,
            item.selling_price_no0,
            item.tally_price_no1,
            item.gst_rate,
            actual_amount,
            tally_taxable_amount,
            gst_amount,
            tally_total_amount,
          ]
        );
      }

      const dbSale = await database.select<Sale[]>(
        "SELECT * FROM sales WHERE id = ?",
        [saleId]
      );

      return dbSale[0];
    }
  }

  // In-memory: add sale and items
  memoryDatabase.sales.push(sale);
  input.items.forEach((item) => {
    const actual_amount = item.qty * item.selling_price_no0;
    const tally_taxable_amount = item.qty * item.tally_price_no1;
    const gst_amount = tally_taxable_amount * (item.gst_rate / 100);
    const tally_total_amount = tally_taxable_amount + gst_amount;

    memoryDatabase.sale_items.push({
      id: memoryDatabase.nextSaleItemId++,
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      qty: item.qty,
      selling_price_no0: item.selling_price_no0,
      tally_price_no1: item.tally_price_no1,
      gst_rate: item.gst_rate,
      actual_amount,
      tally_taxable_amount,
      gst_amount,
      tally_total_amount,
    });
  });

  return sale;
}

export async function getSales(): Promise<Sale[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<Sale[]>(
        "SELECT * FROM sales ORDER BY created_at DESC"
      );
    }
  }

  return memoryDatabase.sales.slice().reverse();
}

export async function getSaleItems(saleId: number): Promise<SaleItem[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<SaleItem[]>(
        "SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id",
        [saleId]
      );
    }
  }

  return memoryDatabase.sale_items.filter((item) => item.sale_id === saleId);
}

export async function getPendingSalesCount(): Promise<number> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.select<Array<{ count: number }>>(
        "SELECT COUNT(*) as count FROM sales WHERE tally_sync_status = 'pending'"
      );
      return result[0]?.count || 0;
    }
  }

  return memoryDatabase.sales.filter((s) => s.tally_sync_status === "pending").length;
}

// Purchase functions
export async function addPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  // Calculate totals from items
  let total_taxable_amount = 0;
  let total_gst_amount = 0;
  let grand_total = 0;

  input.items.forEach((item) => {
    const taxable_amount = item.qty * item.buying_price;
    const gst_amount = taxable_amount * (item.gst_rate / 100);
    const total_amount = taxable_amount + gst_amount;

    total_taxable_amount += taxable_amount;
    total_gst_amount += gst_amount;
    grand_total += total_amount;
  });

  const purchase: Purchase = {
    id: memoryDatabase.nextPurchaseId++,
    voucher_date: input.voucher_date,
    supplier_id: input.supplier_id,
    supplier_name: input.supplier_name,
    supplier_invoice_number: input.supplier_invoice_number,
    total_taxable_amount,
    total_gst_amount,
    grand_total,
    tally_sync_status: "pending",
    created_at: new Date().toISOString(),
  };

  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.execute(
        `INSERT INTO purchases (voucher_date, supplier_id, supplier_name, supplier_invoice_number, total_taxable_amount, total_gst_amount, grand_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.voucher_date,
          input.supplier_id,
          input.supplier_name,
          input.supplier_invoice_number || null,
          total_taxable_amount,
          total_gst_amount,
          grand_total,
        ]
      );

      const purchaseId = result.lastInsertId;

      // Insert purchase items
      for (const item of input.items) {
        const taxable_amount = item.qty * item.buying_price;
        const gst_amount = taxable_amount * (item.gst_rate / 100);
        const total_amount = taxable_amount + gst_amount;

        await database.execute(
          `INSERT INTO purchase_items (purchase_id, product_id, product_name, qty, buying_price, gst_rate, taxable_amount, gst_amount, total_amount, expiry_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            purchaseId,
            item.product_id,
            item.product_name,
            item.qty,
            item.buying_price,
            item.gst_rate,
            taxable_amount,
            gst_amount,
            total_amount,
            item.expiry_date || null,
          ]
        );
      }

      const dbPurchase = await database.select<Purchase[]>(
        "SELECT * FROM purchases WHERE id = ?",
        [purchaseId]
      );

      return dbPurchase[0];
    }
  }

  // In-memory: add purchase and items
  memoryDatabase.purchases.push(purchase);
  input.items.forEach((item) => {
    const taxable_amount = item.qty * item.buying_price;
    const gst_amount = taxable_amount * (item.gst_rate / 100);
    const total_amount = taxable_amount + gst_amount;

    memoryDatabase.purchase_items.push({
      id: memoryDatabase.nextPurchaseItemId++,
      purchase_id: purchase.id,
      product_id: item.product_id,
      product_name: item.product_name,
      qty: item.qty,
      buying_price: item.buying_price,
      gst_rate: item.gst_rate,
      taxable_amount,
      gst_amount,
      total_amount,
      expiry_date: item.expiry_date,
    });
  });

  return purchase;
}

export async function getPurchases(): Promise<Purchase[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<Purchase[]>(
        "SELECT * FROM purchases ORDER BY created_at DESC"
      );
    }
  }

  return memoryDatabase.purchases.slice().reverse();
}

export async function getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<PurchaseItem[]>(
        "SELECT * FROM purchase_items WHERE purchase_id = ? ORDER BY id",
        [purchaseId]
      );
    }
  }

  return memoryDatabase.purchase_items.filter((item) => item.purchase_id === purchaseId);
}

export async function getPendingPurchasesCount(): Promise<number> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      const result = await database.select<Array<{ count: number }>>(
        "SELECT COUNT(*) as count FROM purchases WHERE tally_sync_status = 'pending'"
      );
      return result[0]?.count || 0;
    }
  }

  return memoryDatabase.purchases.filter((p) => p.tally_sync_status === "pending").length;
}

// Tally Sync Log functions

export async function addTallySyncLog(input: CreateTallySyncLogInput): Promise<TallySyncLog> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      const id = await database.execute(
        `INSERT INTO tally_sync_logs 
        (entity_type, entity_id, xml_type, request_xml, response_xml, status, error_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          input.entity_type,
          input.entity_id || null,
          input.xml_type,
          input.request_xml,
          input.response_xml || null,
          input.status,
          input.error_message || null,
        ]
      );

      const result = await database.select<TallySyncLog[]>(
        "SELECT * FROM tally_sync_logs WHERE id = ?",
        [id]
      );

      return result[0] as TallySyncLog;
    }
  }

  const id = memoryDatabase.nextTallySyncLogId++;
  const log: TallySyncLog = {
    id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    xml_type: input.xml_type,
    request_xml: input.request_xml,
    response_xml: input.response_xml,
    status: input.status,
    error_message: input.error_message,
    created_at: new Date().toISOString(),
  };

  memoryDatabase.tally_sync_logs.push(log);
  return log;
}

export async function getTallySyncLogs(): Promise<TallySyncLog[]> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      return await database.select<TallySyncLog[]>(
        "SELECT * FROM tally_sync_logs ORDER BY created_at DESC"
      );
    }
  }

  return memoryDatabase.tally_sync_logs.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function updateSaleSyncStatus(
  saleId: number,
  status: "pending" | "success" | "failed"
): Promise<void> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      await database.execute(
        "UPDATE sales SET tally_sync_status = ? WHERE id = ?",
        [status, saleId]
      );
      return;
    }
  }

  const sale = memoryDatabase.sales.find((s) => s.id === saleId);
  if (sale) {
    sale.tally_sync_status = status;
  }
}

export async function updatePurchaseSyncStatus(
  purchaseId: number,
  status: "pending" | "success" | "failed"
): Promise<void> {
  if (isTauri) {
    const database = await getDb();
    if (database) {
      await database.execute(
        "UPDATE purchases SET tally_sync_status = ? WHERE id = ?",
        [status, purchaseId]
      );
      return;
    }
  }

  const purchase = memoryDatabase.purchases.find((p) => p.id === purchaseId);
  if (purchase) {
    purchase.tally_sync_status = status;
  }
}
