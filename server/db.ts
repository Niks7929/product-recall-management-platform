import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './crypto-utils.ts';

const dbPath = path.resolve(process.cwd(), 'product_recall_platform.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT CHECK(role IN ('super_admin', 'company', 'customer', 'support_staff')) NOT NULL,
      phone TEXT,
      address TEXT,
      status TEXT CHECK(status IN ('active', 'pending_approval', 'suspended', 'rejected')) DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      tax_id TEXT,
      contact_person TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      website TEXT,
      industry TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending_approval', 'approved', 'rejected', 'suspended')) DEFAULT 'pending_approval',
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      staff_code TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES product_categories(id),
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      sku TEXT NOT NULL,
      description TEXT,
      warranty_months INTEGER DEFAULT 12,
      status TEXT CHECK(status IN ('active', 'recalled', 'archived')) DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      batch_number TEXT NOT NULL,
      manufacturing_date TEXT NOT NULL,
      expiry_date TEXT,
      quantity_manufactured INTEGER NOT NULL DEFAULT 0,
      quantity_distributed INTEGER NOT NULL DEFAULT 0,
      status TEXT CHECK(status IN ('normal', 'under_investigation', 'recalled')) DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(product_id, batch_number)
    );

    CREATE TABLE IF NOT EXISTS product_serials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES product_batches(id) ON DELETE CASCADE,
      serial_number TEXT NOT NULL,
      status TEXT CHECK(status IN ('available', 'registered', 'recalled', 'returned')) DEFAULT 'available',
      UNIQUE(product_id, serial_number)
    );

    CREATE TABLE IF NOT EXISTS customer_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      batch_number TEXT,
      serial_number TEXT,
      purchase_date TEXT NOT NULL,
      purchase_source TEXT,
      proof_document TEXT,
      status TEXT CHECK(status IN ('active', 'affected_by_recall', 'return_initiated', 'resolved')) DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recall_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      hazard_reason TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
      affected_batch_numbers TEXT NOT NULL,
      affected_serial_range TEXT,
      remedy_type TEXT CHECK(remedy_type IN ('refund', 'replacement', 'repair', 'return_only')) NOT NULL,
      customer_instructions TEXT NOT NULL,
      contact_details TEXT NOT NULL,
      status TEXT CHECK(status IN ('submitted', 'under_review', 'approved_published', 'rejected', 'completed', 'closed')) DEFAULT 'submitted',
      rejection_reason TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('recall_alert', 'return_update', 'refund_update', 'replacement_update', 'approval_update', 'system')) NOT NULL,
      reference_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id),
      product_id INTEGER REFERENCES products(id),
      assigned_staff_id INTEGER REFERENCES users(id),
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
      status TEXT CHECK(status IN ('open', 'under_investigation', 'assigned', 'resolved', 'closed')) DEFAULT 'open',
      resolution_note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaint_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS return_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      recall_id INTEGER NOT NULL REFERENCES recall_requests(id),
      customer_product_id INTEGER NOT NULL REFERENCES customer_products(id),
      preferred_remedy TEXT CHECK(preferred_remedy IN ('refund', 'replacement', 'repair')) NOT NULL,
      reason TEXT NOT NULL,
      tracking_carrier TEXT,
      tracking_number TEXT,
      status TEXT CHECK(status IN ('submitted', 'approved', 'item_shipped', 'item_received', 'verified', 'rejected')) DEFAULT 'submitted',
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_reference TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'processed', 'declined')) DEFAULT 'pending',
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS replacement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      replacement_model TEXT NOT NULL,
      shipping_carrier TEXT,
      tracking_number TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'dispatched', 'delivered')) DEFAULT 'pending',
      dispatched_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_role TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Ensure the super admin exists with requested credentials:
  // Username: admin, Email: admin@gmail.com, Password: admin123 (hashed with scrypt)
  try {
    const existingSuperAdmin = db.prepare("SELECT id FROM users WHERE role = 'super_admin'").get() as any;
    const adminPass = hashPassword('admin123');
    if (existingSuperAdmin) {
      db.prepare(`
        UPDATE users
        SET name = 'admin', email = 'admin@gmail.com', password_hash = ?, salt = ?, status = 'active'
        WHERE id = ?
      `).run(adminPass.hash, adminPass.salt, existingSuperAdmin.id);
    } else {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('admin', 'admin@gmail.com', ?, ?, 'super_admin', '+1 (800) 555-0199', 'Regulatory Commission HQ', 'active')
      `).run(adminPass.hash, adminPass.salt);
    }
  } catch (err) {
    console.error('Error synchronizing admin credentials:', err);
  }

  seedInitialData();
  ensureDiverseRecalls();
}

export function logAudit(user: any, action: string, entityType: string, entityId: number | null, details: string, ip = '127.0.0.1') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_role, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user?.id || null,
      user?.role || 'SYSTEM',
      user?.email || 'system@recallguard.gov',
      action,
      entityType,
      entityId,
      details,
      ip
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

function seedInitialData() {
  // Check if categories exist
  const catCount = db.prepare('SELECT COUNT(*) as count FROM product_categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO product_categories (name, slug, description, icon) VALUES (?, ?, ?, ?)');
    insertCat.run('Automotive & Mobility', 'automotive', 'Motor vehicles, braking systems, airbags, tires, batteries', 'Car');
    insertCat.run('Consumer Electronics', 'electronics', 'Laptops, smartphones, chargers, smart home devices, lithium batteries', 'Laptop');
    insertCat.run('Medical & Healthcare', 'medical', 'Diagnostic devices, ventilators, surgical implants, patient monitors', 'HeartPulse');
    insertCat.run('Child Care & Toys', 'childcare', 'Cribs, infant car seats, toys, high chairs, strollers', 'Baby');
    insertCat.run('Food & Beverages', 'food-beverage', 'Packaged nutrition, dairy products, allergen mislabeling, canned goods', 'Utensils');
    insertCat.run('Industrial & Tools', 'industrial', 'Power drills, pneumatic tools, safety harnesses, chemical respirators', 'Wrench');
  }

  // Check if initial users exist (Super Admin, Sample Approved Company, Sample Customer, Support Staff)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('Seeding initial enterprise dataset with secure password hashing...');

    // 1. Super Admin (Admin123!)
    const adminPass = hashPassword('Admin123!');
    const adminRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
      VALUES (?, ?, ?, ?, 'super_admin', ?, ?, 'active')
    `).run('National Recall Directorate', 'admin@recallguard.gov', adminPass.hash, adminPass.salt, '+1 (800) 555-0199', 'Regulatory Commission HQ, Washington, DC');
    const adminId = Number(adminRes.lastInsertRowid);

    // 2. Verified Enterprise Company (Apex Mobility Technologies)
    const companyPass = hashPassword('Company123!');
    const compUserRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
      VALUES (?, ?, ?, ?, 'company', ?, ?, 'active')
    `).run('Apex Mobility Systems', 'safety@apexmobility.com', companyPass.hash, companyPass.salt, '+1 (888) 273-9662', '450 Innovation Parkway, Detroit, MI');
    const compUserId = Number(compUserRes.lastInsertRowid);

    const compRes = db.prepare(`
      INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(
      compUserId,
      'Apex Mobility Technologies Inc.',
      'US-CORP-8849201',
      'EIN-94-3829102',
      'Marcus Vance (VP Quality)',
      'safety@apexmobility.com',
      '+1 (888) 273-9662',
      '450 Innovation Parkway, Detroit, MI',
      'https://apexmobility.com',
      'Automotive & Mobility'
    );
    const companyId = Number(compRes.lastInsertRowid);

    // 2b. Second Company (Pending Approval to demonstrate Admin Approval Workflow)
    const pendingCompPass = hashPassword('Volta123!');
    const pendingCompUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
      VALUES (?, ?, ?, ?, 'company', ?, ?, 'pending_approval')
    `).run('Volta Energy Devices', 'compliance@voltaenergy.io', pendingCompPass.hash, pendingCompPass.salt, '+1 (555) 321-9988', '12 Silicon Blvd, Austin, TX');
    const pendingCompUserId = Number(pendingCompUser.lastInsertRowid);

    db.prepare(`
      INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')
    `).run(
      pendingCompUserId,
      'Volta Energy Devices LLC',
      'TX-LLC-7729104',
      'EIN-45-8839211',
      'Elena Rostova',
      'compliance@voltaenergy.io',
      '+1 (555) 321-9988',
      '12 Silicon Blvd, Austin, TX',
      'https://voltaenergy.io',
      'Consumer Electronics'
    );

    // 3. Support Staff (Staff123!)
    const staffPass = hashPassword('Staff123!');
    const staffUserRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
      VALUES (?, ?, ?, ?, 'support_staff', ?, ?, 'active')
    `).run('Sarah Jenkins (Safety Lead)', 'sarah.jenkins@recallguard.gov', staffPass.hash, staffPass.salt, '+1 (800) 555-0144', 'Field Resolution Division, Chicago, IL');
    const staffUserId = Number(staffUserRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO support_staff (user_id, staff_code, department, status)
      VALUES (?, ?, ?, 'active')
    `).run(staffUserId, 'RG-STAFF-104', 'Tier 2 Safety & Return Verifications');

    // 4. Customer Account (Customer123!)
    const custPass = hashPassword('Customer123!');
    const custUserRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
      VALUES (?, ?, ?, ?, 'customer', ?, ?, 'active')
    `).run('David Miller', 'david.miller@example.com', custPass.hash, custPass.salt, '+1 (415) 890-2341', '742 Evergreen Terrace, San Francisco, CA');
    const customerId = Number(custUserRes.lastInsertRowid);

    // Seed Products for Apex Mobility
    const prodStmt = db.prepare(`
      INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const p1Res = prodStmt.run(
      companyId,
      1,
      'Apex Horizon High-Voltage Inverter',
      'Apex Mobility',
      'HVI-900X',
      'APX-HVI-900X',
      'Solid-state silicon carbide inverter unit for commercial electric powertrains with 800V fast-charging architecture.',
      36,
      'recalled'
    );
    const prod1Id = Number(p1Res.lastInsertRowid);

    const p2Res = prodStmt.run(
      companyId,
      1,
      'Apex Kinetic Ceramic Brake Calipers',
      'Apex Mobility',
      'KC-440',
      'APX-BRK-KC44',
      'Dual-piston precision hydraulic brake caliper set engineered for high-heat dissipation in performance vehicles.',
      24,
      'active'
    );
    const prod2Id = Number(p2Res.lastInsertRowid);

    // Seed Batches for Product 1
    const batchStmt = db.prepare(`
      INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const b1Res = batchStmt.run(prod1Id, 'BATCH-2026-Q1-A4', '2026-01-15', null, 4500, 4200, 'recalled');
    const b1Id = Number(b1Res.lastInsertRowid);

    const b2Res = batchStmt.run(prod1Id, 'BATCH-2026-Q2-B1', '2026-04-10', null, 5000, 4800, 'normal');
    const b2Id = Number(b2Res.lastInsertRowid);

    // Seed Serials
    const serialStmt = db.prepare(`
      INSERT INTO product_serials (product_id, batch_id, serial_number, status)
      VALUES (?, ?, ?, ?)
    `);
    serialStmt.run(prod1Id, b1Id, 'SN-HVI-2601-9011', 'registered');
    serialStmt.run(prod1Id, b1Id, 'SN-HVI-2601-9012', 'recalled');
    serialStmt.run(prod1Id, b1Id, 'SN-HVI-2601-9013', 'available');
    serialStmt.run(prod1Id, b2Id, 'SN-HVI-2604-1001', 'available');

    // Customer registers Product 1 with recalled batch
    const custProdStmt = db.prepare(`
      INSERT INTO customer_products (customer_id, product_id, batch_number, serial_number, purchase_date, purchase_source, proof_document, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const custProdRes = custProdStmt.run(
      customerId,
      prod1Id,
      'BATCH-2026-Q1-A4',
      'SN-HVI-2601-9011',
      '2026-02-14',
      'Authorized Apex Dealership Center #14',
      'INV-2026-APX-8812.pdf',
      'affected_by_recall'
    );
    const custProdId = Number(custProdRes.lastInsertRowid);

    // Seed an Approved & Published Recall
    const recallStmt = db.prepare(`
      INSERT INTO recall_requests (
        company_id, product_id, title, description, hazard_reason, severity,
        affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
        contact_details, status, published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved_published', datetime('now', '-3 days'))
    `);
    const recallRes = recallStmt.run(
      companyId,
      prod1Id,
      'URGENT SAFETY RECALL: Thermal Inverter Capacitor Solder Degradation',
      'Apex Mobility Technologies has identified an intermittent micro-fracture vulnerability in the primary bus capacitor solder joint on HVI-900X inverters manufactured between January and March 2026.',
      'Potential catastrophic thermal event or sudden loss of motor propulsion power while vehicle is in motion, presenting collision or fire hazards.',
      'critical',
      'BATCH-2026-Q1-A4',
      'SN-HVI-2601-0001 to SN-HVI-2601-9999',
      'refund',
      'Immediately halt operation of affected systems. Disconnect high-voltage battery service disconnect. File return through this portal for priority pre-paid shipping and 100% manufacturer refund or expedited replacement.',
      'Apex Safety Dispatch Hotline: +1 (888) 273-9662 | recalls@apexmobility.com'
    );
    const recallId = Number(recallRes.lastInsertRowid);

    // Seed Notification for Customer
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
      VALUES (?, ?, ?, 'recall_alert', ?, 0)
    `).run(
      customerId,
      'URGENT: Recall Published for Your Registered Inverter',
      'Your registered Apex Horizon High-Voltage Inverter (SN: SN-HVI-2601-9011, Batch: BATCH-2026-Q1-A4) is covered under published safety recall #1. Cease operation immediately.',
      recallId
    );

    // Seed Return Request from Customer
    const retRes = db.prepare(`
      INSERT INTO return_requests (
        customer_id, company_id, recall_id, customer_product_id, preferred_remedy,
        reason, tracking_carrier, tracking_number, status
      )
      VALUES (?, ?, ?, ?, 'refund', ?, 'FedEx Freight Hazardous', 'FX-9823-4122-US', 'approved')
    `).run(
      customerId,
      companyId,
      recallId,
      custProdId,
      'Hazardous solder degradation recall alert received. Ready for certified freight pickup.'
    );
    const returnId = Number(retRes.lastInsertRowid);

    // Seed Refund Request
    db.prepare(`
      INSERT INTO refund_requests (return_request_id, customer_id, company_id, amount, payment_method, status)
      VALUES (?, ?, ?, 1850.00, 'Direct Wire / Bank ACH', 'approved')
    `).run(returnId, customerId, companyId);

    // Seed Initial Complaint
    const compStmt = db.prepare(`
      INSERT INTO complaints (customer_id, company_id, product_id, assigned_staff_id, category, subject, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'under_investigation')
    `);
    const compRecord = compStmt.run(
      customerId,
      companyId,
      prod1Id,
      staffUserId,
      'Safety Defect Warning',
      'Excessive heat signature noted prior to recall announcement',
      'I noticed temperature alerts on the dashboard rising above 95°C before the recall was publicly posted. Requesting expedited hazardous container for return.',
      'critical'
    );
    const complaintId = Number(compRecord.lastInsertRowid);

    db.prepare(`
      INSERT INTO complaint_messages (complaint_id, sender_id, sender_role, sender_name, message)
      VALUES (?, ?, 'customer', 'David Miller', ?)
    `).run(complaintId, customerId, 'I have shut down the vehicle and disconnected the main battery plug. Can you provide the certified hazardous container?');

    db.prepare(`
      INSERT INTO complaint_messages (complaint_id, sender_id, sender_role, sender_name, message)
      VALUES (?, ?, 'support_staff', 'Sarah Jenkins (Safety Lead)', ?)
    `).run(complaintId, staffUserId, 'Thank you David. A Class-9 hazmat shipping crate with UN-certified fire-retardant padding has been dispatched to your address via FedEx Freight.');

    // Seed Audit Logs
    logAudit({ id: adminId, role: 'super_admin', email: 'admin@recallguard.gov' }, 'SYSTEM_INITIALIZED', 'system', null, 'Product Recall Platform initialized with ISO-10377 and NHTSA compliance guidelines.');
    logAudit({ id: compUserId, role: 'company', email: 'safety@apexmobility.com' }, 'COMPANY_REGISTERED', 'company', companyId, 'Apex Mobility Systems registered with business tax credentials.');
    logAudit({ id: adminId, role: 'super_admin', email: 'admin@recallguard.gov' }, 'COMPANY_APPROVED', 'company', companyId, 'Apex Mobility approved after verification of DOT compliance filings.');
    logAudit({ id: compUserId, role: 'company', email: 'safety@apexmobility.com' }, 'RECALL_REQUEST_SUBMITTED', 'recall_requests', recallId, 'Recall submitted for HVI-900X Inverters.');
    logAudit({ id: adminId, role: 'super_admin', email: 'admin@recallguard.gov' }, 'RECALL_PUBLISHED', 'recall_requests', recallId, 'Recall #1 authorized and published. Automated detection triggered 1 affected customer.');

    console.log('Database initialized successfully with enterprise seed data.');
  }
}

export function ensureDiverseRecalls() {
  try {
    const publishedCount = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE status = 'approved_published'").get() as { count: number };
    if (publishedCount.count >= 12) {
      return;
    }

    console.log('Enriching product recall database with diverse multi-industry published notices...');

    // Get categories mapping
    const categories = db.prepare('SELECT id, slug FROM product_categories').all() as { id: number; slug: string }[];
    const catMap: Record<string, number> = {};
    for (const c of categories) {
      catMap[c.slug] = c.id;
    }

    const defaultPass = hashPassword('SafetyPass2026!');

    // 1. Volta Energy Devices LLC (Consumer Electronics)
    let voltaUser = db.prepare('SELECT id FROM users WHERE email = ?').get('compliance@voltaenergy.io') as any;
    if (!voltaUser) {
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('Volta Energy Compliance', 'compliance@voltaenergy.io', ?, ?, 'company', '+1 (555) 321-9988', '12 Silicon Blvd, Austin, TX', 'active')
      `).run(defaultPass.hash, defaultPass.salt);
      voltaUser = { id: Number(uRes.lastInsertRowid) };
    }

    let voltaComp = db.prepare('SELECT id FROM companies WHERE contact_email = ?').get('compliance@voltaenergy.io') as any;
    if (!voltaComp) {
      const cRes = db.prepare(`
        INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
        VALUES (?, 'Volta Energy Devices LLC', 'TX-LLC-7729104', 'EIN-45-8839211', 'Elena Rostova', 'compliance@voltaenergy.io', '+1 (555) 321-9988', '12 Silicon Blvd, Austin, TX', 'https://voltaenergy.io', 'Consumer Electronics', 'approved')
      `).run(voltaUser.id);
      voltaComp = { id: Number(cRes.lastInsertRowid) };
    } else {
      db.prepare("UPDATE companies SET status = 'approved' WHERE id = ?").run(voltaComp.id);
    }

    let voltaProd = db.prepare('SELECT id FROM products WHERE sku = ?').get('VLT-PWR-20K') as any;
    if (!voltaProd) {
      const pRes = db.prepare(`
        INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
        VALUES (?, ?, 'Volta PowerMax 20,000mAh Ultra-Fast Power Bank', 'Volta Energy', 'VP-20K-PD', 'VLT-PWR-20K', 'High-density 65W USB-C PD power bank with dual bidirectional rapid charging ports.', 18, 'recalled')
      `).run(voltaComp.id, catMap['electronics'] || 2);
      voltaProd = { id: Number(pRes.lastInsertRowid) };

      db.prepare(`
        INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
        VALUES (?, 'BATCH-2025-W48-CEL', '2025-11-28', null, 12000, 11400, 'recalled'),
               (?, 'BATCH-2026-W02-CEL', '2026-01-10', null, 15000, 14200, 'recalled'),
               (?, 'BATCH-2026-W08-CEL', '2026-02-20', null, 20000, 8000, 'normal')
      `).run(voltaProd.id, voltaProd.id, voltaProd.id);

      db.prepare(`
        INSERT INTO recall_requests (
          company_id, product_id, title, description, hazard_reason, severity,
          affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
          contact_details, status, published_at
        )
        VALUES (?, ?, 'CRITICAL SAFETY RECALL: Lithium-Polymer Internal Separator Short Circuit',
          'Volta Energy Devices is initiating a nationwide voluntary recall of VP-20K-PD Power Banks manufactured in late 2025 and early 2026.',
          'Defective polymer insulation separator in pouch cell batches may deteriorate during high-wattage USB-C PD fast charging, creating internal dendrite short circuits, excessive swelling, smoke, and combustible thermal runaway fire hazards.',
          'critical', 'BATCH-2025-W48-CEL, BATCH-2026-W02-CEL', 'SN-VP20K-882100 to SN-VP20K-894500',
          'replacement', 'Stop charging or using the power bank immediately. Store outdoors or in a non-combustible metal container. Do not dispose in municipal trash. Register your serial number here for a free fire-safe return pouch and upgraded V2 replacement unit.',
          'Volta Safety Command: +1 (555) 321-9988 | recalls@voltaenergy.io', 'approved_published', datetime('now', '-5 days')
        )
      `).run(voltaComp.id, voltaProd.id);
    }

    // 2. BioHealth Precision Instruments Inc. (Medical & Healthcare)
    let bioUser = db.prepare('SELECT id FROM users WHERE email = ?').get('safety@biohealthmed.com') as any;
    if (!bioUser) {
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('BioHealth Clinical Quality', 'safety@biohealthmed.com', ?, ?, 'company', '+1 (800) 441-2900', '900 Medical Center Way, Boston, MA', 'active')
      `).run(defaultPass.hash, defaultPass.salt);
      bioUser = { id: Number(uRes.lastInsertRowid) };
    }

    let bioComp = db.prepare('SELECT id FROM companies WHERE contact_email = ?').get('safety@biohealthmed.com') as any;
    if (!bioComp) {
      const cRes = db.prepare(`
        INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
        VALUES (?, 'BioHealth Precision Instruments Inc.', 'US-MED-9941021', 'EIN-04-1928471', 'Dr. Arthur Sterling', 'safety@biohealthmed.com', '+1 (800) 441-2900', '900 Medical Center Way, Boston, MA', 'https://biohealthmed.com', 'Medical & Healthcare', 'approved')
      `).run(bioUser.id);
      bioComp = { id: Number(cRes.lastInsertRowid) };
    }

    let bioProd = db.prepare('SELECT id FROM products WHERE sku = ?').get('BIO-MED-IGP45') as any;
    if (!bioProd) {
      const pRes = db.prepare(`
        INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
        VALUES (?, ?, 'BioHealth InfusioGrip Digital Ambulatory Infusion Pump', 'BioHealth', 'IGP-450', 'BIO-MED-IGP45', 'Hospital-grade programmable ambulatory micro-infusion pump for intravenous therapy.', 36, 'recalled')
      `).run(bioComp.id, catMap['medical'] || 3);
      bioProd = { id: Number(pRes.lastInsertRowid) };

      db.prepare(`
        INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
        VALUES (?, 'BATCH-MED-2025-NOV', '2025-11-15', null, 3200, 3100, 'recalled'),
               (?, 'BATCH-MED-2026-JAN', '2026-01-20', null, 4000, 3850, 'recalled'),
               (?, 'BATCH-MED-2026-MAR', '2026-03-01', null, 5000, 2100, 'normal')
      `).run(bioProd.id, bioProd.id, bioProd.id);

      db.prepare(`
        INSERT INTO recall_requests (
          company_id, product_id, title, description, hazard_reason, severity,
          affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
          contact_details, status, published_at
        )
        VALUES (?, ?, 'HEALTHCARE SAFETY ADVISORY: Flow Sensor Calibration Drift Variance',
          'BioHealth has identified an intermittent micro-sensor calculation drift across IGP-450 ambulatory clinical infusion pumps.',
          'Optical peristaltic flow sensor calculation anomaly can lead to up to ±14% variance in continuous intravenous drug delivery rates under low-flow infusion protocols, creating medication dosage inaccuracy hazards.',
          'high', 'BATCH-MED-2025-NOV, BATCH-MED-2026-JAN', 'SN-BIO-450-0100 to SN-BIO-450-0850',
          'repair', 'Clinical facilities and home care providers must immediately verify pump firmware version. Quarantine affected serial numbers. BioHealth field technicians will provide on-site recalibration or certified firmware v4.2 update free of charge.',
          'BioHealth Clinical Regulatory Line: +1 (800) 441-2900 | compliance@biohealthmed.com', 'approved_published', datetime('now', '-8 days')
        )
      `).run(bioComp.id, bioProd.id);
    }

    // 3. LittleCare Nursery & Child Safety Co. (Child Care & Toys)
    let littleUser = db.prepare('SELECT id FROM users WHERE email = ?').get('safety@littlecarebaby.com') as any;
    if (!littleUser) {
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('LittleCare Safety Operations', 'safety@littlecarebaby.com', ?, ?, 'company', '+1 (877) 543-2229', '300 Nursery Lane, Columbus, OH', 'active')
      `).run(defaultPass.hash, defaultPass.salt);
      littleUser = { id: Number(uRes.lastInsertRowid) };
    }

    let littleComp = db.prepare('SELECT id FROM companies WHERE contact_email = ?').get('safety@littlecarebaby.com') as any;
    if (!littleComp) {
      const cRes = db.prepare(`
        INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
        VALUES (?, 'LittleCare Nursery & Child Safety Co.', 'US-TOY-448201', 'EIN-31-9928103', 'Rachel Montgomery', 'safety@littlecarebaby.com', '+1 (877) 543-2229', '300 Nursery Lane, Columbus, OH', 'https://littlecarebaby.com', 'Child Care & Toys', 'approved')
      `).run(littleUser.id);
      littleComp = { id: Number(cRes.lastInsertRowid) };
    }

    let littleProd = db.prepare('SELECT id FROM products WHERE sku = ?').get('LTC-CHR-300') as any;
    if (!littleProd) {
      const pRes = db.prepare(`
        INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
        VALUES (?, ?, 'LittleCare SafeStep Convertible Toddler High-Chair', 'LittleCare', 'LC-STEP-300', 'LTC-CHR-300', 'Multi-stage convertible high-chair and toddler dining seat with quick-release tray.', 24, 'recalled')
      `).run(littleComp.id, catMap['childcare'] || 4);
      littleProd = { id: Number(pRes.lastInsertRowid) };

      db.prepare(`
        INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
        VALUES (?, 'BATCH-LC-2025-FALL', '2025-09-18', null, 8500, 8300, 'recalled'),
               (?, 'BATCH-LC-2026-SPRING', '2026-02-12', null, 9000, 8700, 'recalled')
      `).run(littleProd.id, littleProd.id);

      db.prepare(`
        INSERT INTO recall_requests (
          company_id, product_id, title, description, hazard_reason, severity,
          affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
          contact_details, status, published_at
        )
        VALUES (?, ?, 'CHILD SAFETY RECALL: Feeding Tray Latch Disengagement Fall Hazard',
          'LittleCare Nursery is recalling 17,000 SafeStep convertible high chairs due to potential latch mechanism failure.',
          'The side-locking latch mechanism on the feeding tray can spontaneously release when downward pressure is exerted by a child, allowing the tray to drop suddenly and exposing infants to fall and entrapment injuries.',
          'critical', 'BATCH-LC-2025-FALL, BATCH-LC-2026-SPRING', 'SN-LC300-10001 to SN-LC300-24000',
          'replacement', 'Immediately stop using the detachable feeding tray and keep children out of the seat until the reinforced safety bracket is installed. LittleCare will ship a free redesigned replacement latch repair kit with tool-free installation.',
          'LittleCare Toll-Free Parent Hotline: +1 (877) 543-2229 | safety@littlecarebaby.com', 'approved_published', datetime('now', '-12 days')
        )
      `).run(littleComp.id, littleProd.id);
    }

    // 4. PureHarvest Nutrition Corp. (Food & Beverages)
    let foodUser = db.prepare('SELECT id FROM users WHERE email = ?').get('qa@pureharvestnutri.com') as any;
    if (!foodUser) {
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('PureHarvest Quality Assurance', 'qa@pureharvestnutri.com', ?, ?, 'company', '+1 (800) 912-3344', '50 Organic Valley Road, Portland, OR', 'active')
      `).run(defaultPass.hash, defaultPass.salt);
      foodUser = { id: Number(uRes.lastInsertRowid) };
    }

    let foodComp = db.prepare('SELECT id FROM companies WHERE contact_email = ?').get('qa@pureharvestnutri.com') as any;
    if (!foodComp) {
      const cRes = db.prepare(`
        INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
        VALUES (?, 'PureHarvest Nutrition Corp.', 'US-FDA-771822', 'EIN-93-1829401', 'Claire Simmons', 'qa@pureharvestnutri.com', '+1 (800) 912-3344', '50 Organic Valley Road, Portland, OR', 'https://pureharvestnutri.com', 'Food & Beverages', 'approved')
      `).run(foodUser.id);
      foodComp = { id: Number(cRes.lastInsertRowid) };
    }

    let foodProd = db.prepare('SELECT id FROM products WHERE sku = ?').get('PH-NUT-500G') as any;
    if (!foodProd) {
      const pRes = db.prepare(`
        INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
        VALUES (?, ?, 'PureHarvest Organic Golden Almond Granola 500g', 'PureHarvest', 'GRN-ALM-500', 'PH-NUT-500G', 'Non-GMO certified organic crunchy almond whole-grain oat cluster granola cereal.', 12, 'recalled')
      `).run(foodComp.id, catMap['food-beverage'] || 5);
      foodProd = { id: Number(pRes.lastInsertRowid) };

      db.prepare(`
        INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
        VALUES (?, 'LOT-EXP-2026-OCT-14', '2026-02-14', '2026-10-14', 35000, 34200, 'recalled'),
               (?, 'LOT-EXP-2026-NOV-02', '2026-03-02', '2026-11-02', 40000, 38900, 'recalled')
      `).run(foodProd.id, foodProd.id);

      db.prepare(`
        INSERT INTO recall_requests (
          company_id, product_id, title, description, hazard_reason, severity,
          affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
          contact_details, status, published_at
        )
        VALUES (?, ?, 'ALLERGEN SAFETY ADVISORY: Undeclared Cashew Nut Cross-Contamination',
          'PureHarvest Nutrition is issuing an urgent voluntary recall on Golden Almond Granola 500g due to undeclared tree nut presence.',
          'Product packaging fails to disclose cashew nut ingredients introduced through packaging facility cross-contact. Individuals with severe cashew allergies face life-threatening anaphylactic shock upon consumption.',
          'high', 'LOT-EXP-2026-OCT-14, LOT-EXP-2026-NOV-02', 'UPC: 884920192844',
          'refund', 'Do not consume if you or any family members have cashew or tree nut allergies. Return unopened or opened packaging to retailer for immediate store credit or claim a 100% direct ACH refund here.',
          'PureHarvest Consumer Affairs: +1 (800) 912-3344 | consumersafety@pureharvestnutri.com', 'approved_published', datetime('now', '-15 days')
        )
      `).run(foodComp.id, foodProd.id);
    }

    // 5. TitanPro Industrial Tools (Industrial & Tools)
    let titanUser = db.prepare('SELECT id FROM users WHERE email = ?').get('safety@titanprotools.com') as any;
    if (!titanUser) {
      const uRes = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
        VALUES ('TitanPro Safety Office', 'safety@titanprotools.com', ?, ?, 'company', '+1 (888) 723-8665', '1800 Heavy Duty Way, Milwaukee, WI', 'active')
      `).run(defaultPass.hash, defaultPass.salt);
      titanUser = { id: Number(uRes.lastInsertRowid) };
    }

    let titanComp = db.prepare('SELECT id FROM companies WHERE contact_email = ?').get('safety@titanprotools.com') as any;
    if (!titanComp) {
      const cRes = db.prepare(`
        INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
        VALUES (?, 'TitanPro Heavy Industrial Equipment', 'US-IND-339100', 'EIN-39-2819002', 'Frank Castiglione', 'safety@titanprotools.com', '+1 (888) 723-8665', '1800 Heavy Duty Way, Milwaukee, WI', 'https://titanprotools.com', 'Industrial & Tools', 'approved')
      `).run(titanUser.id);
      titanComp = { id: Number(cRes.lastInsertRowid) };
    }

    let titanProd = db.prepare('SELECT id FROM products WHERE sku = ?').get('TTN-WR-1800') as any;
    if (!titanProd) {
      const pRes = db.prepare(`
        INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
        VALUES (?, ?, 'TitanPro HyperTorque 18V Brushless Impact Wrench', 'TitanPro', 'TP-IW-1800', 'TTN-WR-1800', 'Industrial 1/2-inch square drive cordless brushless impact wrench delivering 1400 Nm breakaway torque.', 36, 'recalled')
      `).run(titanComp.id, catMap['industrial'] || 6);
      titanProd = { id: Number(pRes.lastInsertRowid) };

      db.prepare(`
        INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
        VALUES (?, 'BATCH-TP-2025-Q4', '2025-10-24', null, 7000, 6800, 'recalled'),
               (?, 'BATCH-TP-2026-Q1', '2026-01-30', null, 8000, 7500, 'recalled')
      `).run(titanProd.id, titanProd.id);

      db.prepare(`
        INSERT INTO recall_requests (
          company_id, product_id, title, description, hazard_reason, severity,
          affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
          contact_details, status, published_at
        )
        VALUES (?, ?, 'SAFETY ADVISORY: Anvil Friction Ring Fatigue Fracture Hazard',
          'TitanPro is issuing a voluntary recall on HyperTorque 18V Impact Wrenches due to potential anvil friction ring retaining pin failure.',
          'Under prolonged heavy impact vibration exceeding 1,200 Nm torque, the friction ring retaining pin may develop fatigue cracks, potentially causing heavy impact sockets to detach unexpectedly at high rotational velocity.',
          'medium', 'BATCH-TP-2025-Q4, BATCH-TP-2026-Q1', 'SN-TTN-18-50001 to SN-TTN-18-62000',
          'repair', 'Cease using high-torque impact sockets until the front anvil assembly is verified. Return tool via pre-paid shipping label to TitanPro Service Depot for complimentary reinforced titanium retaining pin replacement.',
          'TitanPro Commercial Support: +1 (888) 723-8665 | warranty@titanprotools.com', 'approved_published', datetime('now', '-18 days')
        )
      `).run(titanComp.id, titanProd.id);
    }

    // Additional complementary recalls to ensure all sectors have both Critical and High/Medium notices:
    const apexComp = db.prepare('SELECT id FROM companies WHERE company_name LIKE ?').get('%Apex Mobility%') as any;
    if (apexComp) {
      let pBrake = db.prepare('SELECT id FROM products WHERE sku = ?').get('APX-BRK-KC44') as any;
      if (pBrake) {
        const bRecExists = db.prepare('SELECT id FROM recall_requests WHERE product_id = ?').get(pBrake.id);
        if (!bRecExists) {
          db.prepare(`
            INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
            VALUES (?, 'BATCH-KC-2025-Q3', '2025-08-10', null, 6000, 5800, 'recalled')
          `).run(pBrake.id);

          db.prepare(`
            INSERT INTO recall_requests (
              company_id, product_id, title, description, hazard_reason, severity,
              affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
              contact_details, status, published_at
            )
            VALUES (?, ?, 'BRAKE SAFETY RECALL: Hydraulic Piston Micro-Seal Fluid Seepage Hazard',
              'Apex Mobility Technologies has identified potential hydraulic fluid micro-seepage on KC-440 brake calipers under extreme track temperatures.',
              'Hydraulic pressure loss can lead to extended vehicle braking distance or spongy pedal response under heavy sustained deceleration.',
              'high', 'BATCH-KC-2025-Q3', 'SN-KC44-2508-0001 to SN-KC44-2508-5800',
              'replacement', 'Contact authorized dealership for complimentary dual-piston caliper assembly replacement with upgraded Viton extreme-temperature seals.',
              'Apex Safety Dispatch: +1 (888) 273-9662 | recalls@apexmobility.com', 'approved_published', datetime('now', '-2 days')
            )
          `).run(apexComp.id, pBrake.id);
        }
      }
    }

    // 7. Volta GaN 100W Wall Charger (Electronics - High)
    if (voltaComp) {
      let pGaN = db.prepare('SELECT id FROM products WHERE sku = ?').get('VLT-CHG-100W') as any;
      if (!pGaN) {
        const pRes = db.prepare(`
          INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
          VALUES (?, ?, 'Volta UltraSlim 100W GaN Dual-Port Rapid Wall Charger', 'Volta Energy', 'VG-100-PRO', 'VLT-CHG-100W', 'Gallium Nitride 100W dual USB-C ultra-compact power delivery wall adapter.', 24, 'recalled')
        `).run(voltaComp.id, catMap['electronics'] || 2);
        pGaN = { id: Number(pRes.lastInsertRowid) };

        db.prepare(`
          INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
          VALUES (?, 'BATCH-GAN-2025-W40', '2025-10-05', null, 18000, 17500, 'recalled')
        `).run(pGaN.id);

        db.prepare(`
          INSERT INTO recall_requests (
            company_id, product_id, title, description, hazard_reason, severity,
            affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
            contact_details, status, published_at
          )
          VALUES (?, ?, 'ELECTRICAL SAFETY RECALL: Internal Transformer Thermal Insulation Breakdown',
            'Volta Energy is recalling 100W GaN Chargers manufactured in October 2025 due to potential transformer overheating.',
            'Defective thermal barrier epoxy between primary and secondary windings may degrade during continuous maximum wattage draw, creating fire or electric shock hazards.',
            'high', 'BATCH-GAN-2025-W40', 'SN-GAN100-99001 to SN-GAN100-99999',
            'replacement', 'Immediately unplug the charger from wall outlets. Return unit via pre-paid return pouch for free upgraded Gen-3 model.',
            'Volta Safety Command: +1 (555) 321-9988 | recalls@voltaenergy.io', 'approved_published', datetime('now', '-7 days')
          )
        `).run(voltaComp.id, pGaN.id);
      }
    }

    // 8. BioHealth CardioPulse Wearable Defibrillator (Medical - Critical)
    if (bioComp) {
      let pDefib = db.prepare('SELECT id FROM products WHERE sku = ?').get('BIO-MED-DEFIB9') as any;
      if (!pDefib) {
        const pRes = db.prepare(`
          INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
          VALUES (?, ?, 'BioHealth CardioPulse Wearable Automated External Defibrillator', 'BioHealth', 'CP-AED-900', 'BIO-MED-DEFIB9', 'Wearable ambulatory cardiac monitoring and automated cardioverter defibrillator vest.', 36, 'recalled')
        `).run(bioComp.id, catMap['medical'] || 3);
        pDefib = { id: Number(pRes.lastInsertRowid) };

        db.prepare(`
          INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
          VALUES (?, 'BATCH-CP-2025-OCT', '2025-10-18', null, 2400, 2350, 'recalled')
        `).run(pDefib.id);

        db.prepare(`
          INSERT INTO recall_requests (
            company_id, product_id, title, description, hazard_reason, severity,
            affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
            contact_details, status, published_at
          )
          VALUES (?, ?, 'CRITICAL CARDIAC SAFETY RECALL: Backup Battery Electrode Oxidation Contact Interruption',
            'BioHealth has received reports of intermittent battery contact disconnect on CP-AED-900 wearable units.',
            'Oxidation on gold-plated battery contact terminals can lead to unexpected system restart during patient cardiac arrhythmia events, potentially delaying life-saving defibrillation shocks.',
            'critical', 'BATCH-CP-2025-OCT', 'SN-AED-900-1001 to SN-AED-900-3400',
            'replacement', 'Physicians and patients must immediately contact BioHealth 24/7 Priority Clinical Line for immediate hot-swap replacement unit delivery within 24 hours.',
            'BioHealth Emergency Clinical Line: +1 (800) 441-2900 | clinical-safety@biohealthmed.com', 'approved_published', datetime('now', '-9 days')
          )
        `).run(bioComp.id, pDefib.id);
      }
    }

    // 9. LittleCare DreamNest Infant Bassinet (Child Care - High)
    if (littleComp) {
      let pBassinet = db.prepare('SELECT id FROM products WHERE sku = ?').get('LTC-BSN-100') as any;
      if (!pBassinet) {
        const pRes = db.prepare(`
          INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
          VALUES (?, ?, 'LittleCare DreamNest Incline-Adjustable Bedside Bassinet', 'LittleCare', 'DN-BSN-100', 'LTC-BSN-100', 'Bedside infant sleeper with dual mesh breathable sidewalls and adjustable tilt angle.', 24, 'recalled')
        `).run(littleComp.id, catMap['childcare'] || 4);
        pBassinet = { id: Number(pRes.lastInsertRowid) };

        db.prepare(`
          INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
          VALUES (?, 'BATCH-DN-2025-AUG', '2025-08-22', null, 11000, 10800, 'recalled')
        `).run(pBassinet.id);

        db.prepare(`
          INSERT INTO recall_requests (
            company_id, product_id, title, description, hazard_reason, severity,
            affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
            contact_details, status, published_at
          )
          VALUES (?, ?, 'INFANT SAFETY HAZARD RECALL: Bedside Incline Latch Position Creep',
            'LittleCare Nursery is voluntarily recalling DreamNest Bedside Sleepers due to incline angle regulation compliance.',
            'The angle lock pin can slip under infant movement, causing the sleeping surface to exceed a 10-degree incline, creating an infant roll-over and suffocation risk.',
            'high', 'BATCH-DN-2025-AUG', 'SN-DN100-2508-0001 to SN-DN100-2508-9999',
            'refund', 'Discontinue use as an inclined sleeper immediately. LittleCare provides a 100% full refund or free certified flat mattress locking conversion kit.',
            'LittleCare Safety Center: +1 (877) 543-2229 | safety@littlecarebaby.com', 'approved_published', datetime('now', '-14 days')
          )
        `).run(littleComp.id, pBassinet.id);
      }
    }

    // 10. PureHarvest Organic Cold-Pressed Apple Juice (Food - Critical)
    if (foodComp) {
      let pJuice = db.prepare('SELECT id FROM products WHERE sku = ?').get('PH-JUC-1000') as any;
      if (!pJuice) {
        const pRes = db.prepare(`
          INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
          VALUES (?, ?, 'PureHarvest Cold-Pressed Organic Honeycrisp Apple Juice 1L', 'PureHarvest', 'APL-JC-1L', 'PH-JUC-1000', 'Unfiltered cold-pressed USDA organic Honeycrisp apple juice.', 6, 'recalled')
        `).run(foodComp.id, catMap['food-beverage'] || 5);
        pJuice = { id: Number(pRes.lastInsertRowid) };

        db.prepare(`
          INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
          VALUES (?, 'LOT-APL-2026-SEP-18', '2026-03-18', '2026-09-18', 25000, 24000, 'recalled')
        `).run(pJuice.id);

        db.prepare(`
          INSERT INTO recall_requests (
            company_id, product_id, title, description, hazard_reason, severity,
            affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
            contact_details, status, published_at
          )
          VALUES (?, ?, 'URGENT FOOD SAFETY WARNING: Elevated Patulin Mycotoxin Levels in Honeycrisp Juice',
            'PureHarvest Nutrition is issuing a voluntary recall on Honeycrisp Apple Juice 1L due to elevated mold-derived patulin toxins.',
            'Laboratory testing revealed patulin levels exceeding FDA safety thresholds of 50 ppb, which may cause severe gastrointestinal distress and nausea.',
            'critical', 'LOT-APL-2026-SEP-18', 'UPC: 884920884102',
            'refund', 'Do not drink or serve. Discard contents and submit photo of lot code through this portal for instant electronic refund.',
            'PureHarvest Safety Hotline: +1 (800) 912-3344 | consumersafety@pureharvestnutri.com', 'approved_published', datetime('now', '-16 days')
          )
        `).run(foodComp.id, pJuice.id);
      }
    }

    // 11. TitanPro Auto-Darkening Welding Helmet (Industrial - Critical)
    if (titanComp) {
      let pHelmet = db.prepare('SELECT id FROM products WHERE sku = ?').get('TTN-WLD-PRO') as any;
      if (!pHelmet) {
        const pRes = db.prepare(`
          INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
          VALUES (?, ?, 'TitanPro VisionShield Pro Auto-Darkening Welding Helmet', 'TitanPro', 'VS-WELD-90', 'TTN-WLD-PRO', 'True-color 4-sensor auto-darkening solar/battery powered welding helmet with variable shade 5-13.', 24, 'recalled')
        `).run(titanComp.id, catMap['industrial'] || 6);
        pHelmet = { id: Number(pRes.lastInsertRowid) };

        db.prepare(`
          INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
          VALUES (?, 'BATCH-WELD-2025-Q3', '2025-09-02', null, 5500, 5200, 'recalled')
        `).run(pHelmet.id);

        db.prepare(`
          INSERT INTO recall_requests (
            company_id, product_id, title, description, hazard_reason, severity,
            affected_batch_numbers, affected_serial_range, remedy_type, customer_instructions,
            contact_details, status, published_at
          )
          VALUES (?, ?, 'OCCUPATIONAL EYE HAZARD: Optoelectronic Shutter Delay In Arc Detection',
            'TitanPro is recalling VisionShield Pro Auto-Darkening Welding Helmets due to intermittent shutter activation lag.',
            'Under cold ambient temperatures below 5°C, optical sensors can experience a 12-millisecond delay in darkening, exposing welders to intense ultraviolet and infrared flash burns (photokeratitis).',
            'critical', 'BATCH-WELD-2025-Q3', 'SN-WELD90-2509-001 to SN-WELD90-2509-520',
            'replacement', 'Cease welding use immediately. Return helmet using pre-paid courier label for expedited replacement with upgraded ColdShield optic filter cassette.',
            'TitanPro Safety Support: +1 (888) 723-8665 | warranty@titanprotools.com', 'approved_published', datetime('now', '-20 days')
          )
        `).run(titanComp.id, pHelmet.id);
      }
    }

    console.log('Successfully enriched multi-industry safety recall catalog.');
  } catch (err) {
    console.error('Error ensuring diverse recalls:', err);
  }
}

