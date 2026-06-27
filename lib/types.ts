// Domain types for the parts of Honeypot Wars in scope (no scan engine).

export type AccountStatus = 'pending' | 'active' | 'suspended';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ReportType = 'technical' | 'summary' | 'other';

export interface Profile {
  id: string;
  email: string;
  company_name: string | null;
  registered_domain: string | null;
  account_status: AccountStatus;
  created_at: string;
}

export interface SessionRequest {
  id: string;
  account_id: string;
  repo_url: string;
  deployment_url: string | null;
  notes: string | null;
  consent_signed: boolean;
  status: RequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Report {
  id: string;
  account_id: string;
  session_request_id: string | null;
  title: string;
  report_type: ReportType;
  storage_path: string;
  file_name: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  account_id: string;
  session_request_id: string | null;
  body: string;
  verdict: string | null;
  created_by: string | null;
  created_at: string;
}
