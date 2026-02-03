// Compliance Module Components
export { ComplianceDashboard } from './ComplianceDashboard';
export { ComplianceChecklist } from './ComplianceChecklist';
export { BoardMeetingManager } from './BoardMeetingManager';
export { InsiderTradingWindow } from './InsiderTradingWindow';
export { ConflictOfInterestLog } from './ConflictOfInterestLog';
export { PolicyLibrary } from './PolicyLibrary';
export { AuditTrail } from './AuditTrail';

// Calendar components
export {
  FilingCalendar,
  CalendarEventModal,
  getEventTypeFromFilingType,
  getEventTypeColor,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarEventModalProps,
} from './FilingCalendar';

// ComplianceCalendar alias (for backward compatibility and descriptive naming)
export { ComplianceCalendar } from './ComplianceCalendar';

// Legacy components (keep for backward compatibility)
export { FilingTable } from './FilingTable';
export { FilingDetail } from './FilingDetail';
export { CommentLetterTracker } from './CommentLetterTracker';
