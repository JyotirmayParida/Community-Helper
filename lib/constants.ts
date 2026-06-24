// Exact Hex Code Colors for Severities
export const SEVERITY_COLORS = {
  LOW: '#10B981',       // Emerald Green
  MODERATE: '#F59E0B',  // Amber/Yellow
  HIGH: '#F97316',      // Orange
  SEVERE: '#EF4444',    // Red
};

// Map of Severity Levels to Hex Codes
export const SEVERITY_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'] as const;

// Status Lifecycle
export const STATUS_LIFECYCLE = {
  SUBMITTED: 'submitted',
  CATEGORIZED: 'categorized',
  ROUTED: 'routed',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  NEEDS_REVIEW: 'needs_review',
  ESCALATED: 'escalated',
} as const;

export type ReportStatus = typeof STATUS_LIFECYCLE[keyof typeof STATUS_LIFECYCLE];
export type SeverityLevel = typeof SEVERITY_LEVELS[number];
