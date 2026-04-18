import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { ApiError } from '../../lib/api-client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
  targetContent: string;
  targetAuthor: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam atau Iklan' },
  { value: 'harassment', label: 'Pelecehan atau Bullying' },
  { value: 'hate-speech', label: 'Ujaran Kebencian' },
  { value: 'misinformation', label: 'Informasi Palsu' },
  { value: 'inappropriate', label: 'Konten Tidak Pantas' },
  { value: 'other', label: 'Lainnya' },
];

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetContent,
  targetAuthor,
}: ReportDialogProps) {
  const { user } = useAuth();
  const { reportPost, reportComment } = useForum();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Silakan pilih alasan laporan');
      return;
    }

    if (!description.trim()) {
      toast.error('Silakan berikan deskripsi laporan');
      return;
    }

    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    try {
      if (targetType === 'post') {
        const reason = `${selectedReason}: ${description.trim()}`.slice(0, 250);
        await reportPost(targetId, reason);
      } else {
        await reportComment(targetId, selectedReason.slice(0, 200), description.trim());
      }
      toast.success('Laporan berhasil dikirim. Tim kami akan meninjau laporan Anda.');
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422 && /already reported/i.test(error.message)) {
          toast.error('You have already reported this post');
        } else if (error.status === 404) {
          toast.error('Konten tidak ditemukan');
        } else if (error.status === 403) {
          toast.error('Anda tidak memiliki akses untuk melaporkan konten ini');
        } else {
          toast.error(error.message || 'Gagal mengirim laporan');
        }
      } else {
        toast.error('Gagal mengirim laporan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Laporkan {targetType === 'post' ? 'Post' : 'Komentar'}</DialogTitle>
          </div>
          <DialogDescription>
            Bantu kami menjaga komunitas tetap aman. Laporan Anda akan ditinjau oleh tim moderator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Konten yang dilaporkan:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{targetContent}</p>
            <p className="text-xs text-muted-foreground mt-1">Oleh: {targetAuthor}</p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Alasan Laporan *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_REASONS.map(reason => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Detail *</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan mengapa Anda melaporkan konten ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Berikan detail yang membantu tim moderator memahami masalahnya.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason || !description.trim()}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
