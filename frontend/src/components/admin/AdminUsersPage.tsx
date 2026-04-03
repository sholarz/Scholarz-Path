import { AdminLayout } from './AdminLayout';
import { useEffect, useMemo, useState } from 'react';
import { Search, MoreVertical, Crown, Shield } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUser,
} from '../../lib/admin-api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'premium' | 'free' | 'guest';
  joinedAt: string;
  status: 'active' | 'inactive' | 'banned';
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'premium' | 'free' | 'guest'>('all');

  const toDisplayUser = (user: AdminUser): User => {
    const firstName = user.profile?.first_name?.trim() || '';
    const lastName = user.profile?.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: user.id,
      name: fullName || user.email,
      email: user.email,
      role: user.role,
      joinedAt: user.created_at,
      status: user.status,
    };
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload = await getAdminUsers();
      setUsers(payload.data.map(toDisplayUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }), [users, searchQuery, roleFilter]);

  const updateRole = async (userId: string, role: User['role']) => {
    try {
      setIsUpdating(userId);
      await updateAdminUserRole(userId, role);
      await loadUsers();
      toast.success('User role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsUpdating(null);
    }
  };

  const updateStatus = async (userId: string, status: User['status']) => {
    try {
      setIsUpdating(userId);
      await updateAdminUserStatus(userId, status);
      await loadUsers();
      toast.success('User status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      premium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      free: 'bg-gray-100 text-gray-800 border-gray-200',
      guest: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    
    const icons = {
      admin: <Shield className="h-3 w-3 mr-1" />,
      premium: <Crown className="h-3 w-3 mr-1" />,
      free: null,
      guest: null,
    };

    return (
      <Badge variant="outline" className={`${styles[role]} flex items-center`}>
        {icons[role]}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.role === 'premium').length,
    free: users.filter(u => u.role === 'free').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#2f4156] mb-2">Users Management</h1>
          <p className="text-gray-600">Manage and monitor all platform users</p>
        </div>

        {error && (
          <Card className="rounded-2xl border border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-[#2f4156]">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Admins</div>
              <div className="text-3xl font-bold text-purple-600">{stats.admin}</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Premium</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.premium}</div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Free</div>
              <div className="text-3xl font-bold text-gray-600">{stats.free}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === 'admin' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('admin')}
                  size="sm"
                >
                  Admin
                </Button>
                <Button
                  variant={roleFilter === 'premium' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('premium')}
                  size="sm"
                >
                  Premium
                </Button>
                <Button
                  variant={roleFilter === 'free' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('free')}
                  size="sm"
                >
                  Free
                </Button>
                <Button
                  variant={roleFilter === 'guest' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('guest')}
                  size="sm"
                >
                  Guest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-2xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5efeb] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2f4156] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                )}
                {!isLoading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f5efeb]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#567c8d] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-[#2f4156]">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : user.status === 'inactive'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={isUpdating === user.id}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateRole(user.id, 'free')}>Set role: Free</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRole(user.id, 'premium')}>Set role: Premium</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRole(user.id, 'admin')}>Set role: Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(user.id, 'active')}>Set status: Active</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(user.id, 'inactive')}>Set status: Inactive</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => updateStatus(user.id, 'banned')}>
                            Set status: Banned
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
