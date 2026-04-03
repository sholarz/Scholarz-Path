import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { scholarships, Scholarship } from '../../lib/scholarship-data';
import { useAuth } from '../../lib/auth-context';

export function AdminScholarshipsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (user?.role !== 'admin') {
    return null;
  }

  // Filter scholarships
  const filteredScholarships = scholarships.filter(scholarship => 
    scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format deadline
  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle edit (opens details dialog)
  const handleEdit = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setIsDetailsOpen(true);
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Scholarship
          </Button>
        </div>

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
                  {scholarships.filter(s => s.verified).length}
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
                  {scholarships.filter(s => !s.verified).length}
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
                {scholarships.filter(s => s.deadline > new Date()).length}
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
              <Button variant="outline">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScholarships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                          {scholarship.verified ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(scholarship)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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

        {/* Scholarship Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedScholarship?.title}</DialogTitle>
              <DialogDescription>
                View and edit detailed information about this scholarship
              </DialogDescription>
            </DialogHeader>

            {selectedScholarship && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                    <p className="mt-1">{selectedScholarship.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Country</p>
                    <p className="mt-1">{selectedScholarship.country}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="mt-1">{selectedScholarship.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="mt-1">{selectedScholarship.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                    <p className="mt-1">{formatDeadline(selectedScholarship.deadline)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Education Level</p>
                    <p className="mt-1">{selectedScholarship.educationLevel}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm leading-relaxed">{selectedScholarship.description}</p>
                </div>

                {/* Field of Study */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Field of Study</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScholarship.fieldOfStudy.map((field, index) => (
                      <Badge key={index} variant="secondary">{field}</Badge>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Requirements</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedScholarship.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Benefits</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedScholarship.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Application URL */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Application URL</p>
                  <a 
                    href={selectedScholarship.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {selectedScholarship.applicationUrl}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {!selectedScholarship.verified && (
                    <Button>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
