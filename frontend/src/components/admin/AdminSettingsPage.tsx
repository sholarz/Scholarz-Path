import { AdminLayout } from './AdminLayout';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'ScholarPath',
    platformEmail: 'support@scholarpath.com',
    platformDescription: 'Platform beasiswa berfokus pada peluang studi di Indonesia',
    
    // Payment Settings
    monthlyPrice: '49000',
    yearlyPrice: '490000',
    autoApprovePayments: true,
    
    // Forum Settings
    requirePostApproval: false,
    allowAnonymousPosts: false,
    maxPostLength: '5000',
    
    // Notification Settings
    emailNotifications: true,
    paymentNotifications: true,
    forumNotifications: true,
    
    // Security Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: '30',
  });

  const handleSave = () => {
    // In production, save to backend/database
    toast.success('Pengaturan berhasil disimpan!');
  };

  const handleReset = () => {
    toast.info('Pengaturan dikembalikan ke default');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2f4156] mb-2">Pengaturan</h1>
          <p className="text-gray-600">Kelola konfigurasi dan preferensi platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Settings */}
          <Card className="rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Platform</CardTitle>
              <CardDescription>Informasi dasar platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Nama Platform</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformEmail">Email Dukungan</Label>
                <Input
                  id="platformEmail"
                  type="email"
                  value={settings.platformEmail}
                  onChange={(e) => setSettings({ ...settings, platformEmail: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformDescription">Deskripsi Platform</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.platformDescription}
                  onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Pembayaran</CardTitle>
              <CardDescription>Atur harga dan perilaku langganan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice">Harga Bulanan (IDR)</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={settings.monthlyPrice}
                  onChange={(e) => setSettings({ ...settings, monthlyPrice: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearlyPrice">Harga Tahunan (IDR)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={settings.yearlyPrice}
                  onChange={(e) => setSettings({ ...settings, yearlyPrice: e.target.value })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Setujui Pembayaran Otomatis</Label>
                  <p className="text-sm text-gray-500">
                    Otomatis menyetujui pembayaran yang berhasil
                  </p>
                </div>
                <Switch
                  checked={settings.autoApprovePayments}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoApprovePayments: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Forum Settings */}
          <Card className="rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Forum</CardTitle>
              <CardDescription>Atur perilaku forum komunitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wajib Persetujuan Postingan</Label>
                  <p className="text-sm text-gray-500">
                    Postingan harus disetujui sebelum dipublikasikan
                  </p>
                </div>
                <Switch
                  checked={settings.requirePostApproval}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requirePostApproval: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Izinkan Postingan Anonim</Label>
                  <p className="text-sm text-gray-500">
                    Pengguna bisa memposting tanpa menampilkan nama
                  </p>
                </div>
                <Switch
                  checked={settings.allowAnonymousPosts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowAnonymousPosts: checked })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPostLength">Panjang Maksimal Postingan (karakter)</Label>
                <Input
                  id="maxPostLength"
                  type="number"
                  value={settings.maxPostLength}
                  onChange={(e) => setSettings({ ...settings, maxPostLength: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Atur preferensi notifikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Email</Label>
                  <p className="text-sm text-gray-500">
                    Kirim notifikasi email ke pengguna
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Pembayaran</Label>
                  <p className="text-sm text-gray-500">
                    Beri tahu pengguna tentang status pembayaran
                  </p>
                </div>
                <Switch
                  checked={settings.paymentNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, paymentNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Forum</Label>
                  <p className="text-sm text-gray-500">
                    Beri tahu pengguna tentang aktivitas forum
                  </p>
                </div>
                <Switch
                  checked={settings.forumNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, forumNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="rounded-2xl border border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
              <CardDescription>Atur keamanan dan autentikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Wajib Verifikasi Email</Label>
                    <p className="text-sm text-gray-500">
                      Pengguna wajib verifikasi email saat mendaftar
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, requireEmailVerification: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktifkan Autentikasi Dua Faktor</Label>
                    <p className="text-sm text-gray-500">
                      Wajibkan 2FA untuk aksi sensitif
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableTwoFactor: checked })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Batas Waktu Sesi (menit)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset ke Default
          </Button>
          <Button onClick={handleSave} className="bg-[#2f4156] hover:bg-[#567c8d]">
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
