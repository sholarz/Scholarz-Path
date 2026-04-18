import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { Flag, Eye, Check, X, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { ReviewReportDialog } from './ReviewReportDialog';
import type { Report } from '../../lib/forum-context';
import { AdminLayout } from '../admin/AdminLayout';

function parseModerationAction(action?: string): {
  kind: 'remove' | 'warn' | 'dismiss' | 'other';
  label: string;
  note?: string;
  reviewedBy?: string;
} {
  if (!action?.trim()) {
    return {
      kind: 'other',
      label: '-',
    };
  }

  const [actionPart, byPart] = action.split('| by:').map((part) => part.trim());
  const separatorIndex = actionPart.indexOf(':');
  const actionKey = (separatorIndex >= 0 ? actionPart.slice(0, separatorIndex) : actionPart).trim().toLowerCase();
  const note = separatorIndex >= 0 ? actionPart.slice(separatorIndex + 1).trim() : '';

  if (actionKey === 'warn-user') {
    return {
      kind: 'warn',
      label: 'Peringatan Dikirim',
      note: note || undefined,
      reviewedBy: byPart || undefined,
    };
  }

  if (actionKey === 'remove-content' || actionKey.includes('remove')) {
    return {
      kind: 'remove',
      label: 'Konten Dihapus',
      note: note || undefined,
      reviewedBy: byPart || undefined,
    };
  }

  if (actionKey === 'dismiss' || actionKey.includes('keep')) {
    return {
      kind: 'dismiss',
      label: 'Laporan Ditolak',
      note: note || undefined,
      reviewedBy: byPart || undefined,
    };
  }

  return {
    kind: 'other',
    label: actionPart,
    note: note || undefined,
    reviewedBy: byPart || undefined,
  };
}

export function AdminReportsPage() {
  const { user } = useAuth();
  const { reports, posts } = useForum();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            This page can only be accessed by administrators.
          </p>
          <Link to="/forum">
            <Button>Back to Forum</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status === 'reviewed' || r.status === 'resolved' || r.status === 'dismissed');

  const getReportTarget = (report: Report) => {
    if (report.targetType === 'post') {
      return posts.find(p => p.id === report.targetId);
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/dashboard">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Content Reports</h1>
            <p className="text-muted-foreground">
              Review and moderate reported content
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{pendingReports.length}</div>
            <div className="text-sm text-muted-foreground">Pending Reports</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Flag className="h-4 w-4" />
              Pending ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="gap-2">
              <Check className="h-4 w-4" />
              Reviewed ({reviewedReports.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Reports */}
          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending reports</p>
                </CardContent>
              </Card>
            ) : (
              pendingReports.map(report => {
                const target = getReportTarget(report);
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="gap-1">
                              <Flag className="h-3 w-3" />
                              {report.reason.replace('-', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {report.targetType === 'post' ? 'Post' : 'Comment'}
                            </Badge>
                          </div>

                          <h3 className="font-semibold mb-2">
                            Reported by: {report.reporterName}
                          </h3>
                          
                          <div className="bg-muted p-3 rounded-lg mb-3">
                            <p className="text-sm font-medium mb-1">Reported content:</p>
                            <p className="text-sm line-clamp-2 mb-2">{report.targetContent}</p>
                            <p className="text-xs text-muted-foreground">By: {report.targetAuthor}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Description:</span> {report.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: localeId })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {target && (
                            <Link to={`/forum/${report.targetId}`}>
                              <Button variant="outline" size="sm" className="gap-2 w-full">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Reviewed Reports */}
          <TabsContent value="reviewed" className="space-y-4">
            {reviewedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reviewed reports</p>
                </CardContent>
              </Card>
            ) : (
              reviewedReports.map(report => {
                const actionMeta = parseModerationAction(report.action);

                return (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              {report.status === 'resolved' ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Resolved
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3" />
                                  Dismissed
                                </>
                              )}
                            </Badge>
                            {actionMeta.kind === 'warn' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300" variant="outline">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Warning Dikirim
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {report.targetType === 'post' ? 'Post' : 'Comment'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {report.reason.replace('-', ' ')}
                            </span>
                          </div>

                          <div className="bg-muted p-3 rounded-lg mb-3">
                            <p className="text-sm line-clamp-1">{report.targetContent}</p>
                          </div>

                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Reviewed by:</span> {actionMeta.reviewedBy || report.reviewedBy}
                            </p>
                            <p>
                              <span className="font-medium">Action:</span> {actionMeta.label}
                            </p>
                            {actionMeta.note && (
                              <p>
                                <span className="font-medium">Catatan:</span> {actionMeta.note}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {report.reviewedAt && formatDistanceToNow(report.reviewedAt, { addSuffix: true, locale: localeId })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Report Dialog */}
      {selectedReport && (
        <ReviewReportDialog
          report={selectedReport}
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </AdminLayout>
  );
}