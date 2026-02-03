'use client';

/**
 * ComplianceCalendar - Regulatory Calendar Component
 *
 * This is an alias/wrapper for FilingCalendar that provides a more descriptive
 * name for the regulatory calendar functionality.
 *
 * Features:
 * - Full calendar view showing filing deadlines
 * - Color-coded events by filing type:
 *   - 10-K/10-Q (blue)
 *   - 8-K (purple)
 *   - Proxy/PREM14A (orange)
 *   - S-1/S-4 (green)
 *   - Deadline (red)
 * - Click event to view filing details
 * - Monthly and weekly view toggle
 * - Navigation (prev/next month)
 * - Today indicator
 */

// Re-export everything from FilingCalendar for convenience
export {
  FilingCalendar as ComplianceCalendar,
  FilingCalendar,
  CalendarEventModal,
  getEventTypeFromFilingType,
  getEventTypeColor,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarEventModalProps,
} from './FilingCalendar';

// Default export as ComplianceCalendar
export { default } from './FilingCalendar';
