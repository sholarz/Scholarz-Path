import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

interface PaymentApprovalDialogProps {
  payment: {
    id: string;
    userName: string;
    email: string;
    amount: number;
    method: string;
    proofUrl: string;
    createdAt: Date;
  };
  open: boolean;
  onClose: () => void;
  onApprove: (validUntil: string) => void;
  onReject: (reason: string) => void;
}

export function PaymentApprovalDialog({
  payment,
  open,
  onClose,
  onApprove,
  onReject,
}: PaymentApprovalDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validUntil, setValidUntil] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionDurations = [
    { value: '1-month', label: '1 Bulan', months: 1 },
    { value: '3-months', label: '3 Bulan', months: 3 },
    { value: '6-months', label: '6 Bulan', months: 6 },
    { value: '12-months', label: '12 Bulan (1 Tahun)', months: 12 },
  ];

  const handleActionClick = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (action === 'approve') {
      if (!validUntil) {
        toast.error('Silakan pilih durasi langganan');
        return;
      }
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      onApprove(validUntil);
      toast.success('Pembayaran berhasil disetujui');
    } else if (action === 'reject') {
      if (!rejectionReason.trim()) {
        toast.error('Silakan berikan alasan penolakan');
        return;
      }
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      onReject(rejectionReason);
      toast.success('Pembayaran ditolak');
    }
    setIsSubmitting(false);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setAction(null);
    setValidUntil('');
    setRejectionReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          <DialogDescription>
            Tinjau detail pembayaran dan ambil tindakan
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          <>
            {/* Payment Details */}
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nama Pengguna</p>
                    <p className="font-medium">{payment.userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{payment.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jumlah</p>
                    <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Metode</p>
                    <Badge variant="secondary">{payment.method}</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran:</p>
                  <div className="border rounded-lg p-2 bg-background">
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Lihat Bukti Pembayaran →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleActionClick('reject')}
              >
                <X className="h-4 w-4" />
                Tolak
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => handleActionClick('approve')}
              >
                <Check className="h-4 w-4" />
                Setujui
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <div className="space-y-4 py-4">
              {/* Confirmation Message */}
              <div className={`border rounded-lg p-4 ${
                action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {action === 'approve' ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold mb-1">
                      {action === 'approve'
                        ? 'Apakah Anda yakin ingin menyetujui transaksi ini?'
                        : 'Apakah Anda yakin ingin menolak transaksi ini?'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {action === 'approve'
                        ? 'User akan segera diupgrade ke Premium setelah Anda mengkonfirmasi.'
                        : 'User akan menerima notifikasi penolakan dengan alasan yang Anda berikan.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approve: Valid Until */}
              {action === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="validUntil">
                    Durasi Langganan (valid_until)
                  </Label>
                  <Select value={validUntil} onValueChange={setValidUntil}>
                    <SelectTrigger id="validUntil">
                      <SelectValue placeholder="Pilih durasi langganan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionDurations.map(duration => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Langganan akan dimulai dari hari ini
                  </p>
                </div>
              )}

              {/* Reject: Reason */}
              {action === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    Alasan Penolakan *
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Jelaskan alasan penolakan pembayaran..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alasan ini akan dikirim ke user melalui notifikasi
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant={action === 'approve' ? 'default' : 'destructive'}
                className="flex-1"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : `Konfirmasi ${action === 'approve' ? 'Persetujuan' : 'Penolakan'}`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
