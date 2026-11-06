const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('recallguard_token');
}

export function setToken(token: string) {
  localStorage.setItem('recallguard_token', token);
}

export function clearToken() {
  localStorage.removeItem('recallguard_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  getStatus: () => request<{ hasSuperAdmin: boolean; systemReady: boolean }>('/auth/status'),
  setupAdmin: (payload: any) => request<any>('/auth/setup-admin', { method: 'POST', body: JSON.stringify(payload) }),
  registerCustomer: (payload: any) => request<any>('/auth/register-customer', { method: 'POST', body: JSON.stringify(payload) }),
  registerCompany: (payload: any) => request<any>('/auth/register-company', { method: 'POST', body: JSON.stringify(payload) }),
  registerStaff: (payload: any) => request<any>('/auth/register-staff', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Public
  getPublicStats: () => request<any>('/public/stats'),
  getPublicRecalls: (params: { q?: string; severity?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.severity) query.set('severity', params.severity);
    if (params.category) query.set('category', params.category);
    return request<any>(`/public/recalls?${query.toString()}`);
  },
  getPublicRecallById: (id: number) => request<any>(`/public/recalls/${id}`),
  getCategories: () => request<any>('/public/categories'),
  submitContact: (payload: any) => request<any>('/public/contact', { method: 'POST', body: JSON.stringify(payload) }),

  // Super Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  getAdminCompanies: () => request<any>('/admin/companies'),
  approveCompany: (id: number) => request<any>(`/admin/companies/${id}/approve`, { method: 'POST' }),
  rejectCompany: (id: number, reason: string) => request<any>(`/admin/companies/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  toggleCompanySuspension: (id: number) => request<any>(`/admin/companies/${id}/suspend`, { method: 'POST' }),
  getAdminRecalls: () => request<any>('/admin/recalls'),
  approvePublishRecall: (id: number) => request<any>(`/admin/recalls/${id}/approve-publish`, { method: 'POST' }),
  rejectRecall: (id: number, reason: string) => request<any>(`/admin/recalls/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getSupportStaff: () => request<any>('/admin/support-staff'),
  createSupportStaff: (payload: any) => request<any>('/admin/support-staff', { method: 'POST', body: JSON.stringify(payload) }),
  toggleStaffStatus: (id: number) => request<any>(`/admin/support-staff/${id}/toggle-status`, { method: 'POST' }),
  getAuditLogs: (limit = 100) => request<any>(`/admin/audit-logs?limit=${limit}`),

  // Company
  getCompanyDashboard: () => request<any>('/company/dashboard'),
  getCompanyProducts: () => request<any>('/company/products'),
  createProduct: (payload: any) => request<any>('/company/products', { method: 'POST', body: JSON.stringify(payload) }),
  getCompanyBatches: () => request<any>('/company/batches'),
  createBatch: (payload: any) => request<any>('/company/batches', { method: 'POST', body: JSON.stringify(payload) }),
  getCompanySerials: () => request<any>('/company/serials'),
  createSerials: (payload: any) => request<any>('/company/serials', { method: 'POST', body: JSON.stringify(payload) }),
  getCompanyRecalls: () => request<any>('/company/recalls'),
  submitRecall: (payload: any) => request<any>('/company/recalls', { method: 'POST', body: JSON.stringify(payload) }),
  getAffectedCustomers: () => request<any>('/company/affected-customers'),
  getCompanyReturns: () => request<any>('/company/returns'),
  updateReturnStatus: (id: number, payload: any) => request<any>(`/company/returns/${id}/status`, { method: 'POST', body: JSON.stringify(payload) }),
  processRefund: (id: number, payload: any) => request<any>(`/company/refunds/${id}/process`, { method: 'POST', body: JSON.stringify(payload) }),
  dispatchReplacement: (id: number, payload: any) => request<any>(`/company/replacements/${id}/dispatch`, { method: 'POST', body: JSON.stringify(payload) }),

  // Customer
  getCustomerDashboard: () => request<any>('/customer/dashboard'),
  getCustomerProducts: () => request<any>('/customer/products'),
  registerCustomerProduct: (payload: any) => request<any>('/customer/products', { method: 'POST', body: JSON.stringify(payload) }),
  submitCustomerReturn: (payload: any) => request<any>('/customer/returns', { method: 'POST', body: JSON.stringify(payload) }),
  getCustomerReturns: () => request<any>('/customer/returns'),
  getCustomerNotifications: () => request<any>('/customer/notifications'),
  markNotificationRead: (id: number) => request<any>(`/customer/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/customer/notifications/mark-all-read', { method: 'POST' }),
  getCustomerComplaints: () => request<any>('/customer/complaints'),
  submitComplaint: (payload: any) => request<any>('/customer/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  getComplaintMessages: (id: number) => request<any>(`/complaints/${id}/messages`),
  sendComplaintMessage: (id: number, message: string) => request<any>(`/complaints/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Support Staff
  getSupportDashboard: () => request<any>('/support/dashboard'),
  getSupportComplaints: () => request<any>('/support/complaints'),
  updateComplaintStatus: (id: number, payload: any) => request<any>(`/support/complaints/${id}/status`, { method: 'POST', body: JSON.stringify(payload) }),
};
