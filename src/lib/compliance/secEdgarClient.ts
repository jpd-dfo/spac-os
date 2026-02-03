// ============================================================================
// SEC EDGAR API Integration Client
// ============================================================================

import { logger } from '@/lib/logger';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EdgarCompanyInfo {
  cik: string;
  name: string;
  ticker: string;
  sicCode: string;
  sicDescription: string;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  exchanges: string[];
  ein: string | null;
  category: string;
  filingCount: number;
}

export interface EdgarFiling {
  accessionNumber: string;
  filingType: string;
  filingDate: string;
  reportDate: string | null;
  acceptanceDateTime: string;
  primaryDocument: string;
  primaryDocDescription: string;
  size: number;
  isXbrl: boolean;
  isInlineXbrl: boolean;
  fileNumber: string;
  filmNumber: string;
  items: string[];
  documentUrls: EdgarDocument[];
}

export interface EdgarDocument {
  sequence: string;
  description: string;
  documentUrl: string;
  type: string;
  size: number;
}

export interface EdgarSearchResult {
  cik: string;
  companyName: string;
  ticker: string;
  filings: EdgarFiling[];
  totalFilings: number;
  page: number;
  pageSize: number;
}

export interface EdgarCommentLetter {
  accessionNumber: string;
  correspondenceType: 'STAFF_COMMENT' | 'COMPANY_RESPONSE';
  filingDate: string;
  relatedFiling: string;
  documentUrl: string;
  letterNumber: number;
}

export interface EdgarCompanySubmissions {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string | null;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  category: string;
  filings: {
    recent: {
      accessionNumber: string[];
      form: string[];
      filingDate: string[];
      reportDate: (string | null)[];
      acceptanceDateTime: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
      size: number[];
      isXBRL: boolean[];
      isInlineXBRL: boolean[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
    };
  };
}

export interface FetchFilingsOptions {
  page?: number;
  pageSize?: number;
  formTypes?: string[];
}

export interface FetchFilingsResult {
  filings: EdgarFiling[];
  totalFilings: number;
  page: number;
  pageSize: number;
  companyInfo: EdgarCompanyInfo | null;
}

// ============================================================================
// SEC EDGAR API CONFIGURATION
// ============================================================================

const SEC_EDGAR_BASE_URL = 'https://data.sec.gov';
const SEC_EDGAR_ARCHIVES_URL = 'https://www.sec.gov/Archives/edgar/data';
const SEC_EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';

// SEC requires a User-Agent header with contact info
const SEC_USER_AGENT = 'SPAC-OS/1.0 (contact@spacos.com)';

// Rate limiting: SEC allows max 10 requests per second
const RATE_LIMIT_MS = 100;

// NOTE: Serverless Environment Limitation
// This module-level state does not persist across serverless function instances.
// Each cold start creates a new instance with lastRequestTime = 0.
// This is acceptable for SEC EDGAR because:
// 1. SEC's limit is generous (10 req/sec) and our 100ms delay is conservative
// 2. Serverless instances typically handle one request at a time
// 3. Cold starts are infrequent enough that we won't hit rate limits
// For high-volume scenarios, consider using Redis or a distributed rate limiter.
let lastRequestTime = 0;

// ============================================================================
// RATE LIMITED FETCH
// ============================================================================

/**
 * Performs a rate-limited fetch request to comply with SEC's 10 req/sec limit
 */
async function rateLimitedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': SEC_USER_AGENT,
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class SecEdgarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SecEdgarError';
  }
}

export class RateLimitError extends SecEdgarError {
  constructor(retryAfter?: number) {
    super(
      `SEC EDGAR rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter}ms` : ''}`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends SecEdgarError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats CIK number with leading zeros (10 digits)
 */
function formatCik(cik: string): string {
  return cik.replace(/^0+/, '').padStart(10, '0');
}

/**
 * Removes dashes from accession number for URL construction
 */
function formatAccessionForUrl(accessionNumber: string): string {
  return accessionNumber.replace(/-/g, '');
}

/**
 * Builds the EDGAR URL for a filing
 */
function buildEdgarUrl(cik: string, accessionNumber: string): string {
  const paddedCik = formatCik(cik);
  const accessionFormatted = formatAccessionForUrl(accessionNumber);
  return `${SEC_EDGAR_BASE_URL}/Archives/edgar/data/${paddedCik}/${accessionFormatted}`;
}

/**
 * Build URL for filing document
 */
export function buildFilingUrl(cik: string, accessionNumber: string, document: string): string {
  const paddedCik = formatCik(cik);
  const accessionFormatted = formatAccessionForUrl(accessionNumber);
  return `${SEC_EDGAR_BASE_URL}/Archives/edgar/data/${paddedCik}/${accessionFormatted}/${document}`;
}

/**
 * Build SEC viewer URL for filing
 */
export function buildSecViewerUrl(accessionNumber: string): string {
  return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=&accession_number=${accessionNumber}&xbrl_type=v`;
}

// ============================================================================
// PRIMARY API FUNCTIONS
// ============================================================================

/**
 * Fetch company filings from SEC EDGAR API
 *
 * @param cik - The CIK number of the company
 * @param options - Optional pagination and filtering options
 * @returns Promise with filings and company info
 *
 * SEC EDGAR API endpoint: https://data.sec.gov/submissions/CIK{cik}.json
 */
export async function fetchCompanyFilings(
  cik: string,
  options: FetchFilingsOptions = {}
): Promise<FetchFilingsResult> {
  const { page = 1, pageSize = 100, formTypes } = options;
  const paddedCik = formatCik(cik);

  try {
    const response = await rateLimitedFetch(
      `${SEC_EDGAR_BASE_URL}/submissions/CIK${paddedCik}.json`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError(`Company with CIK ${cik}`);
      }
      if (response.status === 429) {
        throw new RateLimitError();
      }
      throw new SecEdgarError(
        `Failed to fetch company filings: ${response.statusText}`,
        'FETCH_ERROR',
        response.status
      );
    }

    const data = await response.json() as EdgarCompanySubmissions;
    const recent = data.filings?.recent;

    if (!recent) {
      return {
        filings: [],
        totalFilings: 0,
        page,
        pageSize,
        companyInfo: null,
      };
    }

    // Parse company info
    const companyInfo: EdgarCompanyInfo = {
      cik: paddedCik,
      name: data.name,
      ticker: data.tickers?.[0] || '',
      sicCode: data.sic,
      sicDescription: data.sicDescription,
      stateOfIncorporation: data.stateOfIncorporation,
      fiscalYearEnd: data.fiscalYearEnd,
      exchanges: data.exchanges || [],
      ein: data.ein,
      category: data.category,
      filingCount: recent.accessionNumber?.length || 0,
    };

    // Parse filings
    let filings: EdgarFiling[] = [];
    const totalLength = recent.accessionNumber?.length || 0;

    for (let i = 0; i < totalLength; i++) {
      const formType = recent.form[i] ?? '';
      const accessionNumber = recent.accessionNumber[i] ?? '';
      const filingDate = recent.filingDate[i] ?? '';
      const acceptanceDateTime = recent.acceptanceDateTime[i] ?? '';
      const primaryDocument = recent.primaryDocument[i] ?? '';

      // Skip if essential data is missing
      if (!formType || !accessionNumber || !filingDate) {
        continue;
      }

      // Filter by form types if specified
      if (formTypes && formTypes.length > 0) {
        const matchesFilter = formTypes.some(type =>
          formType.toUpperCase().includes(type.toUpperCase()) ||
          type.toUpperCase().includes(formType.toUpperCase().replace('/', '').replace('-', ''))
        );
        if (!matchesFilter) {
          continue;
        }
      }

      const accessionFormatted = formatAccessionForUrl(accessionNumber);

      filings.push({
        accessionNumber,
        filingType: formType,
        filingDate,
        reportDate: recent.reportDate?.[i] || null,
        acceptanceDateTime,
        primaryDocument,
        primaryDocDescription: recent.primaryDocDescription?.[i] || '',
        size: recent.size?.[i] || 0,
        isXbrl: recent.isXBRL?.[i] || false,
        isInlineXbrl: recent.isInlineXBRL?.[i] || false,
        fileNumber: recent.fileNumber?.[i] || '',
        filmNumber: recent.filmNumber?.[i] || '',
        items: recent.items?.[i]?.split(',').filter(Boolean) || [],
        documentUrls: [{
          sequence: '1',
          description: recent.primaryDocDescription?.[i] || 'Primary Document',
          documentUrl: `${SEC_EDGAR_BASE_URL}/Archives/edgar/data/${paddedCik}/${accessionFormatted}/${primaryDocument}`,
          type: formType,
          size: recent.size?.[i] || 0,
        }],
      });
    }

    // Apply pagination
    const totalFilings = filings.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    filings = filings.slice(startIndex, endIndex);

    return {
      filings,
      totalFilings,
      page,
      pageSize,
      companyInfo,
    };
  } catch (error) {
    if (error instanceof SecEdgarError) {
      throw error;
    }
    logger.error('Error fetching company filings:', error);
    throw new SecEdgarError(
      'Failed to fetch company filings',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}

/**
 * Fetch specific filing details by accession number
 *
 * @param cik - The CIK number of the company
 * @param accessionNumber - The accession number of the filing
 * @returns Promise with filing details
 *
 * SEC EDGAR API endpoint: https://www.sec.gov/Archives/edgar/data/{cik}/{accessionNumber}/index.json
 */
export async function fetchFilingDetails(
  cik: string,
  accessionNumber: string
): Promise<EdgarFiling | null> {
  const paddedCik = formatCik(cik);
  const accessionFormatted = formatAccessionForUrl(accessionNumber);

  try {
    const response = await rateLimitedFetch(
      `${SEC_EDGAR_BASE_URL}/Archives/edgar/data/${paddedCik}/${accessionFormatted}/index.json`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError(`Filing ${accessionNumber}`);
      }
      if (response.status === 429) {
        throw new RateLimitError();
      }
      throw new SecEdgarError(
        `Failed to fetch filing details: ${response.statusText}`,
        'FETCH_ERROR',
        response.status
      );
    }

    const data = await response.json();
    const directory = data.directory;

    if (!directory?.item) {
      return null;
    }

    // Parse documents from the filing directory
    const documents: EdgarDocument[] = directory.item
      .filter((item: { name: string }) =>
        !item.name.endsWith('.txt') &&
        !item.name.startsWith('R') &&
        !item.name.includes('FilingSummary')
      )
      .map((item: { name: string; description?: string; type?: string; size?: number }, index: number) => ({
        sequence: (index + 1).toString(),
        description: item.description || item.name,
        documentUrl: `${SEC_EDGAR_BASE_URL}/Archives/edgar/data/${paddedCik}/${accessionFormatted}/${item.name}`,
        type: item.type || '',
        size: item.size || 0,
      }));

    // Find primary document (usually HTML/HTM)
    const primaryDoc = documents.find(d =>
      d.documentUrl.endsWith('.htm') || d.documentUrl.endsWith('.html')
    ) || documents[0];

    return {
      accessionNumber,
      filingType: data.type || '',
      filingDate: data.filingDate || '',
      reportDate: data.reportDate || null,
      acceptanceDateTime: data.acceptanceDateTime || '',
      primaryDocument: primaryDoc?.documentUrl.split('/').pop() || '',
      primaryDocDescription: primaryDoc?.description || '',
      size: documents.reduce((sum, d) => sum + d.size, 0),
      isXbrl: documents.some(d => d.documentUrl.includes('xbrl')),
      isInlineXbrl: documents.some(d => d.type.toLowerCase().includes('inline')),
      fileNumber: data.fileNumber || '',
      filmNumber: data.filmNumber || '',
      items: data.items?.split(',').filter(Boolean) || [],
      documentUrls: documents,
    };
  } catch (error) {
    if (error instanceof SecEdgarError) {
      throw error;
    }
    logger.error('Error fetching filing details:', error);
    throw new SecEdgarError(
      'Failed to fetch filing details',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}

/**
 * Search filings by CIK with optional form type filters
 *
 * @param cik - The CIK number of the company
 * @param formTypes - Optional array of form types to filter by (e.g., ['S-1', '8-K', '10-K'])
 * @param options - Optional pagination options
 * @returns Promise with search results
 */
export async function searchFilingsByCik(
  cik: string,
  formTypes?: string[],
  options: { page?: number; pageSize?: number } = {}
): Promise<FetchFilingsResult> {
  return fetchCompanyFilings(cik, {
    ...options,
    formTypes,
  });
}

// ============================================================================
// CIK LOOKUP AND COMPANY INFO
// ============================================================================

/**
 * Look up CIK number by ticker symbol
 */
export async function lookupCIK(ticker: string): Promise<string | null> {
  try {
    const response = await rateLimitedFetch(
      `${SEC_EDGAR_BASE_URL}/submissions/CIK${ticker.toUpperCase()}.json`
    );

    if (!response.ok) {
      // Try company tickers lookup
      const tickersResponse = await rateLimitedFetch(
        'https://www.sec.gov/files/company_tickers.json'
      );

      if (!tickersResponse.ok) {return null;}

      const tickers = await tickersResponse.json() as Record<string, { ticker: string; cik_str: string }>;
      const entry = Object.values(tickers).find(
        (t) => t.ticker === ticker.toUpperCase()
      );

      return entry ? entry.cik_str.toString().padStart(10, '0') : null;
    }

    const data = await response.json();
    return data.cik?.toString().padStart(10, '0') || null;
  } catch (error) {
    logger.error('Error looking up CIK:', error);
    return null;
  }
}

/**
 * Get company information from SEC EDGAR
 */
export async function getCompanyInfo(cik: string): Promise<EdgarCompanyInfo | null> {
  try {
    const paddedCik = formatCik(cik);
    const response = await rateLimitedFetch(
      `${SEC_EDGAR_BASE_URL}/submissions/CIK${paddedCik}.json`
    );

    if (!response.ok) {return null;}

    const data = await response.json();

    return {
      cik: paddedCik,
      name: data.name,
      ticker: data.tickers?.[0] || '',
      sicCode: data.sic,
      sicDescription: data.sicDescription,
      stateOfIncorporation: data.stateOfIncorporation,
      fiscalYearEnd: data.fiscalYearEnd,
      exchanges: data.exchanges || [],
      ein: data.ein,
      category: data.category,
      filingCount: data.filings?.recent?.accessionNumber?.length || 0,
    };
  } catch (error) {
    logger.error('Error fetching company info:', error);
    return null;
  }
}

// ============================================================================
// FILING RETRIEVAL (Legacy compatibility)
// ============================================================================

/**
 * Get recent filings for a company (Legacy function for backward compatibility)
 */
export async function getRecentFilings(
  cik: string,
  filingTypes?: FilingType[],
  limit: number = 100
): Promise<EdgarFiling[]> {
  try {
    // Convert FilingType enum to form type strings
    const formTypes = filingTypes?.map(type => {
      const typeMap: Record<string, string[]> = {
        'S1': ['S-1', 'S-1/A'],
        'S4': ['S-4', 'S-4/A'],
        'DEF14A': ['DEF 14A'],
        'PREM14A': ['PREM14A'],
        'DEFA14A': ['DEFA14A'],
        'FORM_8K': ['8-K', '8-K/A'],
        'FORM_10K': ['10-K', '10-K/A'],
        'FORM_10Q': ['10-Q', '10-Q/A'],
        'SUPER_8K': ['8-K'],
        'FORM_425': ['425'],
        'SC_13D': ['SC 13D', 'SC 13D/A'],
        'SC_13G': ['SC 13G', 'SC 13G/A'],
        'FORM_3': ['3'],
        'FORM_4': ['4'],
        'FORM_5': ['5'],
      };
      return typeMap[type] || [type];
    }).flat();

    const result = await fetchCompanyFilings(cik, {
      pageSize: limit,
      formTypes,
    });

    return result.filings;
  } catch (error) {
    logger.error('Error fetching filings:', error);
    return [];
  }
}

/**
 * Get a specific filing by accession number (Legacy function)
 */
export async function getFiling(
  cik: string,
  accessionNumber: string
): Promise<EdgarFiling | null> {
  try {
    return await fetchFilingDetails(cik, accessionNumber);
  } catch (error) {
    logger.error('Error fetching filing:', error);
    return null;
  }
}

// ============================================================================
// COMMENT LETTER RETRIEVAL
// ============================================================================

/**
 * Get comment letters for a filing
 */
export async function getCommentLetters(
  cik: string,
  filingAccessionNumber?: string
): Promise<EdgarCommentLetter[]> {
  try {
    // Comment letters are stored in a separate correspondence folder
    const paddedCik = formatCik(cik);

    // Fetch all filings to find correspondence
    const result = await fetchCompanyFilings(cik, { pageSize: 500 });
    const filings = result.filings;

    const commentLetters: EdgarCommentLetter[] = [];

    for (const filing of filings) {
      // Look for CORRESP and UPLOAD filings which are comment letter responses
      if (filing.filingType.includes('CORRESP') || filing.filingType.includes('UPLOAD')) {
        commentLetters.push({
          accessionNumber: filing.accessionNumber,
          correspondenceType: filing.filingType.includes('UPLOAD') ? 'STAFF_COMMENT' : 'COMPANY_RESPONSE',
          filingDate: filing.filingDate,
          relatedFiling: filingAccessionNumber || '',
          documentUrl: filing.documentUrls[0]?.documentUrl || '',
          letterNumber: commentLetters.filter(
            cl => cl.relatedFiling === (filingAccessionNumber || '')
          ).length + 1,
        });
      }
    }

    return commentLetters;
  } catch (error) {
    logger.error('Error fetching comment letters:', error);
    return [];
  }
}

// ============================================================================
// FULL-TEXT SEARCH
// ============================================================================

export interface SearchParams {
  query: string;
  filingTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  cik?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  cik: string;
  companyName: string;
  ticker: string | null;
  filingType: string;
  accessionNumber: string;
  filingDate: string;
  description: string;
  documentUrl: string;
  highlights: string[];
}

/**
 * Search SEC EDGAR filings
 */
export async function searchFilings(params: SearchParams): Promise<{
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}> {
  try {
    const { query, filingTypes, dateRange, cik, page = 1, pageSize = 20 } = params;

    // Build EDGAR full-text search URL
    const searchParams = new URLSearchParams({
      q: query,
      dateRange: dateRange ? 'custom' : 'all',
      startdt: dateRange?.start || '',
      enddt: dateRange?.end || '',
      forms: filingTypes?.join(',') || '',
      ciks: cik || '',
      from: ((page - 1) * pageSize).toString(),
      size: pageSize.toString(),
    });

    const response = await rateLimitedFetch(
      `${SEC_EDGAR_SEARCH_URL}?${searchParams.toString()}`
    );

    if (!response.ok) {
      return { results: [], total: 0, page, pageSize };
    }

    const data = await response.json();

    const results: SearchResult[] = (data.hits?.hits || []).map((hit: {
      _source: {
        ciks: string[];
        display_names: string[];
        tickers: string[];
        form: string;
        adsh: string;
        file_date: string;
        file_description: string;
      };
      highlight?: { content?: string[] };
    }) => ({
      cik: hit._source.ciks?.[0] || '',
      companyName: hit._source.display_names?.[0] || '',
      ticker: hit._source.tickers?.[0] || null,
      filingType: hit._source.form,
      accessionNumber: hit._source.adsh,
      filingDate: hit._source.file_date,
      description: hit._source.file_description,
      documentUrl: buildEdgarUrl(hit._source.ciks?.[0] ?? '', hit._source.adsh ?? ''),
      highlights: hit.highlight?.content || [],
    }));

    return {
      results,
      total: data.hits?.total?.value || 0,
      page,
      pageSize,
    };
  } catch (error) {
    logger.error('Error searching filings:', error);
    return { results: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 };
  }
}

// ============================================================================
// INSIDER TRADING DATA
// ============================================================================

export interface InsiderTransaction {
  filingDate: string;
  reportingOwner: string;
  relationship: string;
  transactionDate: string;
  transactionCode: string;
  transactionCodeDescription: string;
  shares: number;
  pricePerShare: number | null;
  sharesOwnedAfter: number;
  directOrIndirect: 'D' | 'I';
  accessionNumber: string;
}

/**
 * Get insider transactions for a company
 */
export async function getInsiderTransactions(
  cik: string,
  limit: number = 50
): Promise<InsiderTransaction[]> {
  try {
    // Get Form 3, 4, 5 filings
    const filings = await getRecentFilings(cik, ['FORM_3', 'FORM_4', 'FORM_5'], limit);

    // Note: Parsing actual Form 4 XML data would require additional processing
    // This returns basic filing information
    const transactions: InsiderTransaction[] = filings.map(filing => ({
      filingDate: filing.filingDate,
      reportingOwner: filing.primaryDocDescription || 'Unknown',
      relationship: filing.filingType === 'FORM_3' ? 'Initial Statement' : 'Change in Ownership',
      transactionDate: filing.reportDate || filing.filingDate,
      transactionCode: filing.filingType === '4' ? 'P/S' : 'N/A',
      transactionCodeDescription: 'See filing for details',
      shares: 0, // Would need to parse XML
      pricePerShare: null,
      sharesOwnedAfter: 0,
      directOrIndirect: 'D',
      accessionNumber: filing.accessionNumber,
    }));

    return transactions;
  } catch (error) {
    logger.error('Error fetching insider transactions:', error);
    return [];
  }
}

// ============================================================================
// FILING STATUS MAPPING
// ============================================================================

export function mapEdgarFilingToStatus(filing: EdgarFiling): FilingStatus {
  // If filing has been submitted to SEC
  if (filing.acceptanceDateTime) {
    return 'SUBMITTED';
  }
  return 'DRAFT';
}

export function mapFilingTypeToInternal(edgarType: string): FilingType {
  const typeMap: Record<string, FilingType> = {
    'S-1': 'S1',
    'S-1/A': 'S1',
    'S-4': 'S4',
    'S-4/A': 'S4',
    'DEF 14A': 'DEF14A',
    'PREM14A': 'PREM14A',
    'DEFA14A': 'DEFA14A',
    '8-K': 'FORM_8K',
    '8-K/A': 'FORM_8K',
    '10-K': 'FORM_10K',
    '10-K/A': 'FORM_10K',
    '10-Q': 'FORM_10Q',
    '10-Q/A': 'FORM_10Q',
    '425': 'FORM_425',
    'SC 13D': 'SC_13D',
    'SC 13D/A': 'SC_13D',
    'SC 13G': 'SC_13G',
    'SC 13G/A': 'SC_13G',
    '3': 'FORM_3',
    '4': 'FORM_4',
    '5': 'FORM_5',
  };

  return typeMap[edgarType] || 'OTHER';
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Sync filings for multiple companies
 */
export async function syncFilingsForCompanies(
  ciks: string[],
  filingTypes?: FilingType[],
  limit: number = 50
): Promise<Map<string, EdgarFiling[]>> {
  const results = new Map<string, EdgarFiling[]>();

  for (const cik of ciks) {
    const filings = await getRecentFilings(cik, filingTypes, limit);
    results.set(cik, filings);
  }

  return results;
}

/**
 * Monitor for new filings (polling-based)
 */
export async function checkForNewFilings(
  cik: string,
  lastKnownAccessionNumber: string,
  filingTypes?: FilingType[]
): Promise<EdgarFiling[]> {
  const filings = await getRecentFilings(cik, filingTypes, 20);

  // Find filings newer than the last known one
  const newFilings: EdgarFiling[] = [];
  for (const filing of filings) {
    if (filing.accessionNumber === lastKnownAccessionNumber) {
      break;
    }
    newFilings.push(filing);
  }

  return newFilings;
}

// ============================================================================
// EXPORT DEFAULT CLIENT
// ============================================================================

export const secEdgarClient = {
  // Primary API functions
  fetchCompanyFilings,
  fetchFilingDetails,
  searchFilingsByCik,

  // CIK and company info
  lookupCIK,
  getCompanyInfo,

  // Legacy compatibility
  getRecentFilings,
  getFiling,
  getCommentLetters,

  // Search
  searchFilings,

  // Insider trading
  getInsiderTransactions,

  // Bulk operations
  syncFilingsForCompanies,
  checkForNewFilings,

  // Utility functions
  buildFilingUrl,
  buildSecViewerUrl,
  mapEdgarFilingToStatus,
  mapFilingTypeToInternal,
};

export default secEdgarClient;
