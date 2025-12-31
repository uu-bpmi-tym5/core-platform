'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  runComplianceChecks,
  getLatestComplianceRun,
  overrideComplianceBlockers,
  addComplianceNote,
  type ComplianceRun,
  type ComplianceCheckResult,
  type ComplianceRuleSeverity,
  type ComplianceCheckStatus,
  type ComplianceRuleCategory,
} from '@/lib/graphql';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Play,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  FileText,
  DollarSign,
  Image,
  Scale,
  UserCheck,
  MessageSquare,
  Unlock,
  Clock,
} from 'lucide-react';

// Get severity badge
function getSeverityBadge(severity: ComplianceRuleSeverity) {
  switch (severity) {
    case 'BLOCKER':
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldX className="h-3 w-3" />
          Blocker
        </Badge>
      );
    case 'WARNING':
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <ShieldAlert className="h-3 w-3" />
          Warning
        </Badge>
      );
    case 'INFO':
      return (
        <Badge variant="secondary" className="gap-1">
          <Info className="h-3 w-3" />
          Info
        </Badge>
      );
  }
}

// Get status icon
function getStatusIcon(status: ComplianceCheckStatus) {
  switch (status) {
    case 'PASS':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'FAIL':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'WARN':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'SKIPPED':
      return <Info className="h-5 w-5 text-gray-400" />;
  }
}

// Get status badge
function getStatusBadge(status: ComplianceCheckStatus) {
  switch (status) {
    case 'PASS':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Pass
        </Badge>
      );
    case 'FAIL':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Fail
        </Badge>
      );
    case 'WARN':
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </Badge>
      );
    case 'SKIPPED':
      return (
        <Badge variant="secondary" className="gap-1">
          <Info className="h-3 w-3" />
          Skipped
        </Badge>
      );
  }
}

// Get category icon
function getCategoryIcon(category: ComplianceRuleCategory) {
  switch (category) {
    case 'CONTENT':
      return <FileText className="h-4 w-4" />;
    case 'FINANCIAL':
      return <DollarSign className="h-4 w-4" />;
    case 'MEDIA':
      return <Image className="h-4 w-4" />;
    case 'LEGAL':
      return <Scale className="h-4 w-4" />;
    case 'IDENTITY':
      return <UserCheck className="h-4 w-4" />;
  }
}

// Group results by category
function groupByCategory(results: ComplianceCheckResult[]) {
  const grouped: Record<ComplianceRuleCategory, ComplianceCheckResult[]> = {
    CONTENT: [],
    FINANCIAL: [],
    MEDIA: [],
    LEGAL: [],
    IDENTITY: [],
  };

  results.forEach((result) => {
    grouped[result.ruleCategory].push(result);
  });

  return grouped;
}

// Format date
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

interface ComplianceCheckerProps {
  authToken: string;
  campaignId: string;
  campaignName: string;
  isAdmin?: boolean;
  onApprovalStatusChange?: (canApprove: boolean) => void;
}

export function ComplianceChecker({
  authToken,
  campaignId,
  campaignName,
  isAdmin = false,
  onApprovalStatusChange,
}: ComplianceCheckerProps) {
  const [complianceRun, setComplianceRun] = React.useState<ComplianceRun | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [runningChecks, setRunningChecks] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Override dialog
  const [showOverrideDialog, setShowOverrideDialog] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState('');
  const [overriding, setOverriding] = React.useState(false);

  // Note dialog
  const [selectedResult, setSelectedResult] = React.useState<ComplianceCheckResult | null>(null);
  const [noteText, setNoteText] = React.useState('');
  const [savingNote, setSavingNote] = React.useState(false);

  // Load latest compliance run
  const loadComplianceRun = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLatestComplianceRun(authToken, campaignId);
      setComplianceRun(result.latestComplianceRun);
      if (onApprovalStatusChange) {
        onApprovalStatusChange(result.latestComplianceRun?.canApprove ?? false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, [authToken, campaignId, onApprovalStatusChange]);

  React.useEffect(() => {
    loadComplianceRun();
  }, [loadComplianceRun]);

  // Run compliance checks
  const handleRunChecks = async () => {
    try {
      setRunningChecks(true);
      setError(null);
      const result = await runComplianceChecks(authToken, campaignId);
      setComplianceRun(result.runComplianceChecks);
      if (onApprovalStatusChange) {
        onApprovalStatusChange(result.runComplianceChecks.canApprove);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run compliance checks');
    } finally {
      setRunningChecks(false);
    }
  };

  // Override blockers
  const handleOverride = async () => {
    if (!complianceRun || !overrideReason.trim()) return;

    try {
      setOverriding(true);
      const result = await overrideComplianceBlockers(authToken, complianceRun.id, overrideReason);
      setComplianceRun((prev) => prev ? { ...prev, ...result.overrideComplianceBlockers } : null);
      setShowOverrideDialog(false);
      setOverrideReason('');
      if (onApprovalStatusChange) {
        onApprovalStatusChange(result.overrideComplianceBlockers.canApprove);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to override blockers');
    } finally {
      setOverriding(false);
    }
  };

  // Add note to result
  const handleAddNote = async () => {
    if (!selectedResult || !noteText.trim()) return;

    try {
      setSavingNote(true);
      await addComplianceNote(authToken, selectedResult.id, noteText);
      // Update local state
      setComplianceRun((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results?.map((r) =>
            r.id === selectedResult.id ? { ...r, moderatorNote: noteText } : r
          ),
        };
      });
      setSelectedResult(null);
      setNoteText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const groupedResults = complianceRun?.results ? groupByCategory(complianceRun.results) : null;

  return (
    <>
      <Card className="border-border shadow-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Compliance Checks
              </CardTitle>
              <CardDescription>
                Verify campaign meets platform requirements before approval.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {complianceRun && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadComplianceRun()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleRunChecks}
                disabled={runningChecks}
                className="gap-1.5"
              >
                <Play className={`h-4 w-4 ${runningChecks ? 'animate-pulse' : ''}`} />
                {runningChecks ? 'Running...' : complianceRun ? 'Re-run Checks' : 'Run Checks'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && !complianceRun ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading compliance data...</div>
            </div>
          ) : !complianceRun ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-12 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No compliance checks run yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click "Run Checks" to verify this campaign meets platform requirements.
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{complianceRun.passedChecks}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{complianceRun.failedChecks}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{complianceRun.warningChecks}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{complianceRun.blockerCount}</p>
                  <p className="text-xs text-muted-foreground">Blockers</p>
                </div>
              </div>

              {/* Approval Status */}
              <div className={`rounded-lg p-4 ${
                complianceRun.canApprove
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {complianceRun.canApprove ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {complianceRun.canApprove
                          ? 'Campaign can be approved'
                          : `Campaign cannot be approved (${complianceRun.blockerCount} blocker${complianceRun.blockerCount !== 1 ? 's' : ''} failed)`}
                      </p>
                      {complianceRun.isOverridden && (
                        <p className="text-sm text-muted-foreground">
                          Blockers overridden by admin: {complianceRun.overrideReason}
                        </p>
                      )}
                    </div>
                  </div>
                  {!complianceRun.canApprove && isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOverrideDialog(true)}
                      className="gap-1.5"
                    >
                      <Unlock className="h-4 w-4" />
                      Override Blockers
                    </Button>
                  )}
                </div>
              </div>

              {/* Run Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last run: {formatDateTime(complianceRun.createdAt)}
                </div>
                {complianceRun.runBy && (
                  <div>by {complianceRun.runBy.name}</div>
                )}
              </div>

              {/* Results by Category */}
              {groupedResults && (
                <div className="space-y-4">
                  {(Object.entries(groupedResults) as [ComplianceRuleCategory, ComplianceCheckResult[]][])
                    .filter(([_, results]) => results.length > 0)
                    .map(([category, results]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          {getCategoryIcon(category)}
                          {category}
                        </div>
                        <div className="space-y-2">
                          {results.map((result) => (
                            <div
                              key={result.id}
                              className="rounded-lg border border-border bg-background p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {getStatusIcon(result.status)}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{result.ruleName}</span>
                                      {getSeverityBadge(result.ruleSeverity)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{result.message}</p>
                                    {result.evidence && (
                                      <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 font-mono">
                                        {result.evidence}
                                      </p>
                                    )}
                                    {result.moderatorNote && (
                                      <div className="flex items-start gap-2 mt-2 text-sm bg-blue-500/10 rounded-md px-3 py-2">
                                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>{result.moderatorNote}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(result.status)}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedResult(result);
                                      setNoteText(result.moderatorNote || '');
                                    }}
                                    title="Add note"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Override Compliance Blockers
            </DialogTitle>
            <DialogDescription>
              This will allow the campaign to be approved despite failed blocker checks.
              Please provide a reason for the override.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Override Reason</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this campaign should be approved despite failed checks..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={overriding || overrideReason.trim().length < 10}
            >
              {overriding ? 'Overriding...' : 'Override Blockers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Moderator Note
            </DialogTitle>
            <DialogDescription>
              Add a note to this compliance check result for record keeping.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedResult && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-medium">{selectedResult.ruleName}</p>
                <p className="text-sm text-muted-foreground">{selectedResult.message}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your notes about this check..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedResult(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

