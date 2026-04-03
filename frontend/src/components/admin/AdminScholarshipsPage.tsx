import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
import { Search, Trash2, CheckCircle, XCircle, GraduationCap, Star } from 'lucide-react';
import {
  deleteAdminScholarship,
  featureAdminScholarship,
  getAdminScholarships,
  verifyAdminScholarship,
  type AdminScholarship,
} from '../../lib/admin-api';
import { toast } from 'sonner';

type ScholarshipRow = {
  id: string;
  title: string;
  provider: string;
  country: string;
  deadline: string;
  educationLevel: string;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  featured: boolean;
};

export function AdminScholarshipsPage() {
  const [scholarships, setScholarships] = useState<ScholarshipRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toRow = (item: AdminScholarship): ScholarshipRow => {
    return {
      id: item.id,
      title: item.title,
      provider: item.provider?.name || 'Unknown Provider',
      country: item.provider?.country || '-',
      deadline: item.application_deadline,
      educationLevel: item.level,
      status: item.status,
      featured: item.is_featured,
    };
  };

  const loadScholarships = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = await getAdminScholarships();
      setScholarships(payload.data.map(toRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scholarships');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScholarships();
  }, []);

  const filteredScholarships = useMemo(() => scholarships.filter((scholarship) => 
    scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.country.toLowerCase().includes(searchQuery.toLowerCase())
  ), [scholarships, searchQuery]);

  const formatDeadline = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleVerify = async (scholarshipId: string) => {
    try {
      setIsUpdating(scholarshipId);
      await verifyAdminScholarship(scholarshipId);
      toast.success('Scholarship verified');
      await loadScholarships();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify scholarship');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleFeatureToggle = async (scholarshipId: string, featured: boolean) => {
    try {
      setIsUpdating(scholarshipId);
      await featureAdminScholarship(scholarshipId, !featured);
      toast.success(!featured ? 'Scholarship featured' : 'Scholarship unfeatured');
      await loadScholarships();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update featured status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (scholarshipId: string) => {
    if (!confirm('Delete this scholarship? This action cannot be undone.')) {
      return;
    }

    try {
      setIsUpdating(scholarshipId);
      await deleteAdminScholarship(scholarshipId);
      toast.success('Scholarship deleted');
      await loadScholarships();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete scholarship');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scholarship Data Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor all scholarship data in the system
            </p>
          </div>
        </div>

        {error && (
          <Card className="rounded-2xl border border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Scholarships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scholarships.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">
                  {scholarships.filter(s => s.status === 'active').length}
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unverified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-yellow-600">
                  {scholarships.filter(s => s.status === 'draft').length}
                </div>
                <XCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {scholarships.filter(s => new Date(s.deadline) > new Date()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, provider, or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" disabled>
                <GraduationCap className="h-4 w-4 mr-2" />
                Filter by Level
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scholarships Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Scholarships ({filteredScholarships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px]">Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Education Level</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        Loading scholarships...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && filteredScholarships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No scholarships found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredScholarships.map((scholarship) => (
                      <TableRow key={scholarship.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="max-w-[230px]">
                            <p className="truncate">{scholarship.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[180px]">
                            <p className="truncate text-sm">{scholarship.provider}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {scholarship.country}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDeadline(scholarship.deadline)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {scholarship.educationLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {scholarship.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              {scholarship.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={scholarship.featured ? 'default' : 'outline'}>
                            {scholarship.featured ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating === scholarship.id}
                              onClick={() => handleFeatureToggle(scholarship.id, scholarship.featured)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating === scholarship.id}
                              onClick={() => handleVerify(scholarship.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isUpdating === scholarship.id}
                              onClick={() => handleDelete(scholarship.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
