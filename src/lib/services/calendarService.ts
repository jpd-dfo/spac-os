// ============================================================================
// Calendar Data Service
// ============================================================================
// Fetches and combines filing deadlines and scheduled filings into calendar events

import {
  addDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
  startOfDay,
  differenceInDays,
} from 'date-fns';

import type { FilingType, FilingStatus, SPAC, Filing } from '@/types';
import {
  generatePeriodicFilingSchedule,
  calculateSPACDeadlines,
  calculate8KDeadline,
  calculateSuper8KDeadline,
  getDeadlineStatus,
  type PeriodicFilingSchedule,
  type FilerStatus,
} from '@/lib/compliance/filingDeadlines';
import type { CalendarEvent, CalendarEventType } from '@/components/compliance/FilingCalendar';

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarDataParams {
  startDate?: Date;
  endDate?: Date;
  spacIds?: string[];
  eventTypes?: CalendarEventType[];
  includeFilings?: boolean;
  includeDeadlines?: boolean;
}

export interface SPACCalendarData {
  id: string;
  name: string;
  ticker: string;
  status: string;
  phase: string;
  ipoDate: Date | null;
  deadline: Date | null;
  daAnnouncedDate: Date | null;
  voteDate: Date | null;
  closingDate: Date | null;
  extensionCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventTypeFromFilingType(filingType: FilingType): CalendarEventType {
  switch (filingType) {
    case 'FORM_10K':
    case 'FORM_10Q':
      return 'PERIODIC';
    case 'FORM_8K':
    case 'SUPER_8K':
      return 'CURRENT';
    case 'DEF14A':
    case 'DEFA14A':
    case 'PREM14A':
      return 'PROXY';
    case 'S1':
    case 'S4':
      return 'REGISTRATION';
    default:
      return 'OTHER';
  }
}

function calculatePriority(
  dueDate: Date,
  status: FilingStatus | 'PENDING' | 'OVERDUE'
): CalendarEvent['priority'] {
  const now = startOfDay(new Date());
  const days = differenceInDays(dueDate, now);

  if (status === 'OVERDUE' || days < 0) {
    return 'CRITICAL';
  }
  if (days <= 3) {
    return 'CRITICAL';
  }
  if (days <= 7) {
    return 'HIGH';
  }
  if (days <= 14) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function filingStatusToEventStatus(
  status: FilingStatus,
  dueDate: Date
): CalendarEvent['status'] {
  const now = startOfDay(new Date());

  if (status === 'COMPLETE' || status === 'EFFECTIVE') {
    return status;
  }

  if (isBefore(dueDate, now)) {
    return 'OVERDUE';
  }

  return status;
}

// ============================================================================
// CALENDAR EVENT GENERATORS
// ============================================================================

/**
 * Generate calendar events from periodic filing schedule
 */
export function generatePeriodicFilingEvents(
  spac: SPACCalendarData,
  filerStatus: FilerStatus = 'NON_ACCELERATED',
  yearsAhead: number = 1
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Only generate for active SPACs
  if (['LIQUIDATED', 'TERMINATED', 'COMPLETED'].includes(spac.status)) {
    return events;
  }

  const schedule = generatePeriodicFilingSchedule(11, filerStatus, yearsAhead);

  for (const filing of schedule) {
    const eventType = getEventTypeFromFilingType(filing.filingType);
    const status = filing.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING';

    events.push({
      id: `periodic-${spac.id}-${filing.filingType}-${filing.period.year}-${filing.period.quarter || 'annual'}`,
      type: filing.filingType,
      eventType,
      title: filing.filingType === 'FORM_10K'
        ? `Annual Report (10-K) - FY${filing.period.year}`
        : `Quarterly Report (10-Q) - Q${filing.period.quarter} ${filing.period.year}`,
      description: `Period ending ${filing.periodEndDate.toLocaleDateString()}`,
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: filing.filingDeadline,
      priority: calculatePriority(filing.filingDeadline, status),
    });
  }

  return events;
}

/**
 * Generate SPAC-specific deadline events (redemption, extension, liquidation)
 */
export function generateSPACDeadlineEvents(spac: SPACCalendarData): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  if (!spac.ipoDate) {
    return events;
  }

  const deadlines = calculateSPACDeadlines(
    spac.ipoDate,
    24, // Default 24-month term
    spac.extensionCount * 3, // Assume 3-month extensions
    spac.daAnnouncedDate || undefined,
    spac.voteDate || undefined
  );

  // Liquidation Deadline
  if (deadlines.liquidationDeadline && !['COMPLETED', 'LIQUIDATED', 'TERMINATED'].includes(spac.status)) {
    const status = isBefore(deadlines.liquidationDeadline, new Date()) ? 'OVERDUE' : 'PENDING';
    events.push({
      id: `deadline-${spac.id}-liquidation`,
      type: 'DEADLINE',
      eventType: 'DEADLINE',
      title: 'SPAC Liquidation Deadline',
      description: 'Deadline to complete business combination or liquidate',
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: deadlines.liquidationDeadline,
      priority: calculatePriority(deadlines.liquidationDeadline, status),
    });
  }

  // Extension Deadline
  if (deadlines.extensionDeadline && !['COMPLETED', 'LIQUIDATED', 'TERMINATED'].includes(spac.status)) {
    const status = isBefore(deadlines.extensionDeadline, new Date()) ? 'OVERDUE' : 'PENDING';
    events.push({
      id: `deadline-${spac.id}-extension`,
      type: 'DEADLINE',
      eventType: 'DEADLINE',
      title: 'Extension Deadline',
      description: 'Deadline to file for term extension',
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: deadlines.extensionDeadline,
      priority: calculatePriority(deadlines.extensionDeadline, status),
    });
  }

  // Redemption Deadline
  if (deadlines.redemptionDeadline) {
    const status = isBefore(deadlines.redemptionDeadline, new Date()) ? 'OVERDUE' : 'PENDING';
    events.push({
      id: `deadline-${spac.id}-redemption`,
      type: 'DEADLINE',
      eventType: 'DEADLINE',
      title: 'Redemption Deadline',
      description: 'Deadline for shareholders to submit redemption requests',
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: deadlines.redemptionDeadline,
      priority: calculatePriority(deadlines.redemptionDeadline, status),
    });
  }

  // Proxy Filing Deadline
  if (deadlines.proxyFilingDeadline) {
    const status = isBefore(deadlines.proxyFilingDeadline, new Date()) ? 'OVERDUE' : 'PENDING';
    events.push({
      id: `deadline-${spac.id}-proxy`,
      type: 'DEADLINE',
      eventType: 'DEADLINE',
      title: 'Proxy Filing Deadline',
      description: 'Recommended deadline to file proxy statement before vote',
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: deadlines.proxyFilingDeadline,
      priority: calculatePriority(deadlines.proxyFilingDeadline, status),
    });
  }

  // Vote Date
  if (deadlines.voteDeadline) {
    const status = isBefore(deadlines.voteDeadline, new Date()) ? 'OVERDUE' : 'PENDING';
    events.push({
      id: `deadline-${spac.id}-vote`,
      type: 'DEADLINE',
      eventType: 'DEADLINE',
      title: 'Shareholder Vote',
      description: 'Scheduled shareholder vote date',
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate: deadlines.voteDeadline,
      priority: calculatePriority(deadlines.voteDeadline, status),
    });
  }

  return events;
}

/**
 * Convert existing filings to calendar events
 */
export function filingsToCalendarEvents(
  filings: Filing[],
  spacMap: Map<string, SPACCalendarData>
): CalendarEvent[] {
  return filings
    .filter((filing) => filing.dueDate)
    .map((filing) => {
      const spac = spacMap.get(filing.spacId);
      const spacName = spac ? `${spac.name} (${spac.ticker})` : 'Unknown SPAC';
      const eventType = getEventTypeFromFilingType(filing.type);
      const status = filingStatusToEventStatus(filing.status, filing.dueDate!);

      return {
        id: `filing-${filing.id}`,
        type: filing.type,
        eventType,
        title: filing.title,
        description: filing.description || undefined,
        spacId: filing.spacId,
        spacName,
        status,
        dueDate: filing.dueDate!,
        filedDate: filing.filedDate || undefined,
        priority: calculatePriority(filing.dueDate!, status),
        filingId: filing.id,
        edgarUrl: filing.edgarUrl || undefined,
      };
    });
}

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate all calendar events for a set of SPACs
 */
export function generateCalendarEvents(
  spacs: SPACCalendarData[],
  filings: Filing[] = [],
  params: CalendarDataParams = {}
): CalendarEvent[] {
  const {
    startDate = subMonths(new Date(), 1),
    endDate = addMonths(new Date(), 6),
    spacIds,
    eventTypes,
    includeFilings = true,
    includeDeadlines = true,
  } = params;

  let allEvents: CalendarEvent[] = [];

  // Create SPAC map for quick lookup
  const spacMap = new Map<string, SPACCalendarData>();
  spacs.forEach((spac) => spacMap.set(spac.id, spac));

  // Filter SPACs if spacIds provided
  const filteredSpacs = spacIds
    ? spacs.filter((spac) => spacIds.includes(spac.id))
    : spacs;

  // Generate events for each SPAC
  for (const spac of filteredSpacs) {
    // Periodic filing events
    if (includeFilings) {
      const periodicEvents = generatePeriodicFilingEvents(spac);
      allEvents = allEvents.concat(periodicEvents);
    }

    // SPAC-specific deadline events
    if (includeDeadlines) {
      const deadlineEvents = generateSPACDeadlineEvents(spac);
      allEvents = allEvents.concat(deadlineEvents);
    }
  }

  // Add existing filings as events
  if (includeFilings && filings.length > 0) {
    const filingEvents = filingsToCalendarEvents(filings, spacMap);

    // Merge filing events, replacing periodic events with actual filings
    const filingIds = new Set(filingEvents.map((e) => e.id));
    allEvents = allEvents.filter((e) => !e.id.startsWith('periodic-') || !filingIds.has(e.id));
    allEvents = allEvents.concat(filingEvents);
  }

  // Filter by date range
  allEvents = allEvents.filter((event) => {
    const eventDate = startOfDay(event.dueDate);
    return !isBefore(eventDate, startOfDay(startDate)) &&
           !isAfter(eventDate, startOfDay(endDate));
  });

  // Filter by event type if specified
  if (eventTypes && eventTypes.length > 0) {
    allEvents = allEvents.filter((event) => eventTypes.includes(event.eventType));
  }

  // Sort by due date
  allEvents.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Remove duplicates based on id
  const seen = new Set<string>();
  allEvents = allEvents.filter((event) => {
    if (seen.has(event.id)) {
      return false;
    }
    seen.add(event.id);
    return true;
  });

  return allEvents;
}

/**
 * Get calendar events for a specific month
 */
export function getMonthEvents(
  spacs: SPACCalendarData[],
  filings: Filing[],
  month: Date
): CalendarEvent[] {
  return generateCalendarEvents(spacs, filings, {
    startDate: startOfMonth(month),
    endDate: endOfMonth(month),
  });
}

/**
 * Get upcoming events (next N days)
 */
export function getUpcomingEvents(
  spacs: SPACCalendarData[],
  filings: Filing[],
  days: number = 30
): CalendarEvent[] {
  const now = new Date();
  return generateCalendarEvents(spacs, filings, {
    startDate: now,
    endDate: addDays(now, days),
  });
}

/**
 * Get overdue events
 */
export function getOverdueEvents(
  spacs: SPACCalendarData[],
  filings: Filing[]
): CalendarEvent[] {
  const now = new Date();
  return generateCalendarEvents(spacs, filings, {
    startDate: subMonths(now, 6),
    endDate: addDays(now, -1),
  }).filter((event) =>
    event.status !== 'COMPLETE' &&
    event.status !== 'EFFECTIVE'
  );
}

/**
 * Get critical events (due within 7 days or overdue)
 */
export function getCriticalEvents(
  spacs: SPACCalendarData[],
  filings: Filing[]
): CalendarEvent[] {
  return generateCalendarEvents(spacs, filings, {
    startDate: subMonths(new Date(), 1),
    endDate: addDays(new Date(), 7),
  }).filter((event) =>
    event.priority === 'CRITICAL' &&
    event.status !== 'COMPLETE' &&
    event.status !== 'EFFECTIVE'
  );
}

// ============================================================================
// MOCK DATA GENERATOR (for development/testing)
// ============================================================================

export function generateMockCalendarEvents(count: number = 20): CalendarEvent[] {
  const mockSpacs = [
    { id: 'spac-1', name: 'Acme Acquisition Corp', ticker: 'ACME' },
    { id: 'spac-2', name: 'Beta Holdings', ticker: 'BETA' },
    { id: 'spac-3', name: 'Gamma Capital', ticker: 'GAMA' },
  ];

  const filingTypes: (FilingType | 'DEADLINE')[] = [
    'FORM_10K', 'FORM_10Q', 'FORM_8K', 'S1', 'S4', 'DEF14A', 'PREM14A', 'DEADLINE'
  ];

  const statuses: (FilingStatus | 'PENDING' | 'OVERDUE')[] = [
    'DRAFT', 'INTERNAL_REVIEW', 'SUBMITTED', 'PENDING', 'OVERDUE', 'COMPLETE'
  ];

  const events: CalendarEvent[] = [];

  for (let i = 0; i < count; i++) {
    const spac = mockSpacs[Math.floor(Math.random() * mockSpacs.length)]!;
    const type = filingTypes[Math.floor(Math.random() * filingTypes.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const daysOffset = Math.floor(Math.random() * 60) - 10; // -10 to +50 days
    const dueDate = addDays(new Date(), daysOffset);

    let eventType: CalendarEventType;
    if (type === 'DEADLINE') {
      eventType = 'DEADLINE';
    } else if (type === 'FORM_10K' || type === 'FORM_10Q') {
      eventType = 'PERIODIC';
    } else if (type === 'FORM_8K') {
      eventType = 'CURRENT';
    } else if (type === 'DEF14A' || type === 'PREM14A') {
      eventType = 'PROXY';
    } else if (type === 'S1' || type === 'S4') {
      eventType = 'REGISTRATION';
    } else {
      eventType = 'OTHER';
    }

    events.push({
      id: `mock-${i}`,
      type,
      eventType,
      title: type === 'DEADLINE'
        ? ['Extension Deadline', 'Redemption Deadline', 'Liquidation Deadline'][Math.floor(Math.random() * 3)]!
        : `${type} Filing`,
      description: `Mock event for ${spac.name}`,
      spacId: spac.id,
      spacName: `${spac.name} (${spac.ticker})`,
      status,
      dueDate,
      priority: calculatePriority(dueDate, status),
    });
  }

  return events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
