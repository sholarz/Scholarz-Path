import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Search, Plus, Edit, Trash2, CheckCircle, Star, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createAdminScholarship,
  deleteAdminScholarship,
  featureAdminScholarship,
  getAdminScholarships,
  type AdminScholarship,
  type AdminScholarshipPayload,
  updateAdminScholarship,
  verifyAdminScholarship,
} from '../../lib/admin-api';
import { getScholarshipById } from '../../lib/scholarship-api';

type TargetLevel = 'sma' | 's1' | 's2' | 's3';
type DegreeLevel = 's1' | 's2' | 's3';

type ScholarshipFormState = {
  title: string;
  providerName: string;
  providerCountry: string;
  type: AdminScholarshipPayload['type'];
  targetLevel: TargetLevel;
  degreeLevel: DegreeLevel;
  amount: string;
  currency: string;
  minimumGpa: string;
  fieldsOfStudy: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  applicationUrl: string;
  applicationDeadline: string;
  status: AdminScholarshipPayload['status'];
};

const DEFAULT_FORM: ScholarshipFormState = {
  title: '',
  providerName: '',
  providerCountry: '',
  type: 'full',
  targetLevel: 'sma',
  degreeLevel: 's1',
  amount: '',
  currency: 'USD',
  minimumGpa: '',
  fieldsOfStudy: [],
  description: '',
  requirements: [],
  benefits: [],
  applicationUrl: '',
  applicationDeadline: '',
  status: 'draft',
};

const TYPE_OPTIONS: Array<{ value: AdminScholarshipPayload['type']; label: string }> = [
  { value: 'full', label: 'Penuh' },
  { value: 'partial', label: 'Parsial' },
  { value: 'merit', label: 'Prestasi' },
  { value: 'need_based', label: 'Berdasarkan Kebutuhan' },
  { value: 'sports', label: 'Olahraga' },
  { value: 'academic', label: 'Akademik' },
];

const TARGET_LEVEL_OPTIONS: Array<{ value: TargetLevel; label: string }> = [
  { value: 'sma', label: 'SMA' },
  { value: 's1', label: 'S1' },
  { value: 's2', label: 'S2' },
  { value: 's3', label: 'S3' },
];

const DEGREE_LEVEL_OPTIONS: Array<{ value: DegreeLevel; label: string }> = [
  { value: 's1', label: 'S1' },
  { value: 's2', label: 'S2' },
  { value: 's3', label: 'S3' },
];

const STATUS_OPTIONS: Array<{ value: NonNullable<AdminScholarshipPayload['status']>; label: string }> = [
  { value: 'draft', label: 'Draf' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'expired', label: 'Kedaluwarsa' },
];

const mapDegreeToLegacyLevel = (degreeLevel: DegreeLevel): AdminScholarshipPayload['level'] => {
  if (degreeLevel === 's1') return 'bachelor';
  if (degreeLevel === 's2') return 'master';
  return 'doctorate';
};

const mapLegacyLevelToDegree = (level?: string): DegreeLevel => {
  if (level === 'master') return 's2';
  if (level === 'doctorate' || level === 'postdoc') return 's3';
  return 's1';
};

const ensureArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
};

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function AdminScholarshipsPage() {
  const [items, setItems] = useState<AdminScholarship[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScholarshipFormState>(DEFAULT_FORM);
  const [fieldOfStudyInput, setFieldOfStudyInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminScholarships(200);
      setItems(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat beasiswa';
      setLoadError(message);
      setItems([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      (item.provider?.name ?? '').toLowerCase().includes(q) ||
      (item.provider?.country ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFieldOfStudyInput('');
    setRequirementInput('');
    setBenefitInput('');
    setIsDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      setActiveId(id);
      const { scholarship } = await getScholarshipById(id);
      setEditingId(id);
      setForm({
        title: scholarship.title,
        providerName: scholarship.provider?.name ?? '',
        providerCountry: scholarship.provider?.country ?? '',
        type: (scholarship.type as AdminScholarshipPayload['type']) ?? 'full',
        targetLevel: scholarship.targetLevel ?? 'sma',
        degreeLevel: scholarship.degreeLevel ?? mapLegacyLevelToDegree(scholarship.level),
        amount: scholarship.amount != null ? String(scholarship.amount) : '',
        currency: scholarship.currency ?? 'USD',
        minimumGpa: scholarship.minimumGpa != null ? String(scholarship.minimumGpa) : '',
        fieldsOfStudy: ensureArray(scholarship.fieldsOfStudy),
        description: scholarship.description ?? '',
        requirements: ensureArray(scholarship.requirements),
        benefits: ensureArray(scholarship.benefits),
        applicationUrl: scholarship.applicationUrl ?? '',
        applicationDeadline: scholarship.applicationDeadline?.slice(0, 10) ?? '',
        status: scholarship.status,
      });
      setFieldOfStudyInput('');
      setRequirementInput('');
      setBenefitInput('');
      setIsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat detail beasiswa');
    } finally {
      setActiveId(null);
    }
  };

  const buildPayload = (): AdminScholarshipPayload => {
    const normalizedUrl = normalizeUrl(form.applicationUrl);
    const payload: AdminScholarshipPayload = {
      provider_name: form.providerName.trim(),
      provider_country: form.providerCountry.trim() || undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      level: mapDegreeToLegacyLevel(form.degreeLevel),
      target_level: form.targetLevel,
      degree_level: form.degreeLevel,
      application_deadline: form.applicationDeadline,
      application_url: normalizedUrl,
      currency: form.currency.trim() || 'USD',
      fields_of_study: ensureArray(form.fieldsOfStudy),
      minimum_gpa: form.minimumGpa ? parseFloat(form.minimumGpa) : undefined,
      requirements: ensureArray(form.requirements),
      benefits: ensureArray(form.benefits),
      status: form.status,
    };

    if (form.amount) {
      payload.amount = parseFloat(form.amount);
    }

    return payload;
  };

  const addArrayItem = (key: 'fieldsOfStudy' | 'requirements' | 'benefits', value: string) => {
    const next = value.trim();
    if (!next) return;

    setForm((prev) => {
      const list = ensureArray(prev[key]);

      if (list.includes(next)) {
        return prev;
      }

      return {
        ...prev,
        [key]: [...list, next],
      };
    });
  };

  const removeArrayItem = (key: 'fieldsOfStudy' | 'requirements' | 'benefits', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: ensureArray(prev[key]).filter((item) => item !== value),
    }));
  };

  const save = async () => {
    const normalizedUrl = normalizeUrl(form.applicationUrl);

    if (!form.title.trim() || !form.providerName.trim() || !form.description.trim() || !form.applicationDeadline || !normalizedUrl) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (!isValidHttpUrl(normalizedUrl)) {
      toast.error('Application URL must be a valid http/https URL.');
      return;
    }

    if (form.amount && Number.isNaN(parseFloat(form.amount))) {
      toast.error('Amount must be a valid number.');
      return;
    }

    if (form.minimumGpa && Number.isNaN(parseFloat(form.minimumGpa))) {
      toast.error('Minimum GPA must be a valid number.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateAdminScholarship(editingId, payload);
        toast.success('Scholarship updated');
      } else {
        await createAdminScholarship(payload);
        toast.success('Scholarship created');
      }
      setIsDialogOpen(false);
      setForm(DEFAULT_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save scholarship');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = async (id: string, isFeatured: boolean) => {
    try {
      setActiveId(id);
      await featureAdminScholarship(id, !isFeatured);
      toast.success(!isFeatured ? 'Scholarship featured' : 'Scholarship unfeatured');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update featured status');
    } finally {
      setActiveId(null);
    }
  };

  const verify = async (id: string) => {
    try {
      setActiveId(id);
      await verifyAdminScholarship(id);
      toast.success('Scholarship verified');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify scholarship');
    } finally {
      setActiveId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus beasiswa ini?')) return;

    try {
      setActiveId(id);
      await deleteAdminScholarship(id);
      toast.success('Beasiswa berhasil dihapus');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus beasiswa');
    } finally {
      setActiveId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Beasiswa</h1>
            <p className="text-sm text-muted-foreground mt-1">CRUD admin terhubung ke API backend</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Beasiswa
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Cari berdasarkan judul/penyedia/negara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beasiswa ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Gagal memuat data: {loadError}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Penyedia</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Tenggat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unggulan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Memuat data beasiswa...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Tidak ada beasiswa ditemukan.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.provider?.name ?? '-'}</TableCell>
                    <TableCell>{item.level}</TableCell>
                    <TableCell>{new Date(item.application_deadline).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'outline'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_featured ? 'default' : 'outline'}>
                        {item.is_featured ? 'Ya' : 'Tidak'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" disabled={activeId === item.id} onClick={() => openEdit(item.id)}>
                        {activeId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" disabled={activeId === item.id} onClick={() => toggleFeature(item.id, item.is_featured)}>
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={activeId === item.id} onClick={() => verify(item.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={activeId === item.id} onClick={() => remove(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Beasiswa' : 'Buat Beasiswa'}</DialogTitle>
              <DialogDescription>Kelola data beasiswa yang digunakan pada daftar dan mesin pencocokan pengguna.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Judul *</Label>
                <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>Nama Penyedia *</Label>
                <Input value={form.providerName} onChange={(e) => setForm((prev) => ({ ...prev, providerName: e.target.value }))} />
              </div>
              <div>
                <Label>Negara Penyedia</Label>
                <Input value={form.providerCountry} onChange={(e) => setForm((prev) => ({ ...prev, providerCountry: e.target.value }))} />
              </div>
              <div>
                <Label>Tipe *</Label>
                <Select value={form.type} onValueChange={(value: AdminScholarshipPayload['type']) => setForm((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jenjang Target *</Label>
                <Select value={form.targetLevel} onValueChange={(value: TargetLevel) => setForm((prev) => ({ ...prev, targetLevel: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TARGET_LEVEL_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jenjang Gelar *</Label>
                <Select value={form.degreeLevel} onValueChange={(value: DegreeLevel) => setForm((prev) => ({ ...prev, degreeLevel: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEGREE_LEVEL_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nominal</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} />
              </div>
              <div>
                <Label>IPK Minimum</Label>
                <Input type="number" step="0.01" min="0" max="4" value={form.minimumGpa} onChange={(e) => setForm((prev) => ({ ...prev, minimumGpa: e.target.value }))} />
              </div>
              <div>
                <Label>Tenggat Pendaftaran *</Label>
                <Input type="date" value={form.applicationDeadline} onChange={(e) => setForm((prev) => ({ ...prev, applicationDeadline: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>URL Pendaftaran *</Label>
                <Input value={form.applicationUrl} onChange={(e) => setForm((prev) => ({ ...prev, applicationUrl: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Fields of Study</Label>
                <div className="flex gap-2">
                  <Input value={fieldOfStudyInput} onChange={(e) => setFieldOfStudyInput(e.target.value)} placeholder="Tambah bidang studi" />
                  <Button type="button" variant="outline" onClick={() => {
                    addArrayItem('fieldsOfStudy', fieldOfStudyInput);
                    setFieldOfStudyInput('');
                  }}>
                    Tambah
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ensureArray(form.fieldsOfStudy).map((item) => (
                    <Badge key={item} variant="outline" className="gap-1">
                      {item}
                      <button type="button" onClick={() => removeArrayItem('fieldsOfStudy', item)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Deskripsi *</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Requirements</Label>
                <div className="flex gap-2">
                  <Input value={requirementInput} onChange={(e) => setRequirementInput(e.target.value)} placeholder="Tambah persyaratan" />
                  <Button type="button" variant="outline" onClick={() => {
                    addArrayItem('requirements', requirementInput);
                    setRequirementInput('');
                  }}>
                    Tambah
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ensureArray(form.requirements).map((item) => (
                    <Badge key={item} variant="outline" className="gap-1">
                      {item}
                      <button type="button" onClick={() => removeArrayItem('requirements', item)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Manfaat</Label>
                <div className="flex gap-2">
                  <Input value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} placeholder="Tambah manfaat" />
                  <Button type="button" variant="outline" onClick={() => {
                    addArrayItem('benefits', benefitInput);
                    setBenefitInput('');
                  }}>
                    Tambah
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ensureArray(form.benefits).map((item) => (
                    <Badge key={item} variant="outline" className="gap-1">
                      {item}
                      <button type="button" onClick={() => removeArrayItem('benefits', item)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value: ScholarshipFormState['status']) => setForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Batal</Button>
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingId ? 'Perbarui Beasiswa' : 'Buat Beasiswa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
