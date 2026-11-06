export type UserRole = 'super_admin' | 'company' | 'customer' | 'support_staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  status: 'active' | 'pending_approval' | 'suspended' | 'rejected';
  created_at?: string;
  last_login_at?: string;
  company?: CompanyProfile;
}

export interface CompanyProfile {
  id: number;
  user_id: number;
  company_name: string;
  registration_number: string;
  tax_id?: string;
  contact_person: string;
  contact_email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  created_at?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Product {
  id: number;
  company_id: number;
  category_id?: number;
  name: string;
  brand: string;
  model: string;
  sku: string;
  description?: string;
  warranty_months: number;
  status: 'active' | 'recalled' | 'archived';
  created_at: string;
  category_name?: string;
  batch_count?: number;
  serial_count?: number;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  manufacturing_date: string;
  expiry_date?: string;
  quantity_manufactured: number;
  quantity_distributed: number;
  status: 'normal' | 'under_investigation' | 'recalled';
  created_at: string;
  product_name?: string;
  model?: string;
  sku?: string;
}

export interface ProductSerial {
  id: number;
  product_id: number;
  batch_id?: number;
  serial_number: string;
  status: 'available' | 'registered' | 'recalled' | 'returned';
  product_name?: string;
  batch_number?: string;
}

export interface CustomerProduct {
  id: number;
  customer_id: number;
  product_id: number;
  batch_number?: string;
  serial_number?: string;
  purchase_date: string;
  purchase_source?: string;
  proof_document?: string;
  status: 'active' | 'affected_by_recall' | 'return_initiated' | 'resolved';
  created_at: string;
  product_name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  company_name?: string;
  active_recall_id?: number;
  recall_title?: string;
  recall_hazard?: string;
  recall_severity?: 'critical' | 'high' | 'medium' | 'low';
  recall_remedy?: string;
}

export interface RecallRequest {
  id: number;
  company_id: number;
  product_id: number;
  title: string;
  description: string;
  hazard_reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_batch_numbers: string;
  affected_serial_range?: string;
  remedy_type: 'refund' | 'replacement' | 'repair' | 'return_only';
  customer_instructions: string;
  contact_details: string;
  status: 'submitted' | 'under_review' | 'approved_published' | 'rejected' | 'completed' | 'closed';
  rejection_reason?: string;
  published_at?: string;
  created_at: string;
  product_name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  company_name?: string;
  category_name?: string;
}

export interface ReturnRequest {
  id: number;
  customer_id: number;
  company_id: number;
  recall_id: number;
  customer_product_id: number;
  preferred_remedy: 'refund' | 'replacement' | 'repair';
  reason: string;
  tracking_carrier?: string;
  tracking_number?: string;
  status: 'submitted' | 'approved' | 'item_shipped' | 'item_received' | 'verified' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  product_name?: string;
  brand?: string;
  model?: string;
  batch_number?: string;
  serial_number?: string;
  company_name?: string;
  recall_title?: string;
  refund_id?: number;
  refund_amount?: number;
  refund_status?: string;
  transaction_reference?: string;
  replacement_id?: number;
  replacement_model?: string;
  replacement_status?: string;
  shipping_carrier?: string;
  replacement_tracking?: string;
}

export interface Complaint {
  id: number;
  customer_id: number;
  company_id?: number;
  product_id?: number;
  assigned_staff_id?: number;
  category: string;
  subject: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'under_investigation' | 'assigned' | 'resolved' | 'closed';
  resolution_note?: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  product_name?: string;
  company_name?: string;
  staff_name?: string;
}

export interface ComplaintMessage {
  id: number;
  complaint_id: number;
  sender_id: number;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'recall_alert' | 'return_update' | 'refund_update' | 'replacement_update' | 'approval_update' | 'system';
  reference_id?: number;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_role?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface SupportStaffMember {
  id: number;
  user_id: number;
  staff_code: string;
  department: string;
  status: 'active' | 'inactive';
  created_at: string;
  name: string;
  email: string;
  phone?: string;
  user_status?: string;
  open_complaints_count?: number;
}
