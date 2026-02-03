// ============================================================================
// SEC Filing Deadline Calculation Logic
// ============================================================================

import {
  addDays,
  subDays,
  isWeekend,
  isSameDay,
  isBefore,
  startOfDay,
  format,
  differenceInDays,
  addMonths,
  lastDayOfMonth,
  getYear,
} from 'date-fns';

import type { FilingType } from '@/types';

import { FILING_DEFINITIONS, type FilerStatus, FILER_STATUS_DEFINITIONS } from './complianceRules';

// Re-export FilerStatus for use by other modules
export type { FilerStatus };

// ============================================================================
// FEDERAL HOLIDAYS (US)
// ============================================================================

export function getFederalHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // New Year's Day - January 1
  holidays.push(new Date(year, 0, 1));

  // Martin Luther King Jr. Day - Third Monday of January
  holidays.push(getNthWeekdayOfMonth(year, 0, 1, 3));

  // Presidents' Day - Third Monday of February
  holidays.push(getNthWeekdayOfMonth(year, 1, 1, 3));

  // Memorial Day - Last Monday of May
  holidays.push(getLastWeekdayOfMonth(year, 4, 1));

  // Juneteenth - June 19
  holidays.push(new Date(year, 5, 19));

  // Independence Day - July 4
  holidays.push(new Date(year, 6, 4));

  // Labor Day - First Monday of September
  holidays.push(getNthWeekdayOfMonth(year, 8, 1, 1));

  // Columbus Day - Second Monday of October
  holidays.push(getNthWeekdayOfMonth(year, 9, 1, 2));

  // Veterans Day - November 11
  holidays.push(new Date(year, 10, 11));

  // Thanksgiving - Fourth Thursday of November
  holidays.push(getNthWeekdayOfMonth(year, 10, 4, 4));

  // Christmas Day - December 25
  holidays.push(new Date(year, 11, 25));

  // Adjust for weekends (observed holidays)
  return holidays.map(adjustForWeekend);
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = lastDayOfMonth(new Date(year, month, 1));
  const day = lastDay.getDate();
  const lastDayWeekday = lastDay.getDay();
  const diff = (lastDayWeekday - weekday + 7) % 7;
  return new Date(year, month, day - diff);
}

function adjustForWeekend(date: Date): Date {
  const day = date.getDay();
  if (day === 0) {return addDays(date, 1);} // Sunday -> Monday
  if (day === 6) {return subDays(date, 1);} // Saturday -> Friday
  return date;
}

export function isFederalHoliday(date: Date): boolean {
  const holidays = getFederalHolidays(getYear(date));
  return holidays.some((holiday) => isSameDay(holiday, date));
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isFederalHoliday(date);
}

// ============================================================================
// BUSINESS DAY CALCULATIONS
// ============================================================================

export function addBusinessDaysCustom(date: Date, days: number): Date {
  let result = startOfDay(date);
  let remaining = days;

  while (remaining > 0) {
    result = addDays(result, 1);
    if (isBusinessDay(result)) {
      remaining--;
    }
  }

  return result;
}

export function subBusinessDaysCustom(date: Date, days: number): Date {
  let result = startOfDay(date);
  let remaining = days;

  while (remaining > 0) {
    result = subDays(result, 1);
    if (isBusinessDay(result)) {
      remaining--;
    }
  }

  return result;
}

export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (isBefore(current, end)) {
    current = addDays(current, 1);
    if (isBusinessDay(current)) {
      count++;
    }
  }

  return count;
}

export function getNextBusinessDay(date: Date): Date {
  let result = addDays(startOfDay(date), 1);
  while (!isBusinessDay(result)) {
    result = addDays(result, 1);
  }
  return result;
}

export function getPreviousBusinessDay(date: Date): Date {
  let result = subDays(startOfDay(date), 1);
  while (!isBusinessDay(result)) {
    result = subDays(result, 1);
  }
  return result;
}

// ============================================================================
// FISCAL PERIOD CALCULATIONS
// ============================================================================

export interface FiscalPeriod {
  type: 'QUARTER' | 'YEAR';
  quarter?: 1 | 2 | 3 | 4;
  year: number;
  startDate: Date;
  endDate: Date;
  filingDeadline: Date;
}

export function getFiscalYearEnd(year: number, fiscalYearEndMonth: number = 11): Date {
  // Default to December (month 11 in 0-indexed)
  return lastDayOfMonth(new Date(year, fiscalYearEndMonth, 1));
}

export function getFiscalQuarterEnd(year: number, quarter: 1 | 2 | 3 | 4, fiscalYearEndMonth: number = 11): Date {
  // Calculate quarter end based on fiscal year end
  const quarterEndMonths = [
    (fiscalYearEndMonth + 3) % 12,  // Q1
    (fiscalYearEndMonth + 6) % 12,  // Q2
    (fiscalYearEndMonth + 9) % 12,  // Q3
    fiscalYearEndMonth,              // Q4
  ];

  const quarterMonth = quarterEndMonths[quarter - 1] ?? fiscalYearEndMonth;
  const quarterYear = quarterMonth < fiscalYearEndMonth ? year + 1 : year;

  return lastDayOfMonth(new Date(quarterYear, quarterMonth, 1));
}

export function getCurrentFiscalQuarter(date: Date = new Date(), fiscalYearEndMonth: number = 11): { quarter: 1 | 2 | 3 | 4; year: number } {
  const month = date.getMonth();
  const year = date.getFullYear();

  // Calculate which quarter we're in based on fiscal year end
  const monthsFromFYE = (month - fiscalYearEndMonth - 1 + 12) % 12;
  const quarter = Math.floor(monthsFromFYE / 3) + 1 as 1 | 2 | 3 | 4;

  // Adjust fiscal year
  const fiscalYear = month > fiscalYearEndMonth ? year + 1 : year;

  return { quarter, year: fiscalYear };
}

// ============================================================================
// FILING DEADLINE CALCULATIONS
// ============================================================================

export interface DeadlineCalculation {
  filingType: FilingType;
  baseDate: Date;
  deadline: Date;
  isBusinessDays: boolean;
  daysAllowed: number;
  daysRemaining: number;
  businessDaysRemaining: number;
  isOverdue: boolean;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  warningThresholds: {
    critical: Date;
    high: Date;
    medium: Date;
  };
}

export function calculateFilingDeadline(
  filingType: FilingType,
  eventDate: Date,
  filerStatus: FilerStatus = 'NON_ACCELERATED'
): DeadlineCalculation {
  const filing = FILING_DEFINITIONS[filingType];
  const status = FILER_STATUS_DEFINITIONS[filerStatus];
  const today = startOfDay(new Date());
  const baseDate = startOfDay(eventDate);

  let daysAllowed: number;
  let deadline: Date;

  // Determine deadline based on filing type and filer status
  if (filingType === 'FORM_10K') {
    daysAllowed = status.tenKDeadlineDays;
    deadline = addDays(baseDate, daysAllowed);
  } else if (filingType === 'FORM_10Q') {
    daysAllowed = status.tenQDeadlineDays;
    deadline = addDays(baseDate, daysAllowed);
  } else if (filing.deadlineBusinessDays && filing.deadlineDays) {
    daysAllowed = filing.deadlineDays;
    deadline = addBusinessDaysCustom(baseDate, daysAllowed);
  } else if (filing.deadlineDays) {
    daysAllowed = filing.deadlineDays;
    deadline = addDays(baseDate, daysAllowed);
  } else {
    // No specific deadline
    daysAllowed = 0;
    deadline = baseDate;
  }

  // Ensure deadline falls on a business day
  while (!isBusinessDay(deadline)) {
    deadline = getPreviousBusinessDay(deadline);
  }

  const daysRemaining = differenceInDays(deadline, today);
  const businessDaysRemaining = countBusinessDays(today, deadline);
  const isOverdue = isBefore(deadline, today);

  // Calculate urgency and warning thresholds
  const warningThresholds = {
    critical: subBusinessDaysCustom(deadline, 3),
    high: subBusinessDaysCustom(deadline, 7),
    medium: subBusinessDaysCustom(deadline, 14),
  };

  let urgency: DeadlineCalculation['urgency'];
  if (isOverdue) {
    urgency = 'CRITICAL';
  } else if (isBefore(today, warningThresholds.critical) === false) {
    urgency = 'CRITICAL';
  } else if (isBefore(today, warningThresholds.high) === false) {
    urgency = 'HIGH';
  } else if (isBefore(today, warningThresholds.medium) === false) {
    urgency = 'MEDIUM';
  } else {
    urgency = 'LOW';
  }

  return {
    filingType,
    baseDate,
    deadline,
    isBusinessDays: filing.deadlineBusinessDays ?? false,
    daysAllowed,
    daysRemaining,
    businessDaysRemaining,
    isOverdue,
    urgency,
    warningThresholds,
  };
}

// ============================================================================
// PERIODIC FILING SCHEDULE
// ============================================================================

export interface PeriodicFilingSchedule {
  filingType: FilingType;
  period: FiscalPeriod;
  periodEndDate: Date;
  filingDeadline: Date;
  status: 'UPCOMING' | 'DUE' | 'FILED' | 'OVERDUE';
}

export function generatePeriodicFilingSchedule(
  fiscalYearEndMonth: number = 11,
  filerStatus: FilerStatus = 'NON_ACCELERATED',
  yearsAhead: number = 2
): PeriodicFilingSchedule[] {
  const schedule: PeriodicFilingSchedule[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const status = FILER_STATUS_DEFINITIONS[filerStatus];

  for (let year = currentYear; year <= currentYear + yearsAhead; year++) {
    // Annual 10-K
    const fyEnd = getFiscalYearEnd(year, fiscalYearEndMonth);
    const tenKDeadline = addDays(fyEnd, status.tenKDeadlineDays);

    schedule.push({
      filingType: 'FORM_10K',
      period: {
        type: 'YEAR',
        year,
        startDate: addDays(getFiscalYearEnd(year - 1, fiscalYearEndMonth), 1),
        endDate: fyEnd,
        filingDeadline: tenKDeadline,
      },
      periodEndDate: fyEnd,
      filingDeadline: tenKDeadline,
      status: isBefore(tenKDeadline, today) ? 'OVERDUE' : isBefore(today, fyEnd) ? 'UPCOMING' : 'DUE',
    });

    // Quarterly 10-Qs (Q1, Q2, Q3 - no Q4 10-Q as it's covered by 10-K)
    for (let q = 1; q <= 3; q++) {
      const quarterEnd = getFiscalQuarterEnd(year, q as 1 | 2 | 3, fiscalYearEndMonth);
      const tenQDeadline = addDays(quarterEnd, status.tenQDeadlineDays);

      schedule.push({
        filingType: 'FORM_10Q',
        period: {
          type: 'QUARTER',
          quarter: q as 1 | 2 | 3,
          year,
          startDate: q === 1
            ? addDays(getFiscalYearEnd(year - 1, fiscalYearEndMonth), 1)
            : addDays(getFiscalQuarterEnd(year, (q - 1) as 1 | 2 | 3, fiscalYearEndMonth), 1),
          endDate: quarterEnd,
          filingDeadline: tenQDeadline,
        },
        periodEndDate: quarterEnd,
        filingDeadline: tenQDeadline,
        status: isBefore(tenQDeadline, today) ? 'OVERDUE' : isBefore(today, quarterEnd) ? 'UPCOMING' : 'DUE',
      });
    }
  }

  // Sort by deadline
  return schedule.sort((a, b) => a.filingDeadline.getTime() - b.filingDeadline.getTime());
}

// ============================================================================
// EVENT-BASED DEADLINE TRACKING
// ============================================================================

export interface EventBasedDeadline {
  id: string;
  filingType: FilingType;
  eventType: string;
  eventDate: Date;
  deadline: Date;
  isBusinessDays: boolean;
  daysAllowed: number;
  description: string;
}

export function calculate8KDeadline(eventDate: Date): EventBasedDeadline {
  const deadline = addBusinessDaysCustom(eventDate, 4);

  return {
    id: `8k-${eventDate.getTime()}`,
    filingType: 'FORM_8K',
    eventType: 'Material Event',
    eventDate: startOfDay(eventDate),
    deadline,
    isBusinessDays: true,
    daysAllowed: 4,
    description: 'Form 8-K must be filed within 4 business days of triggering event',
  };
}

export function calculateSuper8KDeadline(closingDate: Date): EventBasedDeadline {
  const deadline = addBusinessDaysCustom(closingDate, 4);

  return {
    id: `super8k-${closingDate.getTime()}`,
    filingType: 'SUPER_8K',
    eventType: 'De-SPAC Transaction Closing',
    eventDate: startOfDay(closingDate),
    deadline,
    isBusinessDays: true,
    daysAllowed: 4,
    description: 'Super 8-K must be filed within 4 business days of transaction closing',
  };
}

export function calculateForm4Deadline(transactionDate: Date): EventBasedDeadline {
  const deadline = addBusinessDaysCustom(transactionDate, 2);

  return {
    id: `form4-${transactionDate.getTime()}`,
    filingType: 'FORM_4',
    eventType: 'Insider Transaction',
    eventDate: startOfDay(transactionDate),
    deadline,
    isBusinessDays: true,
    daysAllowed: 2,
    description: 'Form 4 must be filed within 2 business days of insider transaction',
  };
}

export function calculateSchedule13DDeadline(acquisitionDate: Date): EventBasedDeadline {
  const deadline = addDays(acquisitionDate, 10);

  return {
    id: `13d-${acquisitionDate.getTime()}`,
    filingType: 'SC_13D',
    eventType: '5% Beneficial Ownership Acquired',
    eventDate: startOfDay(acquisitionDate),
    deadline,
    isBusinessDays: false,
    daysAllowed: 10,
    description: 'Schedule 13D must be filed within 10 calendar days of crossing 5% threshold',
  };
}

// ============================================================================
// DEADLINE ALERT SYSTEM
// ============================================================================

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface DeadlineAlert {
  id: string;
  filingType: FilingType;
  title: string;
  message: string;
  deadline: Date;
  daysRemaining: number;
  businessDaysRemaining: number;
  severity: AlertSeverity;
  createdAt: Date;
}

export function generateDeadlineAlerts(deadlines: DeadlineCalculation[]): DeadlineAlert[] {
  const alerts: DeadlineAlert[] = [];
  const now = new Date();

  for (const deadline of deadlines) {
    let severity: AlertSeverity;
    let title: string;
    let message: string;

    if (deadline.isOverdue) {
      severity = 'CRITICAL';
      title = `OVERDUE: ${FILING_DEFINITIONS[deadline.filingType].shortName} Filing`;
      message = `Filing was due ${format(deadline.deadline, 'MMM d, yyyy')}. Immediate action required.`;
    } else if (deadline.urgency === 'CRITICAL') {
      severity = 'CRITICAL';
      title = `URGENT: ${FILING_DEFINITIONS[deadline.filingType].shortName} Deadline Approaching`;
      message = `Filing due in ${deadline.businessDaysRemaining} business days (${format(deadline.deadline, 'MMM d, yyyy')}).`;
    } else if (deadline.urgency === 'HIGH') {
      severity = 'WARNING';
      title = `${FILING_DEFINITIONS[deadline.filingType].shortName} Deadline Approaching`;
      message = `Filing due in ${deadline.businessDaysRemaining} business days (${format(deadline.deadline, 'MMM d, yyyy')}).`;
    } else {
      severity = 'INFO';
      title = `Upcoming ${FILING_DEFINITIONS[deadline.filingType].shortName} Filing`;
      message = `Filing due ${format(deadline.deadline, 'MMM d, yyyy')} (${deadline.daysRemaining} days).`;
    }

    alerts.push({
      id: `alert-${deadline.filingType}-${deadline.deadline.getTime()}`,
      filingType: deadline.filingType,
      title,
      message,
      deadline: deadline.deadline,
      daysRemaining: deadline.daysRemaining,
      businessDaysRemaining: deadline.businessDaysRemaining,
      severity,
      createdAt: now,
    });
  }

  // Sort by severity and then by deadline
  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {return severityDiff;}
    return a.deadline.getTime() - b.deadline.getTime();
  });
}

// ============================================================================
// SPAC-SPECIFIC DEADLINE CALCULATIONS
// ============================================================================

export interface SPACDeadlines {
  redemptionDeadline: Date | null;
  extensionDeadline: Date | null;
  liquidationDeadline: Date | null;
  proxyFilingDeadline: Date | null;
  voteDeadline: Date | null;
}

export function calculateSPACDeadlines(
  ipoDate: Date,
  termMonths: number = 24,
  extensionMonths: number = 0,
  daAnnouncedDate?: Date,
  voteDate?: Date
): SPACDeadlines {
  const baseDeadline = addMonths(ipoDate, termMonths + extensionMonths);

  // Liquidation deadline is the SPAC term deadline
  const liquidationDeadline = baseDeadline;

  // Extension deadline is typically 1-3 months before liquidation
  const extensionDeadline = subDays(liquidationDeadline, 30);

  // Proxy should be filed at least 20 business days before vote
  const proxyFilingDeadline = voteDate
    ? subBusinessDaysCustom(voteDate, 20)
    : null;

  // Redemption deadline is typically 2 business days before vote
  const redemptionDeadline = voteDate
    ? subBusinessDaysCustom(voteDate, 2)
    : null;

  return {
    redemptionDeadline,
    extensionDeadline,
    liquidationDeadline,
    proxyFilingDeadline,
    voteDeadline: voteDate || null,
  };
}

// ============================================================================
// SEC COMMENT LETTER RESPONSE DEADLINES
// ============================================================================

export interface CommentResponseDeadline {
  commentReceivedDate: Date;
  responseDeadline: Date;
  daysRemaining: number;
  businessDaysRemaining: number;
  isOverdue: boolean;
  canRequestExtension: boolean;
}

export function calculateCommentResponseDeadline(
  commentReceivedDate: Date,
  responseDays: number = 10
): CommentResponseDeadline {
  const today = startOfDay(new Date());
  const responseDeadline = addBusinessDaysCustom(commentReceivedDate, responseDays);
  const daysRemaining = differenceInDays(responseDeadline, today);
  const businessDaysRemaining = countBusinessDays(today, responseDeadline);
  const isOverdue = isBefore(responseDeadline, today);

  return {
    commentReceivedDate: startOfDay(commentReceivedDate),
    responseDeadline,
    daysRemaining,
    businessDaysRemaining,
    isOverdue,
    canRequestExtension: businessDaysRemaining >= 2, // Can request extension if 2+ business days remain
  };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function formatDeadline(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatDeadlineWithTime(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

/**
 * Enhanced format deadline with days remaining
 */
export function formatDeadlineWithDaysRemaining(deadline: Date): string {
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadline);
  const daysRemaining = differenceInDays(deadlineDay, today);

  const formattedDate = format(deadline, 'MMM d, yyyy');

  if (daysRemaining < 0) {
    return `${formattedDate} (${Math.abs(daysRemaining)} days overdue)`;
  }
  if (daysRemaining === 0) {
    return `${formattedDate} (Due today)`;
  }
  if (daysRemaining === 1) {
    return `${formattedDate} (1 day remaining)`;
  }
  return `${formattedDate} (${daysRemaining} days remaining)`;
}

export function getDeadlineStatus(
  deadline: Date
): 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING' | 'FUTURE' {
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadline);

  if (isBefore(deadlineDay, today)) {return 'OVERDUE';}
  if (isSameDay(deadlineDay, today)) {return 'DUE_TODAY';}
  if (differenceInDays(deadlineDay, today) <= 7) {return 'DUE_SOON';}
  if (differenceInDays(deadlineDay, today) <= 30) {return 'UPCOMING';}
  return 'FUTURE';
}

// ============================================================================
// URGENCY LEVEL CALCULATION
// ============================================================================

export type UrgencyLevel = 'critical' | 'warning' | 'normal';

/**
 * Get urgency level based on days until deadline
 * - critical: < 7 days
 * - warning: < 30 days
 * - normal: >= 30 days
 */
export function getUrgencyLevel(deadline: Date): UrgencyLevel {
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadline);
  const daysRemaining = differenceInDays(deadlineDay, today);

  if (daysRemaining < 0) {
    return 'critical'; // Overdue is critical
  }
  if (daysRemaining < 7) {
    return 'critical';
  }
  if (daysRemaining < 30) {
    return 'warning';
  }
  return 'normal';
}

// ============================================================================
// SPAC DATA TYPE FOR DEADLINE CALCULATIONS
// ============================================================================

export interface SpacData {
  id: string;
  name: string;
  ticker: string;
  status: 'SEARCHING' | 'LOI_SIGNED' | 'DA_ANNOUNCED' | 'SEC_REVIEW' | 'SHAREHOLDER_VOTE' | 'CLOSING' | 'COMPLETED' | 'LIQUIDATING' | 'LIQUIDATED' | 'TERMINATED';
  ipoDate: Date | null;
  deadline: Date | null; // Business combination deadline
  daAnnouncedDate: Date | null;
  proxyFiledDate: Date | null;
  voteDate: Date | null;
  closingDate: Date | null;
  extensionCount: number;
  fiscalYearEndMonth?: number; // 0-11, defaults to 11 (December)
  filerStatus?: FilerStatus;
  // SEC review tracking
  secCommentDate?: Date | null;
  secResponseDueDate?: Date | null;
}

// ============================================================================
// FILING DEADLINE ITEM
// ============================================================================

export interface FilingDeadlineItem {
  id: string;
  spacId: string;
  spacName: string;
  spacTicker: string;
  filingType: FilingType;
  filingName: string;
  filingShortName: string;
  deadline: Date;
  daysRemaining: number;
  businessDaysRemaining: number;
  urgency: UrgencyLevel;
  status: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING' | 'FUTURE';
  description: string;
  category: 'PERIODIC' | 'CURRENT' | 'REGISTRATION' | 'PROXY' | 'BENEFICIAL' | 'INSIDER' | 'BUSINESS_COMBINATION' | 'SEC_RESPONSE' | 'OTHER';
  eventDate?: Date;
  href?: string;
}

// ============================================================================
// CALCULATE ALL FILING DEADLINES FOR A SPAC
// ============================================================================

/**
 * Calculate all upcoming filing deadlines for a SPAC based on its lifecycle stage
 *
 * Lifecycle stage determines which deadlines are relevant:
 * - SEARCHING: Focus on periodic reports (10-K, 10-Q), business combination deadline
 * - LOI_SIGNED to DA_ANNOUNCED: 8-K requirements for material events
 * - SEC_REVIEW: Response deadlines for SEC comments
 * - SHAREHOLDER_VOTE: Proxy deadlines (PREM14A/DEFM14A)
 */
export function calculateFilingDeadlines(spac: SpacData): FilingDeadlineItem[] {
  const deadlines: FilingDeadlineItem[] = [];
  const today = startOfDay(new Date());
  const fiscalYearEndMonth = spac.fiscalYearEndMonth ?? 11; // Default December
  const filerStatus = spac.filerStatus ?? 'NON_ACCELERATED';

  // Helper function to create a deadline item
  const createDeadlineItem = (
    filingType: FilingType,
    deadline: Date,
    description: string,
    category: FilingDeadlineItem['category'],
    eventDate?: Date
  ): FilingDeadlineItem => {
    const definition = FILING_DEFINITIONS[filingType];
    const daysRemaining = differenceInDays(startOfDay(deadline), today);

    return {
      id: `${spac.id}-${filingType}-${deadline.getTime()}`,
      spacId: spac.id,
      spacName: spac.name,
      spacTicker: spac.ticker,
      filingType,
      filingName: definition?.name ?? filingType,
      filingShortName: definition?.shortName ?? filingType,
      deadline,
      daysRemaining,
      businessDaysRemaining: countBusinessDays(today, deadline),
      urgency: getUrgencyLevel(deadline),
      status: getDeadlineStatus(deadline),
      description,
      category,
      eventDate,
      href: `/compliance/filings/${spac.id}/${filingType.toLowerCase()}`,
    };
  };

  // ========================================================================
  // 1. BUSINESS COMBINATION DEADLINE (All stages until completed)
  // ========================================================================
  if (spac.deadline && !['COMPLETED', 'LIQUIDATED', 'TERMINATED'].includes(spac.status)) {
    deadlines.push(createDeadlineItem(
      'OTHER',
      spac.deadline,
      'Business combination must be completed by this date or SPAC will liquidate',
      'BUSINESS_COMBINATION'
    ));
  }

  // ========================================================================
  // 2. PERIODIC REPORTS (10-K, 10-Q) - All stages while public
  // ========================================================================
  if (spac.ipoDate && !['LIQUIDATED', 'TERMINATED'].includes(spac.status)) {
    const periodicSchedule = generatePeriodicFilingSchedule(
      fiscalYearEndMonth,
      filerStatus,
      1 // Look 1 year ahead
    );

    // Filter to upcoming deadlines only
    for (const filing of periodicSchedule) {
      if (filing.filingDeadline > today) {
        const description = filing.filingType === 'FORM_10K'
          ? `Annual report for fiscal year ${filing.period.year}`
          : `Quarterly report for Q${filing.period.quarter} ${filing.period.year}`;

        deadlines.push(createDeadlineItem(
          filing.filingType,
          filing.filingDeadline,
          description,
          'PERIODIC',
          filing.periodEndDate
        ));
      }
    }
  }

  // ========================================================================
  // 3. STAGE-SPECIFIC DEADLINES
  // ========================================================================

  switch (spac.status) {
    case 'SEARCHING':
      // Focus is on periodic reports (already added above)
      // May need to file 8-K for any material events
      break;

    case 'LOI_SIGNED':
      // 8-K required within 4 business days of signing LOI
      if (spac.daAnnouncedDate) {
        // LOI would have been before DA, estimate it
        const loiEstimatedDate = subDays(spac.daAnnouncedDate, 30);
        const loiDeadline = addBusinessDaysCustom(loiEstimatedDate, 4);
        if (loiDeadline > today) {
          deadlines.push(createDeadlineItem(
            'FORM_8K',
            loiDeadline,
            'Report LOI signing with target company',
            'CURRENT',
            loiEstimatedDate
          ));
        }
      }
      break;

    case 'DA_ANNOUNCED':
      // 8-K for DA announcement (within 4 business days)
      if (spac.daAnnouncedDate) {
        const daDeadline = addBusinessDaysCustom(spac.daAnnouncedDate, 4);
        if (daDeadline > today) {
          deadlines.push(createDeadlineItem(
            'FORM_8K',
            daDeadline,
            'Report definitive agreement with target company',
            'CURRENT',
            spac.daAnnouncedDate
          ));
        }
      }

      // S-4/PREM14A preparation reminder (typically 2-3 months after DA)
      if (spac.daAnnouncedDate) {
        const s4TargetDate = addMonths(spac.daAnnouncedDate, 2);
        if (s4TargetDate > today) {
          deadlines.push(createDeadlineItem(
            'S4',
            s4TargetDate,
            'Target date for S-4 registration statement filing',
            'REGISTRATION',
            spac.daAnnouncedDate
          ));
        }
      }
      break;

    case 'SEC_REVIEW':
      // SEC comment response deadlines
      if (spac.secCommentDate) {
        const responseDeadline = spac.secResponseDueDate
          ?? addBusinessDaysCustom(spac.secCommentDate, 10);

        if (responseDeadline > today || differenceInDays(today, startOfDay(responseDeadline)) <= 5) {
          deadlines.push(createDeadlineItem(
            'OTHER',
            responseDeadline,
            'Response to SEC comment letter required',
            'SEC_RESPONSE',
            spac.secCommentDate
          ));
        }
      }

      // Preliminary proxy filing reminder
      if (spac.voteDate && !spac.proxyFiledDate) {
        const proxyDeadline = subBusinessDaysCustom(spac.voteDate, 20);
        if (proxyDeadline > today) {
          deadlines.push(createDeadlineItem(
            'PREM14A',
            proxyDeadline,
            'Preliminary proxy must be filed at least 20 business days before vote',
            'PROXY'
          ));
        }
      }
      break;

    case 'SHAREHOLDER_VOTE':
      // Definitive proxy deadline (if not yet filed)
      if (spac.voteDate) {
        // DEF14A should be mailed at least 20 days before vote
        const defProxyDeadline = subDays(spac.voteDate, 20);
        if (defProxyDeadline > today && !spac.proxyFiledDate) {
          deadlines.push(createDeadlineItem(
            'DEF14A',
            defProxyDeadline,
            'Definitive proxy must be mailed to shareholders before vote',
            'PROXY'
          ));
        }

        // Additional soliciting materials (DEFA14A)
        deadlines.push(createDeadlineItem(
          'DEFA14A',
          spac.voteDate,
          'Additional proxy soliciting materials may be filed until vote date',
          'PROXY'
        ));

        // Redemption deadline (typically 2 business days before vote)
        const redemptionDeadline = subBusinessDaysCustom(spac.voteDate, 2);
        if (redemptionDeadline > today) {
          deadlines.push(createDeadlineItem(
            'OTHER',
            redemptionDeadline,
            'Shareholder redemption deadline',
            'OTHER'
          ));
        }
      }
      break;

    case 'CLOSING':
      // Super 8-K deadline (4 business days after closing)
      if (spac.closingDate) {
        const super8KDeadline = addBusinessDaysCustom(spac.closingDate, 4);
        deadlines.push(createDeadlineItem(
          'SUPER_8K',
          super8KDeadline,
          'Super 8-K with shell company disclosures due after transaction closing',
          'CURRENT',
          spac.closingDate
        ));
      }
      break;

    case 'COMPLETED':
      // Post-merger, continue periodic filings (already handled above)
      break;

    case 'LIQUIDATING':
      // Liquidation 8-K
      if (spac.deadline) {
        const liquidation8KDeadline = addBusinessDaysCustom(spac.deadline, 4);
        deadlines.push(createDeadlineItem(
          'FORM_8K',
          liquidation8KDeadline,
          'Report liquidation decision and shareholder distribution',
          'CURRENT',
          spac.deadline
        ));
      }
      break;
  }

  // ========================================================================
  // 4. SORT BY URGENCY AND DEADLINE
  // ========================================================================
  const urgencyOrder: Record<UrgencyLevel, number> = {
    critical: 0,
    warning: 1,
    normal: 2,
  };

  return deadlines.sort((a, b) => {
    // First sort by urgency
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) {return urgencyDiff;}
    // Then by deadline date
    return a.deadline.getTime() - b.deadline.getTime();
  });
}

// ============================================================================
// CALCULATE DEADLINES FOR MULTIPLE SPACS
// ============================================================================

/**
 * Calculate filing deadlines for multiple SPACs and merge them
 */
export function calculateAllFilingDeadlines(spacs: SpacData[]): FilingDeadlineItem[] {
  const allDeadlines: FilingDeadlineItem[] = [];

  for (const spac of spacs) {
    const spacDeadlines = calculateFilingDeadlines(spac);
    allDeadlines.push(...spacDeadlines);
  }

  // Sort all deadlines by urgency and date
  const urgencyOrder: Record<UrgencyLevel, number> = {
    critical: 0,
    warning: 1,
    normal: 2,
  };

  return allDeadlines.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) {return urgencyDiff;}
    return a.deadline.getTime() - b.deadline.getTime();
  });
}

// ============================================================================
// FILTER DEADLINES BY TYPE
// ============================================================================

export type DeadlineFilterType =
  | 'all'
  | 'periodic' // 10-K, 10-Q
  | 'current' // 8-K
  | 'proxy' // PREM14A, DEF14A, DEFA14A
  | 'business_combination'
  | 'sec_response';

/**
 * Filter deadlines by category type
 */
export function filterDeadlinesByType(
  deadlines: FilingDeadlineItem[],
  filterType: DeadlineFilterType
): FilingDeadlineItem[] {
  if (filterType === 'all') {
    return deadlines;
  }

  const categoryMap: Record<DeadlineFilterType, FilingDeadlineItem['category'][]> = {
    all: [],
    periodic: ['PERIODIC'],
    current: ['CURRENT'],
    proxy: ['PROXY'],
    business_combination: ['BUSINESS_COMBINATION'],
    sec_response: ['SEC_RESPONSE'],
  };

  const categories = categoryMap[filterType];
  return deadlines.filter(d => categories.includes(d.category));
}

/**
 * Filter deadlines by SPAC ID
 */
export function filterDeadlinesBySpac(
  deadlines: FilingDeadlineItem[],
  spacId: string | null
): FilingDeadlineItem[] {
  if (!spacId) {
    return deadlines;
  }
  return deadlines.filter(d => d.spacId === spacId);
}
