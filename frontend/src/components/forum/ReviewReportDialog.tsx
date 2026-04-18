import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';
import { Check, X, Trash2, AlertTriangle } from 'lucide-react';
import type { Report } from '../../lib/forum-context';

interface ReviewReportDialogProps {
  report: Report;
  open: boolean;
  onClose: () => void;
}

const ACTIONS = [
  { value: 'remove-content', label: 'Hapus Konten', icon: Trash2, variant: 'destructive' as const },
  { value: 'warn-user', label: 'Beri Peringatan ke User', icon: AlertTriangle, variant: 'default' as const },
  { value: 'dismiss', label: 'Tolak Laporan (Tidak Ada Pelanggaran)', icon: X, variant: 'outline' as const },
];

export function ReviewReportDialog({ report, open, onClose }: ReviewReportDialogProps) {
  const { user } = useAuth();
  const { reviewReport, deletePost } = useForum();
  const [selectedAction, setSelectedAction] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarnAction = selectedAction === 'warn-user';
  const isRemoveAction = selectedAction === 'remove-content';
  const noteLabel = isWarnAction ? 'Pesan Peringatan ke User *' : 'Catatan Tindakan *';
  const notePlaceholder = isWarnAction
    ? 'Tulis pesan peringatan yang akan dilihat oleh user...'
    : 'Jelaskan alasan tindakan yang diambil...';
  const submitLabel = isWarnAction ? 'Kirim Peringatan' : 'Konfirmasi Tindakan';

  const handleSubmit = async () => {
    if (!selectedAction) {
      toast.error('Silakan pilih tindakan');
      return;
    }

    if (!actionNote.trim()) {
      toast.error('Silakan berikan catatan tindakan');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      if (isRemoveAction && report.targetType === 'post') {
        await deletePost(report.targetId);
      }

      await reviewReport(report.id, `${selectedAction}: ${actionNote}`, user.name);

      toast.success('Laporan berhasil ditinjau');
      onClose();
    } catch {
      toast.error('Gagal meninjau laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tinjau Laporan</DialogTitle>
          <DialogDescription>
            Pilih tindakan yang sesuai berdasarkan laporan ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">
                    {report.reason.replace('-', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {report.targetType === 'post' ? 'Post' : 'Komentar'}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">Pelapor: {report.reporterName}</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-1">Konten yang dilaporkan:</p>
              <p className="text-sm text-muted-foreground mb-2">{report.targetContent}</p>
              <p className="text-xs text-muted-foreground">Oleh: {report.targetAuthor}</p>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-1">Deskripsi Laporan:</p>
              <p className="text-sm">{report.description}</p>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-3">
            <Label>Tindakan *</Label>
            <RadioGroup value={selectedAction} onValueChange={setSelectedAction}>
              <div className="space-y-2">
                {ACTIONS.map(action => (
                  <div
                    key={action.value}
                    className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedAction === action.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value={action.value} id={action.value} />
                    <Label htmlFor={action.value} className="flex items-center gap-2 cursor-pointer flex-1">
                      <action.icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Action Note */}
          <div className="space-y-2">
            <Label htmlFor="actionNote">{noteLabel}</Label>
            <Textarea
              id="actionNote"
              placeholder={notePlaceholder}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Catatan ini akan disimpan dalam riwayat tindakan untuk audit.
            </p>
          </div>

          {/* Warning */}
          {isRemoveAction && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Peringatan</p>
                <p className="text-muted-foreground">
                  Konten akan dihapus secara permanen dan tidak dapat dikembalikan.
                </p>
              </div>
            </div>
          )}

          {isWarnAction && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-700 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Peringatan ke User</p>
                <p className="text-yellow-700">
                  Konten tetap tampil, tetapi user akan menerima peringatan resmi dari admin.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedAction || !actionNote.trim()}
            variant={isRemoveAction ? 'destructive' : 'default'}
          >
            {isSubmitting ? 'Memproses...' : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
