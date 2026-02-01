// ============================================================================
// SEC Filing Deadline Calculation Logic
// ============================================================================

import {
  addDays,
  addBusinessDays,
  subDays,
  subBusinessDays,
  isWeekend,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  format,
  parseISO,
  differenceInDays,
  differenceInBusinessDays,
  addMonths,
  setDate,
  lastDayOfMonth,
  getQuarter,
  getYear,
  setMonth,
  setYear,
} from 'date-fns';
import type { FilingType } from '@/types';
import { FILING_DEFINITIONS, type FilerStatus, FILER_STATUS_DEFINITIONS } from './complianceRules';

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
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = lastDayOfMonth(new Date(year, month, 1));
  let day = lastDay.getDate();
  const lastDayWeekday = lastDay.getDay();
  const diff = (lastDayWeekday - weekday + 7) % 7;
  return new Date(year, month, day - diff);
}

function adjustForWeekend(date: Date): Date {
  const day = date.getDay();
  if (day === 0) return addDays(date, 1); // Sunday -> Monday
  if (day === 6) return subDays(date, 1); // Saturday -> Friday
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

  const quarterMonth = quarterEndMonths[quarter - 1];
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
    if (severityDiff !== 0) return severityDiff;
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

export function getDeadlineStatus(
  deadline: Date
): 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING' | 'FUTURE' {
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadline);

  if (isBefore(deadlineDay, today)) return 'OVERDUE';
  if (isSameDay(deadlineDay, today)) return 'DUE_TODAY';
  if (differenceInDays(deadlineDay, today) <= 7) return 'DUE_SOON';
  if (differenceInDays(deadlineDay, today) <= 30) return 'UPCOMING';
  return 'FUTURE';
}
