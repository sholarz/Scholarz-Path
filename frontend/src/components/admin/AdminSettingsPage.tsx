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
    platformDescription: 'Scholarship platform focused on Java, Indonesia',
    
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
    toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    toast.info('Settings reset to default');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2f4156] mb-2">Settings</h1>
          <p className="text-gray-600">Manage platform configuration and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Settings */}
          <Card className="rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Basic platform information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformEmail">Support Email</Label>
                <Input
                  id="platformEmail"
                  type="email"
                  value={settings.platformEmail}
                  onChange={(e) => setSettings({ ...settings, platformEmail: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
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
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure subscription pricing and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice">Monthly Price (IDR)</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={settings.monthlyPrice}
                  onChange={(e) => setSettings({ ...settings, monthlyPrice: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearlyPrice">Yearly Price (IDR)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={settings.yearlyPrice}
                  onChange={(e) => setSettings({ ...settings, yearlyPrice: e.target.value })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve Payments</Label>
                  <p className="text-sm text-gray-500">
                    Automatically approve successful payments
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
              <CardTitle>Forum Settings</CardTitle>
              <CardDescription>Configure community forum behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Post Approval</Label>
                  <p className="text-sm text-gray-500">
                    Posts must be approved before publishing
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
                  <Label>Allow Anonymous Posts</Label>
                  <p className="text-sm text-gray-500">
                    Users can post without showing their name
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
                <Label htmlFor="maxPostLength">Max Post Length (characters)</Label>
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
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Send email notifications to users
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
                  <Label>Payment Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Notify users about payment status
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
                  <Label>Forum Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Notify users about forum activity
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
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-gray-500">
                      Users must verify email to register
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
                    <Label>Enable Two-Factor Auth</Label>
                    <p className="text-sm text-gray-500">
                      Require 2FA for sensitive actions
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
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
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
            Reset to Default
          </Button>
          <Button onClick={handleSave} className="bg-[#2f4156] hover:bg-[#567c8d]">
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
