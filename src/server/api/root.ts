/**
 * SPAC OS - Root API Router
 * Combines all tRPC routers into a single API
 */

import { aiRouter } from './routers/ai.router';
import { alertRouter } from './routers/alert.router';
import { calendarRouter } from './routers/calendar.router';
import { companyRouter } from './routers/company.router';
import { complianceRouter } from './routers/compliance.router';
import { contactRouter } from './routers/contact.router';
import { documentRouter } from './routers/document.router';
import { emailRouter } from './routers/email.router';
import { filingRouter } from './routers/filing.router';
import { financialRouter } from './routers/financial.router';
import { integrationsRouter } from './routers/integrations.router';
import { interactionRouter } from './routers/interaction.router';
import { noteRouter } from './routers/note.router';
import { spacRouter } from './routers/spac';
import { targetRouter } from './routers/target.router';
import { taskRouter } from './routers/task.router';
import { createTRPCRouter } from './trpc';

/**
 * Main tRPC router combining all domain routers
 *
 * API Structure:
 *
 * - ai.*             - AI document analysis (analyzeDocument, getCachedAnalysis, cacheAnalysis, invalidateCache, getStatus)
 * - alert.*          - Compliance alerts (list, getById, create, markAsRead, dismiss, generate)
 * - calendar.*       - Calendar integration (connectGoogle, disconnectGoogle, getGoogleStatus, getGoogleEvents, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, connectCalendly, disconnectCalendly, getCalendlyStatus, getCalendlyLinks, createCalendlyLink, list, getById, create, update, delete, addAttendee, removeAttendee)
 * - email.*          - Gmail integration (connect, disconnect, getStatus, sync, list, getThread, send, reply, markRead, toggleStar)
 * - filing.*         - SEC filing management (list, getById, create, update, delete, syncFilingsFromEdgar, getEdgarFilings)
 * - spac.*           - SPAC management (list, getById, create, update, delete)
 * - target.*         - Acquisition target management (list, getById, create, update, delete, updateStatus)
 * - note.*           - Note management (list, getById, create, update, delete, getByTarget, getBySpac)
 * - document.*       - Document management (list, getById, create, update, delete, getSignedUrl, getVersionHistory)
 * - integrations.*   - Integration health checks (healthCheck, getConnectionStatus, getSetupRequirements, validateGoogleCredentials)
 */
export const appRouter = createTRPCRouter({
  ai: aiRouter,
  alert: alertRouter,
  calendar: calendarRouter,
  company: companyRouter,
  compliance: complianceRouter,
  contact: contactRouter,
  document: documentRouter,
  email: emailRouter,
  filing: filingRouter,
  financial: financialRouter,
  integrations: integrationsRouter,
  interaction: interactionRouter,
  note: noteRouter,
  spac: spacRouter,
  target: targetRouter,
  task: taskRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
