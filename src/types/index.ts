export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'call_center' | 'field_agent';
  organizationId: string;
  createdAt: Date;
  isActive: boolean;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  commissionRates: {
    perMeeting: number;
    perConversion: number;
    percentagePerOrder: number;
  };
  targets: {
    callsPerDay: number;
    meetingsPerWeek: number;
    conversionsPerMonth: number;
  };
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'meeting_scheduled' | 'meeting_completed' | 'converted' | 'closed';
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notes: LeadNote[];
  communications: Communication[];
  meetings: Meeting[];
  value?: number;
}

export interface LeadNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  type: 'note' | 'call_log' | 'meeting_result';
}

export interface Communication {
  id: string;
  type: 'call' | 'email' | 'sms' | 'telegram';
  direction: 'inbound' | 'outbound';
  content?: string;
  outcome?: CallOutcome;
  duration?: number;
  createdBy: string;
  createdAt: Date;
}

export interface CallOutcome {
  picked: boolean;
  result: 'interested' | 'not_interested' | 'meeting_setup' | 'call_later' | 'switched_off' | 'no_answer' | 'wrong_number';
  nextAction?: string;
  nextActionDate?: Date;
}

export interface Meeting {
  id: string;
  leadId: string;
  organizationId: string;
  scheduledBy: string;
  assignedTo: string;
  scheduledAt: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
  notes?: string;
  checkIn?: MeetingCheckIn;
  result?: MeetingResult;
}

export interface MeetingCheckIn {
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  notes?: string;
}

export interface MeetingResult {
  outcome: 'successful' | 'follow_up_needed' | 'not_interested' | 'no_show';
  notes: string;
  nextSteps?: string;
  orderValue?: number;
  commissionEarned?: number;
}

export interface Commission {
  id: string;
  userId: string;
  organizationId: string;
  type: 'meeting' | 'conversion' | 'order_percentage';
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  relatedLeadId?: string;
  relatedMeetingId?: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Analytics {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    totalLeads: number;
    totalCalls: number;
    callPickupRate: number;
    interestRate: number;
    meetingsScheduled: number;
    meetingsCompleted: number;
    conversions: number;
    conversionRate: number;
    totalCommissions: number;
  };
}