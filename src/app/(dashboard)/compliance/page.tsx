'use client';

import { useState } from 'react';
import {
  Shield,
  CheckSquare,
  Users,
  Lock,
  AlertTriangle,
  FileText,
  History,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import compliance modules
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist';
import { BoardMeetingManager } from '@/components/compliance/BoardMeetingManager';
import { InsiderTradingWindow } from '@/components/compliance/InsiderTradingWindow';
import { ConflictOfInterestLog } from '@/components/compliance/ConflictOfInterestLog';
import { PolicyLibrary } from '@/components/compliance/PolicyLibrary';
import { AuditTrail } from '@/components/compliance/AuditTrail';

type ComplianceModule =
  | 'dashboard'
  | 'checklist'
  | 'board'
  | 'trading'
  | 'conflicts'
  | 'policies'
  | 'audit';

interface ModuleConfig {
  key: ComplianceModule;
  label: string;
  description: string;
  icon: React.ElementType;
}

const modules: ModuleConfig[] = [
  {
    key: 'dashboard',
    label: 'Overview',
    description: 'Compliance score and quick stats',
    icon: LayoutDashboard,
  },
  {
    key: 'checklist',
    label: 'Compliance Checklist',
    description: 'SOX and SEC requirements',
    icon: CheckSquare,
  },
  {
    key: 'board',
    label: 'Board Meetings',
    description: 'Meetings and resolutions',
    icon: Users,
  },
  {
    key: 'trading',
    label: 'Insider Trading',
    description: 'Windows and pre-clearance',
    icon: Lock,
  },
  {
    key: 'conflicts',
    label: 'Conflicts of Interest',
    description: 'Disclosures and transactions',
    icon: AlertTriangle,
  },
  {
    key: 'policies',
    label: 'Policy Library',
    description: 'Policies and acknowledgments',
    icon: FileText,
  },
  {
    key: 'audit',
    label: 'Audit Trail',
    description: 'System activity log',
    icon: History,
  },
];

export default function CompliancePage() {
  const [activeModule, setActiveModule] = useState<ComplianceModule>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <ComplianceDashboard />;
      case 'checklist':
        return <ComplianceChecklist />;
      case 'board':
        return <BoardMeetingManager />;
      case 'trading':
        return <InsiderTradingWindow />;
      case 'conflicts':
        return <ConflictOfInterestLog />;
      case 'policies':
        return <PolicyLibrary />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <ComplianceDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="page-title">Compliance & Governance</h1>
            <p className="page-description">
              SOX and SEC compliance tracking, board management, and corporate governance
            </p>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-lg bg-slate-100 p-1">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.key}
                onClick={() => setActiveModule(module.key)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                  activeModule === module.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {module.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Module Content */}
      <div>{renderModule()}</div>
    </div>
  );
}
