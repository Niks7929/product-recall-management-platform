import { Router, Request, Response } from 'express';
import { db, logAudit } from './db.ts';
import { hashPassword, verifyPassword, generateToken } from './crypto-utils.ts';

export const apiRouter = Router();

// Middleware to authenticate session token
export function authenticate(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.prepare(`
    SELECT s.token, s.user_id, u.id, u.name, u.email, u.role, u.phone, u.status
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).get(token) as any;

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  if (session.status === 'suspended' || session.status === 'rejected') {
    return res.status(403).json({ error: `Your account is ${session.status}. Please contact administration.` });
  }

  (req as any).user = session;
  next();
}

// Middleware for role-based access control
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions for this portal' });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Check initial status / admin existence
apiRouter.get('/auth/status', (req: Request, res: Response) => {
  const superAdmin = db.prepare("SELECT id, email, created_at FROM users WHERE role = 'super_admin'").get() as any;
  res.json({
    hasSuperAdmin: !!superAdmin,
    systemReady: true
  });
});

// Setup Super Admin (Only allowed if no super admin exists!)
apiRouter.post('/auth/setup-admin', (req: Request, res: Response) => {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'super_admin'").get();
  if (existingAdmin) {
    return res.status(400).json({ error: 'Super Admin already initialized. Multiple Super Admins are prohibited.' });
  }

  const { name, email, password, phone, department } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Please provide valid credentials with a password of at least 8 characters.' });
  }

  const { hash, salt } = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
    VALUES (?, ?, ?, ?, 'super_admin', ?, ?, 'active')
  `).run(name, email.toLowerCase().trim(), hash, salt, phone || '', department || 'Central Regulatory Directorate');

  const userId = Number(result.lastInsertRowid);
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);

  logAudit({ id: userId, role: 'super_admin', email }, 'SUPER_ADMIN_INITIALIZED', 'users', userId, 'Primary Super Admin account created through secure installation wizard.');

  res.json({
    message: 'Super Admin account initialized successfully',
    token,
    user: { id: userId, name, email, role: 'super_admin', status: 'active' }
  });
});

// Register Customer
apiRouter.post('/auth/register-customer', (req: Request, res: Response) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'All fields are required. Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const { hash, salt } = hashPassword(password);
  const userRes = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
    VALUES (?, ?, ?, ?, 'customer', ?, ?, 'active')
  `).run(name, email.toLowerCase().trim(), hash, salt, phone || '', address || '');

  const userId = Number(userRes.lastInsertRowid);
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);

  // Welcome notification
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'system')
  `).run(userId, 'Welcome to RecallGuard', 'Your consumer safety portal is now active. Register your purchased products to receive automatic safety alerts.');

  logAudit({ id: userId, role: 'customer', email }, 'CUSTOMER_REGISTERED', 'users', userId, 'Customer registered via public safety portal.');

  res.json({
    token,
    user: { id: userId, name, email, role: 'customer', status: 'active' }
  });
});

// Register Company
apiRouter.post('/auth/register-company', (req: Request, res: Response) => {
  const {
    companyName, registrationNumber, taxId, contactPerson,
    email, password, phone, address, website, industry
  } = req.body;

  if (!companyName || !registrationNumber || !contactPerson || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Please provide all required business credentials.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const { hash, salt } = hashPassword(password);

  const userRes = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, phone, address, status)
    VALUES (?, ?, ?, ?, 'company', ?, ?, 'pending_approval')
  `).run(companyName, email.toLowerCase().trim(), hash, salt, phone || '', address || '');

  const userId = Number(userRes.lastInsertRowid);

  const compRes = db.prepare(`
    INSERT INTO companies (user_id, company_name, registration_number, tax_id, contact_person, contact_email, phone, address, website, industry, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')
  `).run(
    userId,
    companyName,
    registrationNumber,
    taxId || '',
    contactPerson,
    email.toLowerCase().trim(),
    phone || '',
    address || '',
    website || '',
    industry || 'General Manufacturing'
  );

  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);

  // Notification
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'system')
  `).run(userId, 'Company Registration Submitted', 'Your business profile is pending regulatory review. Operational recall features will activate once verified.');

  logAudit({ id: userId, role: 'company', email }, 'COMPANY_REGISTERED', 'companies', Number(compRes.lastInsertRowid), `Company "${companyName}" submitted registration for regulatory review.`);

  res.json({
    token,
    user: { id: userId, name: companyName, email, role: 'company', status: 'pending_approval' },
    message: 'Company registration submitted successfully. Super Admin review pending.'
  });
});

// Register Support Staff
apiRouter.post('/auth/register-staff', (req: Request, res: Response) => {
  const { name, email, password, phone, department, staffCode } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and password (min 6 characters) are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const countRes = db.prepare('SELECT COUNT(*) as count FROM support_staff').get() as any;
  if (countRes.count >= 10) {
    return res.status(400).json({ error: 'Staff account capacity limit reached (max 10 accounts).' });
  }

  const { hash, salt } = hashPassword(password);
  const userRes = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, phone, status)
    VALUES (?, ?, ?, ?, 'support_staff', ?, 'active')
  `).run(name, email.toLowerCase().trim(), hash, salt, phone || '');

  const userId = Number(userRes.lastInsertRowid);
  const code = staffCode || `RG-STAFF-${100 + countRes.count + 1}`;

  db.prepare(`
    INSERT INTO support_staff (user_id, staff_code, department, status)
    VALUES (?, ?, ?, 'active')
  `).run(userId, code, department || 'Field Quality & Returns Verification');

  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);

  logAudit({ id: userId, role: 'support_staff', email }, 'STAFF_REGISTERED', 'support_staff', userId, `Staff member registered: ${code}.`);

  res.json({
    token,
    user: { id: userId, name, email, role: 'support_staff', status: 'active' }
  });
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/username and password are required.' });
  }

  const identifier = email.toLowerCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?').get(identifier, identifier) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify username/email and password.' });
  }

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify username/email and password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended by administration.' });
  }

  // Update last login
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, user.id, expiresAt);

  let companyProfile = null;
  if (user.role === 'company') {
    companyProfile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
  }

  logAudit(user, 'USER_LOGIN', 'users', user.id, `User logged in with role: ${user.role}`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      company: companyProfile
    }
  });
});

// Current User Details
apiRouter.get('/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const fullUser = db.prepare('SELECT id, name, email, role, phone, address, status, created_at, last_login_at FROM users WHERE id = ?').get(user.id) as any;

  let companyProfile = null;
  if (fullUser.role === 'company') {
    companyProfile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
  }

  const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id) as any;

  res.json({
    user: fullUser,
    company: companyProfile,
    unreadNotificationCount: unreadNotifs?.count || 0
  });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ----------------------------------------------------
// PUBLIC ROUTES
// ----------------------------------------------------

// Public Statistics
apiRouter.get('/public/stats', (req: Request, res: Response) => {
  const totalRecalls = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE status = 'approved_published'").get() as any;
  const criticalRecalls = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE status = 'approved_published' AND severity = 'critical'").get() as any;
  const monitoredBatches = db.prepare('SELECT COUNT(*) as count FROM product_batches').get() as any;
  const approvedCompanies = db.prepare("SELECT COUNT(*) as count FROM companies WHERE status = 'approved'").get() as any;
  const resolvedReturns = db.prepare("SELECT COUNT(*) as count FROM return_requests WHERE status IN ('verified', 'item_received')").get() as any;
  const registeredProducts = db.prepare('SELECT COUNT(*) as count FROM customer_products').get() as any;

  res.json({
    totalRecalls: totalRecalls.count,
    criticalRecalls: criticalRecalls.count,
    monitoredBatches: monitoredBatches.count,
    approvedCompanies: approvedCompanies.count,
    resolvedReturns: resolvedReturns.count,
    registeredProducts: registeredProducts.count
  });
});

// Public Recall Search & Registry
apiRouter.get('/public/recalls', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const severity = req.query.severity as string;
  const category = req.query.category as string;

  let sql = `
    SELECT r.*, p.name as product_name, p.brand, p.model, p.sku,
           c.company_name, c.contact_email, cat.name as category_name
    FROM recall_requests r
    JOIN products p ON r.product_id = p.id
    JOIN companies c ON r.company_id = c.id
    LEFT JOIN product_categories cat ON p.category_id = cat.id
    WHERE r.status = 'approved_published'
  `;
  const params: any[] = [];

  if (query) {
    sql += ` AND (
      p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR p.sku LIKE ?
      OR r.title LIKE ? OR r.hazard_reason LIKE ? OR r.affected_batch_numbers LIKE ?
      OR r.affected_serial_range LIKE ?
    )`;
    const searchPattern = `%${query}%`;
    params.push(
      searchPattern, searchPattern, searchPattern, searchPattern,
      searchPattern, searchPattern, searchPattern, searchPattern
    );
  }

  if (severity && severity !== 'all') {
    sql += ' AND r.severity = ?';
    params.push(severity);
  }

  if (category && category !== 'all') {
    sql += ' AND cat.slug = ?';
    params.push(category);
  }

  sql += ' ORDER BY r.id DESC LIMIT 50';

  const rows = db.prepare(sql).all(...params);
  res.json({ recalls: rows });
});

// Single Recall Detail
apiRouter.get('/public/recalls/:id', (req: Request, res: Response) => {
  const recallId = req.params.id;
  const recall = db.prepare(`
    SELECT r.*, p.name as product_name, p.brand, p.model, p.sku, p.description as product_desc,
           c.company_name, c.contact_email, c.phone as company_phone, c.website as company_website,
           cat.name as category_name
    FROM recall_requests r
    JOIN products p ON r.product_id = p.id
    JOIN companies c ON r.company_id = c.id
    LEFT JOIN product_categories cat ON p.category_id = cat.id
    WHERE r.id = ? AND r.status = 'approved_published'
  `).get(recallId);

  if (!recall) {
    return res.status(404).json({ error: 'Recall advisory not found or not published' });
  }

  res.json({ recall });
});

// Public Categories
apiRouter.get('/public/categories', (req: Request, res: Response) => {
  const categories = db.prepare('SELECT * FROM product_categories ORDER BY name ASC').all();
  res.json({ categories });
});

// Public Contact Form Submission
apiRouter.post('/public/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.prepare(`
    INSERT INTO contact_messages (name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `).run(name, email, subject, message);

  logAudit(null, 'CONTACT_INQUIRY_RECEIVED', 'contact_messages', null, `Contact form submitted by ${email}: "${subject}"`);
  res.json({ success: true, message: 'Your message has been received by safety staff. Reference ID assigned.' });
});

// ----------------------------------------------------
// SUPER ADMIN ROUTES
// ----------------------------------------------------

apiRouter.get('/admin/overview', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const companiesTotal = db.prepare('SELECT COUNT(*) as count FROM companies').get() as any;
  const companiesPending = db.prepare("SELECT COUNT(*) as count FROM companies WHERE status = 'pending_approval'").get() as any;
  const recallsTotal = db.prepare('SELECT COUNT(*) as count FROM recall_requests').get() as any;
  const recallsActive = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE status = 'approved_published'").get() as any;
  const recallsPending = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE status = 'submitted'").get() as any;
  const customersTotal = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as any;
  const openComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status != 'resolved' AND status != 'closed'").get() as any;
  const totalReturns = db.prepare('SELECT COUNT(*) as count FROM return_requests').get() as any;

  const severityCounts = db.prepare(`
    SELECT severity, COUNT(*) as count FROM recall_requests
    WHERE status = 'approved_published' GROUP BY severity
  `).all();

  const recentAudits = db.prepare(`
    SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10
  `).all();

  res.json({
    kpis: {
      companiesTotal: companiesTotal.count,
      companiesPending: companiesPending.count,
      recallsTotal: recallsTotal.count,
      recallsActive: recallsActive.count,
      recallsPending: recallsPending.count,
      customersTotal: customersTotal.count,
      openComplaints: openComplaints.count,
      totalReturns: totalReturns.count
    },
    severityDistribution: severityCounts,
    recentAudits
  });
});

// Admin Companies List
apiRouter.get('/admin/companies', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const companies = db.prepare(`
    SELECT c.*, u.email as user_email, u.status as user_status,
      (SELECT COUNT(*) FROM products WHERE company_id = c.id) as product_count,
      (SELECT COUNT(*) FROM recall_requests WHERE company_id = c.id) as recall_count
    FROM companies c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.id DESC
  `).all();
  res.json({ companies });
});

// Admin Approve Company
apiRouter.post('/admin/companies/:id/approve', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const companyId = req.params.id;
  const comp = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  db.prepare("UPDATE companies SET status = 'approved' WHERE id = ?").run(companyId);
  db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(comp.user_id);

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'approval_update')
  `).run(comp.user_id, 'Regulatory Verification Approved', 'Your company credentials have been certified. You may now register products, batches, and submit safety recall notifications.');

  logAudit((req as any).user, 'COMPANY_APPROVED', 'companies', Number(companyId), `Approved enterprise company "${comp.company_name}".`);
  res.json({ success: true, message: 'Company approved successfully' });
});

// Admin Reject Company
apiRouter.post('/admin/companies/:id/reject', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const companyId = req.params.id;
  const { reason } = req.body;
  const comp = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  db.prepare("UPDATE companies SET status = 'rejected', rejection_reason = ? WHERE id = ?").run(reason || 'Verification criteria not met', companyId);
  db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(comp.user_id);

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'approval_update')
  `).run(comp.user_id, 'Registration Declined', `Your registration was declined: ${reason || 'Incomplete documentation'}`);

  logAudit((req as any).user, 'COMPANY_REJECTED', 'companies', Number(companyId), `Rejected company "${comp.company_name}". Reason: ${reason}`);
  res.json({ success: true, message: 'Company registration rejected' });
});

// Admin Toggle Company Suspension
apiRouter.post('/admin/companies/:id/suspend', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const companyId = req.params.id;
  const comp = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const newStatus = comp.status === 'suspended' ? 'approved' : 'suspended';
  db.prepare('UPDATE companies SET status = ? WHERE id = ?').run(newStatus, companyId);
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus === 'suspended' ? 'suspended' : 'active', comp.user_id);

  logAudit((req as any).user, 'COMPANY_STATUS_CHANGED', 'companies', Number(companyId), `Company status changed to ${newStatus}`);
  res.json({ success: true, status: newStatus });
});

// Admin Recalls List
apiRouter.get('/admin/recalls', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const recalls = db.prepare(`
    SELECT r.*, p.name as product_name, p.brand, p.model, p.sku, c.company_name
    FROM recall_requests r
    JOIN products p ON r.product_id = p.id
    JOIN companies c ON r.company_id = c.id
    ORDER BY r.id DESC
  `).all();
  res.json({ recalls });
});

// Admin Approve & Publish Recall with Automated Customer Detection Engine
apiRouter.post('/admin/recalls/:id/approve-publish', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const recallId = req.params.id;
  const recall = db.prepare(`
    SELECT r.*, p.name as product_name, c.company_name
    FROM recall_requests r
    JOIN products p ON r.product_id = p.id
    JOIN companies c ON r.company_id = c.id
    WHERE r.id = ?
  `).get(recallId) as any;

  if (!recall) return res.status(404).json({ error: 'Recall request not found' });

  // Update recall status
  db.prepare(`
    UPDATE recall_requests
    SET status = 'approved_published', published_at = datetime('now')
    WHERE id = ?
  `).run(recallId);

  // Mark product as recalled
  db.prepare("UPDATE products SET status = 'recalled' WHERE id = ?").run(recall.product_id);

  // Mark affected batches as recalled
  const batchList = recall.affected_batch_numbers.split(',').map((b: string) => b.trim());
  for (const bNum of batchList) {
    db.prepare("UPDATE product_batches SET status = 'recalled' WHERE product_id = ? AND batch_number = ?").run(recall.product_id, bNum);
  }

  // AUTOMATED CUSTOMER DETECTION ENGINE:
  // Find all customer_products matching product_id AND matching batch_number or serial_number
  const matchingCustomerProducts = db.prepare(`
    SELECT cp.id, cp.customer_id, cp.batch_number, cp.serial_number, u.name as customer_name, u.email as customer_email
    FROM customer_products cp
    JOIN users u ON cp.customer_id = u.id
    WHERE cp.product_id = ?
  `).all(recall.product_id) as any[];

  let affectedCount = 0;
  for (const cp of matchingCustomerProducts) {
    let isAffected = false;
    if (cp.batch_number && batchList.includes(cp.batch_number)) {
      isAffected = true;
    }
    // Also match if affected_batch_numbers includes string or serial range
    if (!isAffected && recall.affected_batch_numbers.includes(cp.batch_number)) {
      isAffected = true;
    }

    if (isAffected) {
      affectedCount++;
      // Update customer product status
      db.prepare("UPDATE customer_products SET status = 'affected_by_recall' WHERE id = ?").run(cp.id);

      // Create high-priority safety notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (?, ?, ?, 'recall_alert', ?)
      `).run(
        cp.customer_id,
        `URGENT SAFETY RECALL: ${recall.product_name}`,
        `Your registered ${recall.product_name} (Batch: ${cp.batch_number}, S/N: ${cp.serial_number || 'N/A'}) is subject to published safety recall #${recallId}: "${recall.title}". Please cease use immediately and initiate your return/remedy.`,
        Number(recallId)
      );
    }
  }

  logAudit(
    (req as any).user,
    'RECALL_PUBLISHED_AUTOMATED_DETECTION',
    'recall_requests',
    Number(recallId),
    `Published recall #${recallId} for "${recall.product_name}". Automated identification engine scanned registered customer database and flagged ${affectedCount} affected customer units.`
  );

  res.json({
    success: true,
    message: `Recall approved and published publicly. ${affectedCount} registered customers automatically notified.`,
    affectedCount
  });
});

// Admin Reject Recall Request
apiRouter.post('/admin/recalls/:id/reject', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const recallId = req.params.id;
  const { reason } = req.body;
  const recall = db.prepare('SELECT r.*, c.user_id as comp_user_id FROM recall_requests r JOIN companies c ON r.company_id = c.id WHERE r.id = ?').get(recallId) as any;
  if (!recall) return res.status(404).json({ error: 'Recall request not found' });

  db.prepare("UPDATE recall_requests SET status = 'rejected', rejection_reason = ? WHERE id = ?").run(reason || 'Additional technical safety data required', recallId);

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (?, ?, ?, 'system', ?)
  `).run(recall.comp_user_id, 'Recall Request Rejected', `Your recall submission #${recallId} was rejected. Note: ${reason}`, Number(recallId));

  logAudit((req as any).user, 'RECALL_REJECTED', 'recall_requests', Number(recallId), `Rejected recall #${recallId}. Reason: ${reason}`);
  res.json({ success: true, message: 'Recall request rejected' });
});

// Admin Support Staff Management (Limit 5-10 accounts as specified)
apiRouter.get('/admin/support-staff', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const staff = db.prepare(`
    SELECT ss.*, u.name, u.email, u.phone, u.status as user_status,
      (SELECT COUNT(*) FROM complaints WHERE assigned_staff_id = u.id AND status NOT IN ('resolved', 'closed')) as open_complaints_count
    FROM support_staff ss
    JOIN users u ON ss.user_id = u.id
    ORDER BY ss.id ASC
  `).all();
  res.json({ staff, count: staff.length, maxCapacity: 10 });
});

apiRouter.post('/admin/support-staff', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const countRes = db.prepare('SELECT COUNT(*) as count FROM support_staff').get() as any;
  if (countRes.count >= 10) {
    return res.status(400).json({ error: 'Maximum support staff limit (10 accounts) reached.' });
  }

  const { name, email, password, phone, department, staffCode } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and password (min 6 chars) are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const { hash, salt } = hashPassword(password);
  const userRes = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, phone, status)
    VALUES (?, ?, ?, ?, 'support_staff', ?, 'active')
  `).run(name, email.toLowerCase().trim(), hash, salt, phone || '');

  const userId = Number(userRes.lastInsertRowid);
  const code = staffCode || `RG-STAFF-${100 + countRes.count + 1}`;

  db.prepare(`
    INSERT INTO support_staff (user_id, staff_code, department, status)
    VALUES (?, ?, ?, 'active')
  `).run(userId, code, department || 'Field Quality & Returns Verification');

  logAudit((req as any).user, 'SUPPORT_STAFF_CREATED', 'support_staff', userId, `Created support staff account for ${email} (${code}).`);
  res.json({ success: true, message: 'Support staff account created' });
});

apiRouter.post('/admin/support-staff/:id/toggle-status', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const staffId = req.params.id;
  const staff = db.prepare('SELECT * FROM support_staff WHERE id = ?').get(staffId) as any;
  if (!staff) return res.status(404).json({ error: 'Staff account not found' });

  const newStatus = staff.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE support_staff SET status = ? WHERE id = ?').run(newStatus, staffId);
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus === 'active' ? 'active' : 'suspended', staff.user_id);

  logAudit((req as any).user, 'SUPPORT_STAFF_STATUS', 'support_staff', Number(staffId), `Support staff status changed to ${newStatus}`);
  res.json({ success: true, status: newStatus });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', authenticate, authorize('super_admin'), (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?').all(limit);
  res.json({ logs });
});

// ----------------------------------------------------
// COMPANY ROUTES
// ----------------------------------------------------

apiRouter.get('/company/dashboard', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company record not found' });

  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE company_id = ?').get(comp.id) as any;
  const totalBatches = db.prepare('SELECT COUNT(*) as count FROM product_batches pb JOIN products p ON pb.product_id = p.id WHERE p.company_id = ?').get(comp.id) as any;
  const totalRecalls = db.prepare('SELECT COUNT(*) as count FROM recall_requests WHERE company_id = ?').get(comp.id) as any;
  const activeRecalls = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE company_id = ? AND status = 'approved_published'").get(comp.id) as any;
  const pendingRecalls = db.prepare("SELECT COUNT(*) as count FROM recall_requests WHERE company_id = ? AND status = 'submitted'").get(comp.id) as any;
  const totalReturns = db.prepare('SELECT COUNT(*) as count FROM return_requests WHERE company_id = ?').get(comp.id) as any;
  const pendingReturns = db.prepare("SELECT COUNT(*) as count FROM return_requests WHERE company_id = ? AND status IN ('submitted', 'item_shipped')").get(comp.id) as any;

  res.json({
    company: comp,
    stats: {
      totalProducts: totalProducts.count,
      totalBatches: totalBatches.count,
      totalRecalls: totalRecalls.count,
      activeRecalls: activeRecalls.count,
      pendingRecalls: pendingRecalls.count,
      totalReturns: totalReturns.count,
      pendingReturns: pendingReturns.count
    }
  });
});

// Company Products
apiRouter.get('/company/products', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const products = db.prepare(`
    SELECT p.*, cat.name as category_name,
      (SELECT COUNT(*) FROM product_batches WHERE product_id = p.id) as batch_count,
      (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id) as serial_count
    FROM products p
    LEFT JOIN product_categories cat ON p.category_id = cat.id
    WHERE p.company_id = ?
    ORDER BY p.id DESC
  `).all(comp.id);

  res.json({ products });
});

apiRouter.post('/company/products', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id, status FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp || comp.status !== 'approved') {
    return res.status(403).json({ error: 'Your company profile must be approved by the Super Admin before adding products.' });
  }

  const { name, brand, model, sku, categoryId, description, warrantyMonths } = req.body;
  if (!name || !brand || !model || !sku) {
    return res.status(400).json({ error: 'Name, brand, model, and SKU are required fields.' });
  }

  const result = db.prepare(`
    INSERT INTO products (company_id, category_id, name, brand, model, sku, description, warranty_months, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(comp.id, categoryId || null, name, brand, model, sku, description || '', warrantyMonths || 12);

  const prodId = Number(result.lastInsertRowid);
  logAudit(user, 'PRODUCT_CREATED', 'products', prodId, `Company created product "${name}" (SKU: ${sku}).`);
  res.json({ success: true, productId: prodId, message: 'Product created successfully' });
});

// Company Batches
apiRouter.get('/company/batches', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const batches = db.prepare(`
    SELECT pb.*, p.name as product_name, p.model, p.sku
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.company_id = ?
    ORDER BY pb.id DESC
  `).all(comp.id);

  res.json({ batches });
});

apiRouter.post('/company/batches', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id, status FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp || comp.status !== 'approved') {
    return res.status(403).json({ error: 'Company approval required.' });
  }

  const { productId, batchNumber, manufacturingDate, expiryDate, quantityManufactured, quantityDistributed } = req.body;
  if (!productId || !batchNumber || !manufacturingDate) {
    return res.status(400).json({ error: 'Product, Batch Number, and Manufacturing Date are required.' });
  }

  const result = db.prepare(`
    INSERT INTO product_batches (product_id, batch_number, manufacturing_date, expiry_date, quantity_manufactured, quantity_distributed, status)
    VALUES (?, ?, ?, ?, ?, ?, 'normal')
  `).run(productId, batchNumber, manufacturingDate, expiryDate || null, quantityManufactured || 0, quantityDistributed || 0);

  logAudit(user, 'BATCH_CREATED', 'product_batches', Number(result.lastInsertRowid), `Batch ${batchNumber} created for product #${productId}.`);
  res.json({ success: true, message: 'Product batch registered' });
});

// Company Serials
apiRouter.get('/company/serials', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const serials = db.prepare(`
    SELECT ps.*, p.name as product_name, pb.batch_number
    FROM product_serials ps
    JOIN products p ON ps.product_id = p.id
    LEFT JOIN product_batches pb ON ps.batch_id = pb.id
    WHERE p.company_id = ?
    ORDER BY ps.id DESC LIMIT 200
  `).all(comp.id);

  res.json({ serials });
});

apiRouter.post('/company/serials', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id, status FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp || comp.status !== 'approved') return res.status(403).json({ error: 'Company approval required.' });

  const { productId, batchId, serialPrefix, count, startNumber } = req.body;
  if (!productId || !serialPrefix) {
    return res.status(400).json({ error: 'Product ID and serial prefix required.' });
  }

  const qty = Math.min(Number(count) || 1, 100); // limit to 100 serials per batch generation
  const start = Number(startNumber) || 1001;
  const stmt = db.prepare(`INSERT INTO product_serials (product_id, batch_id, serial_number, status) VALUES (?, ?, ?, 'available')`);

  for (let i = 0; i < qty; i++) {
    const sNum = `${serialPrefix}-${start + i}`;
    try {
      stmt.run(productId, batchId || null, sNum);
    } catch (e) {
      // duplicate ignored
    }
  }

  logAudit(user, 'SERIALS_GENERATED', 'product_serials', null, `Generated ${qty} serials with prefix "${serialPrefix}".`);
  res.json({ success: true, count: qty, message: `Generated ${qty} registered serial numbers` });
});

// Company Recall Requests
apiRouter.get('/company/recalls', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const recalls = db.prepare(`
    SELECT r.*, p.name as product_name, p.model, p.sku
    FROM recall_requests r
    JOIN products p ON r.product_id = p.id
    WHERE r.company_id = ?
    ORDER BY r.id DESC
  `).all(comp.id);

  res.json({ recalls });
});

apiRouter.post('/company/recalls', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id, status FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp || comp.status !== 'approved') {
    return res.status(403).json({ error: 'Approved company status required to initiate recalls.' });
  }

  const {
    productId, title, description, hazardReason, severity,
    affectedBatchNumbers, affectedSerialRange, remedyType,
    customerInstructions, contactDetails
  } = req.body;

  if (!productId || !title || !hazardReason || !severity || !affectedBatchNumbers || !remedyType) {
    return res.status(400).json({ error: 'Please provide all mandatory recall safety parameters.' });
  }

  const result = db.prepare(`
    INSERT INTO recall_requests (
      company_id, product_id, title, description, hazard_reason, severity,
      affected_batch_numbers, affected_serial_range, remedy_type,
      customer_instructions, contactDetails, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(
    comp.id,
    productId,
    title,
    description || hazardReason,
    hazardReason,
    severity,
    affectedBatchNumbers,
    affectedSerialRange || '',
    remedyType,
    customerInstructions || 'Cease product operation and file return on portal.',
    contactDetails || comp.contact_email
  );

  const recallId = Number(result.lastInsertRowid);
  logAudit(user, 'RECALL_SUBMITTED', 'recall_requests', recallId, `Company submitted recall request #${recallId}: "${title}" (Severity: ${severity}).`);

  res.json({
    success: true,
    recallId,
    message: 'Recall request submitted for Super Admin review and certification.'
  });
});

// Company Affected Customers Tracker
apiRouter.get('/company/affected-customers', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const affected = db.prepare(`
    SELECT cp.id as customer_product_id, cp.batch_number, cp.serial_number, cp.purchase_date, cp.status as product_status,
           u.id as customer_id, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
           p.name as product_name, p.model,
           r.id as recall_id, r.title as recall_title, r.severity as recall_severity,
           rr.id as return_id, rr.status as return_status
    FROM customer_products cp
    JOIN users u ON cp.customer_id = u.id
    JOIN products p ON cp.product_id = p.id
    LEFT JOIN recall_requests r ON r.product_id = p.id AND r.status = 'approved_published'
    LEFT JOIN return_requests rr ON rr.customer_product_id = cp.id
    WHERE p.company_id = ? AND cp.status = 'affected_by_recall'
    ORDER BY cp.id DESC
  `).all(comp.id);

  res.json({ affectedCustomers: affected });
});

// Company Returns List & Processing
apiRouter.get('/company/returns', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const comp = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(user.id) as any;
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  const returns = db.prepare(`
    SELECT rr.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
           p.name as product_name, p.model, cp.batch_number, cp.serial_number,
           r.title as recall_title,
           ref.id as refund_id, ref.amount as refund_amount, ref.status as refund_status,
           rep.id as replacement_id, rep.status as replacement_status
    FROM return_requests rr
    JOIN users u ON rr.customer_id = u.id
    JOIN customer_products cp ON rr.customer_product_id = cp.id
    JOIN products p ON cp.product_id = p.id
    JOIN recall_requests r ON rr.recall_id = r.id
    LEFT JOIN refund_requests ref ON ref.return_request_id = rr.id
    LEFT JOIN replacement_requests rep ON rep.return_request_id = rr.id
    WHERE rr.company_id = ?
    ORDER BY rr.id DESC
  `).all(comp.id);

  res.json({ returns });
});

// Company Update Return Status
apiRouter.post('/company/returns/:id/status', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const returnId = req.params.id;
  const { status, trackingCarrier, trackingNumber, rejectionReason } = req.body;

  const validStatuses = ['approved', 'item_shipped', 'item_received', 'verified', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid return status transition.' });
  }

  const ret = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(returnId) as any;
  if (!ret) return res.status(404).json({ error: 'Return request not found' });

  db.prepare(`
    UPDATE return_requests
    SET status = ?, tracking_carrier = coalesce(?, tracking_carrier),
        tracking_number = coalesce(?, tracking_number),
        rejection_reason = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, trackingCarrier || null, trackingNumber || null, rejectionReason || null, returnId);

  // Notify customer
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (?, ?, ?, 'return_update', ?)
  `).run(
    ret.customer_id,
    `Return Request #${returnId} Updated: ${status.replace('_', ' ').toUpperCase()}`,
    `Your return request status has changed to: ${status.replace('_', ' ')}. ${rejectionReason ? `Note: ${rejectionReason}` : ''}`,
    Number(returnId)
  );

  logAudit(user, 'RETURN_STATUS_UPDATED', 'return_requests', Number(returnId), `Return status transitioned to "${status}".`);
  res.json({ success: true, message: `Return status updated to ${status}` });
});

// Company Process Refund
apiRouter.post('/company/refunds/:id/process', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const refundId = req.params.id;
  const { transactionReference, amount } = req.body;

  const refund = db.prepare('SELECT * FROM refund_requests WHERE id = ?').get(refundId) as any;
  if (!refund) return res.status(404).json({ error: 'Refund request not found' });

  db.prepare(`
    UPDATE refund_requests
    SET status = 'processed', transaction_reference = ?, processed_at = datetime('now'),
        amount = coalesce(?, amount)
    WHERE id = ?
  `).run(transactionReference || 'REF-TX-' + Date.now(), amount || null, refundId);

  // Notify customer
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (?, ?, ?, 'refund_update', ?)
  `).run(
    refund.customer_id,
    `Refund Processed for Return #${refund.return_request_id}`,
    `Your refund of $${refund.amount.toFixed(2)} has been issued via ${refund.payment_method}. Transaction ref: ${transactionReference || 'REF-TX-OK'}.`,
    Number(refundId)
  );

  logAudit(user, 'REFUND_PROCESSED', 'refund_requests', Number(refundId), `Processed refund of $${refund.amount} (Ref: ${transactionReference}).`);
  res.json({ success: true, message: 'Refund successfully recorded as processed' });
});

// Company Dispatch Replacement
apiRouter.post('/company/replacements/:id/dispatch', authenticate, authorize('company'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const replacementId = req.params.id;
  const { courier, trackingNumber } = req.body;

  const rep = db.prepare('SELECT * FROM replacement_requests WHERE id = ?').get(replacementId) as any;
  if (!rep) return res.status(404).json({ error: 'Replacement record not found' });

  db.prepare(`
    UPDATE replacement_requests
    SET status = 'dispatched', shipping_carrier = ?, tracking_number = ?, dispatched_at = datetime('now')
    WHERE id = ?
  `).run(courier || 'FedEx Priority', trackingNumber || 'TRK-' + Date.now(), replacementId);

  // Notify customer
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (?, ?, ?, 'replacement_update', ?)
  `).run(
    rep.customer_id,
    'Replacement Unit Dispatched',
    `Your replacement unit (${rep.replacement_model}) has been shipped via ${courier || 'Carrier'} (Tracking: ${trackingNumber || 'TRK'}).`,
    Number(replacementId)
  );

  logAudit(user, 'REPLACEMENT_DISPATCHED', 'replacement_requests', Number(replacementId), `Dispatched replacement unit to customer #${rep.customer_id}.`);
  res.json({ success: true, message: 'Replacement marked as dispatched' });
});

// ----------------------------------------------------
// CUSTOMER ROUTES
// ----------------------------------------------------

apiRouter.get('/customer/dashboard', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;

  const myProductsCount = db.prepare('SELECT COUNT(*) as count FROM customer_products WHERE customer_id = ?').get(user.id) as any;
  const affectedAlerts = db.prepare("SELECT COUNT(*) as count FROM customer_products WHERE customer_id = ? AND status = 'affected_by_recall'").get(user.id) as any;
  const pendingReturns = db.prepare("SELECT COUNT(*) as count FROM return_requests WHERE customer_id = ? AND status NOT IN ('verified', 'rejected')").get(user.id) as any;
  const openComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE customer_id = ? AND status NOT IN ('resolved', 'closed')").get(user.id) as any;

  res.json({
    stats: {
      registeredProducts: myProductsCount.count,
      affectedAlerts: affectedAlerts.count,
      pendingReturns: pendingReturns.count,
      openComplaints: openComplaints.count
    }
  });
});

// Customer's Registered Products
apiRouter.get('/customer/products', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const products = db.prepare(`
    SELECT cp.*, p.name as product_name, p.brand, p.model, p.sku, c.company_name,
           r.id as active_recall_id, r.title as recall_title, r.hazard_reason as recall_hazard,
           r.severity as recall_severity, r.remedy_type as recall_remedy
    FROM customer_products cp
    JOIN products p ON cp.product_id = p.id
    JOIN companies c ON p.company_id = c.id
    LEFT JOIN recall_requests r ON r.product_id = p.id AND r.status = 'approved_published'
    WHERE cp.customer_id = ?
    ORDER BY cp.id DESC
  `).all(user.id);

  res.json({ products });
});

// Customer Registers a Product
apiRouter.post('/customer/products', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { productId, batchNumber, serialNumber, purchaseDate, purchaseSource } = req.body;

  if (!productId || !purchaseDate) {
    return res.status(400).json({ error: 'Product selection and purchase date are required.' });
  }

  // Check if this product/batch is currently subject to an active recall
  const activeRecall = db.prepare(`
    SELECT * FROM recall_requests
    WHERE product_id = ? AND status = 'approved_published'
  `).get(productId) as any;

  let initialStatus = 'active';
  let isRecalled = false;

  if (activeRecall) {
    if (batchNumber && activeRecall.affected_batch_numbers.includes(batchNumber)) {
      initialStatus = 'affected_by_recall';
      isRecalled = true;
    }
  }

  const result = db.prepare(`
    INSERT INTO customer_products (customer_id, product_id, batch_number, serial_number, purchase_date, purchase_source, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, productId, batchNumber || '', serialNumber || '', purchaseDate, purchaseSource || 'Retail Store', initialStatus);

  const newCustProdId = Number(result.lastInsertRowid);

  if (isRecalled) {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      VALUES (?, ?, ?, 'recall_alert', ?)
    `).run(
      user.id,
      'IMMEDIATE ALERT: Newly Registered Product Has Active Recall',
      `The product you just registered is under active safety recall #${activeRecall.id} ("${activeRecall.title}"). Please check your dashboard for return/refund instructions.`,
      activeRecall.id
    );
  }

  logAudit(user, 'CUSTOMER_PRODUCT_REGISTERED', 'customer_products', newCustProdId, `Customer registered product #${productId} (S/N: ${serialNumber || 'N/A'}, Status: ${initialStatus}).`);
  res.json({ success: true, isRecalled, status: initialStatus, message: isRecalled ? 'Product registered. WARNING: This product has an active safety recall advisory!' : 'Product registered successfully in safety registry.' });
});

// Customer Submits Return / Remedy Request
apiRouter.post('/customer/returns', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { customerProductId, preferredRemedy, reason } = req.body;

  if (!customerProductId || !preferredRemedy || !reason) {
    return res.status(400).json({ error: 'Customer product, preferred remedy, and reason are required.' });
  }

  const cp = db.prepare(`
    SELECT cp.*, p.company_id, p.name as product_name
    FROM customer_products cp
    JOIN products p ON cp.product_id = p.id
    WHERE cp.id = ? AND cp.customer_id = ?
  `).get(customerProductId, user.id) as any;

  if (!cp) return res.status(404).json({ error: 'Registered product not found' });

  // Find active recall
  const recall = db.prepare(`
    SELECT id, title, remedy_type FROM recall_requests
    WHERE product_id = ? AND status = 'approved_published'
    LIMIT 1
  `).get(cp.product_id) as any;

  const recallId = recall ? recall.id : 1;

  const retRes = db.prepare(`
    INSERT INTO return_requests (customer_id, company_id, recall_id, customer_product_id, preferred_remedy, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted')
  `).run(user.id, cp.company_id, recallId, customerProductId, preferredRemedy, reason);

  const returnId = Number(retRes.lastInsertRowid);

  // If refund chosen, create refund record
  if (preferredRemedy === 'refund') {
    db.prepare(`
      INSERT INTO refund_requests (return_request_id, customer_id, company_id, amount, payment_method, status)
      VALUES (?, ?, ?, ?, 'Original Payment / Bank Transfer', 'pending')
    `).run(returnId, user.id, cp.company_id, 1250.00); // Standard product estimated MSRP
  } else if (preferredRemedy === 'replacement') {
    db.prepare(`
      INSERT INTO replacement_requests (return_request_id, customer_id, company_id, replacement_model, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(returnId, user.id, cp.company_id, `${cp.product_name} (Revised Certified Revision)`);
  }

  // Update customer product status
  db.prepare("UPDATE customer_products SET status = 'return_initiated' WHERE id = ?").run(customerProductId);

  logAudit(user, 'RETURN_REQUEST_SUBMITTED', 'return_requests', returnId, `Customer submitted return request #${returnId} for product ${cp.product_name}.`);

  res.json({
    success: true,
    returnId,
    message: 'Return request submitted. Manufacturer will review and issue pre-paid return dispatch label.'
  });
});

// Customer Returns List
apiRouter.get('/customer/returns', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const returns = db.prepare(`
    SELECT rr.*, p.name as product_name, p.brand, p.model, cp.batch_number, cp.serial_number,
           c.company_name, r.title as recall_title,
           ref.amount as refund_amount, ref.status as refund_status, ref.transaction_reference,
           rep.replacement_model, rep.status as replacement_status, rep.shipping_carrier, rep.tracking_number as replacement_tracking
    FROM return_requests rr
    JOIN customer_products cp ON rr.customer_product_id = cp.id
    JOIN products p ON cp.product_id = p.id
    JOIN companies c ON rr.company_id = c.id
    JOIN recall_requests r ON rr.recall_id = r.id
    LEFT JOIN refund_requests ref ON ref.return_request_id = rr.id
    LEFT JOIN replacement_requests rep ON rep.return_request_id = rr.id
    WHERE rr.customer_id = ?
    ORDER BY rr.id DESC
  `).all(user.id);

  res.json({ returns });
});

// Customer Notifications
apiRouter.get('/customer/notifications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(user.id);
  res.json({ notifications: notifs });
});

apiRouter.post('/customer/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, user.id);
  res.json({ success: true });
});

apiRouter.post('/customer/notifications/mark-all-read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
  res.json({ success: true });
});

// Customer Complaints
apiRouter.get('/customer/complaints', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const complaints = db.prepare(`
    SELECT c.*, p.name as product_name, comp.company_name, u.name as staff_name
    FROM complaints c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN companies comp ON c.company_id = comp.id
    LEFT JOIN users u ON c.assigned_staff_id = u.id
    WHERE c.customer_id = ?
    ORDER BY c.id DESC
  `).all(user.id);

  res.json({ complaints });
});

apiRouter.post('/customer/complaints', authenticate, authorize('customer'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { productId, category, subject, description, priority } = req.body;

  if (!subject || !description || !category) {
    return res.status(400).json({ error: 'Subject, category, and issue description are required.' });
  }

  let companyId = null;
  if (productId) {
    const prod = db.prepare('SELECT company_id FROM products WHERE id = ?').get(productId) as any;
    if (prod) companyId = prod.company_id;
  }

  // Auto assign to available support staff
  const staff = db.prepare("SELECT user_id FROM support_staff WHERE status = 'active' LIMIT 1").get() as any;
  const assignedStaffId = staff ? staff.user_id : null;

  const result = db.prepare(`
    INSERT INTO complaints (customer_id, company_id, product_id, assigned_staff_id, category, subject, description, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(user.id, companyId, productId || null, assignedStaffId, category, subject, description, priority || 'medium');

  const compId = Number(result.lastInsertRowid);

  // Add initial customer message to thread
  db.prepare(`
    INSERT INTO complaint_messages (complaint_id, sender_id, sender_role, sender_name, message)
    VALUES (?, ?, 'customer', ?, ?)
  `).run(compId, user.id, user.name, description);

  logAudit(user, 'COMPLAINT_FILED', 'complaints', compId, `Customer filed complaint #${compId}: "${subject}".`);
  res.json({ success: true, complaintId: compId, message: 'Complaint registered and assigned to safety staff.' });
});

// Complaint Message Thread
apiRouter.get('/complaints/:id/messages', authenticate, (req: Request, res: Response) => {
  const complaintId = req.params.id;
  const messages = db.prepare(`
    SELECT * FROM complaint_messages WHERE complaint_id = ? ORDER BY id ASC
  `).all(complaintId);
  res.json({ messages });
});

apiRouter.post('/complaints/:id/messages', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const complaintId = req.params.id;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  db.prepare(`
    INSERT INTO complaint_messages (complaint_id, sender_id, sender_role, sender_name, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(complaintId, user.id, user.role, user.name, message.trim());

  res.json({ success: true, message: 'Message sent' });
});

// ----------------------------------------------------
// SUPPORT STAFF ROUTES
// ----------------------------------------------------

apiRouter.get('/support/dashboard', authenticate, authorize('support_staff', 'super_admin'), (req: Request, res: Response) => {
  const openCases = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved', 'closed')").get() as any;
  const resolvedCases = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('resolved', 'closed')").get() as any;
  const criticalComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')").get() as any;

  res.json({
    openCases: openCases.count,
    resolvedCases: resolvedCases.count,
    criticalComplaints: criticalComplaints.count
  });
});

apiRouter.get('/support/complaints', authenticate, authorize('support_staff', 'super_admin'), (req: Request, res: Response) => {
  const complaints = db.prepare(`
    SELECT c.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
           p.name as product_name, comp.company_name
    FROM complaints c
    JOIN users u ON c.customer_id = u.id
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN companies comp ON c.company_id = comp.id
    ORDER BY CASE WHEN c.priority = 'critical' THEN 1 WHEN c.priority = 'high' THEN 2 ELSE 3 END, c.id DESC
  `).all();
  res.json({ complaints });
});

apiRouter.post('/support/complaints/:id/status', authenticate, authorize('support_staff', 'super_admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const complaintId = req.params.id;
  const { status, note } = req.body;

  const valid = ['open', 'under_investigation', 'assigned', 'resolved', 'closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare(`
    UPDATE complaints
    SET status = ?, resolution_note = coalesce(?, resolution_note)
    WHERE id = ?
  `).run(status, note || null, complaintId);

  const comp = db.prepare('SELECT customer_id, subject FROM complaints WHERE id = ?').get(complaintId) as any;
  if (comp) {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      VALUES (?, ?, ?, 'system', ?)
    `).run(
      comp.customer_id,
      `Complaint #${complaintId} Status Updated`,
      `Your complaint regarding "${comp.subject}" status is now: ${status.replace('_', ' ').toUpperCase()}`,
      Number(complaintId)
    );
  }

  logAudit(user, 'COMPLAINT_STATUS_UPDATED', 'complaints', Number(complaintId), `Support updated complaint #${complaintId} to ${status}. Note: ${note || 'None'}`);
  res.json({ success: true, message: `Status updated to ${status}` });
});
