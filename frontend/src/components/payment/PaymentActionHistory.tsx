import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Check, X, User, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export interface PaymentAction {
  id: string;
  paymentId: string;
  action: 'approved' | 'rejected';
  adminName: string;
  adminId: string;
  timestamp: Date;
  reason?: string;
  validUntil?: string;
  notes?: string;
}

interface PaymentActionHistoryProps {
  actions: PaymentAction[];
}

export function PaymentActionHistory({ actions }: PaymentActionHistoryProps) {
  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Tindakan</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada riwayat tindakan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Riwayat Tindakan
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Log audit untuk traceability dan penyelesaian sengketa
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={action.id}>
                <div className="flex gap-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        action.action === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {action.action === 'approved' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </div>
                    {index < actions.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge
                          variant={action.action === 'approved' ? 'default' : 'destructive'}
                          className="mb-2"
                        >
                          {action.action === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{action.adminName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(action.timestamp, {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </div>
                    </div>

                    {/* Action Details */}
                    <div className="space-y-2 text-sm">
                      {action.action === 'approved' && action.validUntil && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-900">
                            <span className="font-medium">Durasi Langganan:</span>{' '}
                            {action.validUntil}
                          </p>
                        </div>
                      )}

                      {action.action === 'rejected' && action.reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="font-medium text-red-900 mb-1">
                            Alasan Penolakan:
                          </p>
                          <p className="text-red-800">{action.reason}</p>
                        </div>
                      )}

                      {action.notes && (
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-medium mb-1">Catatan:</p>
                          <p className="text-muted-foreground">{action.notes}</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground">
                        {action.timestamp.toLocaleString('id-ID', {
                          dateStyle: 'full',
                          timeStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                {index < actions.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
