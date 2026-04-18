import { useEffect, useState } from 'react';
import {
  Users, 
  MessageSquare, 
  CreditCard, 
  AlertTriangle,
  Award,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../lib/auth-context';
import { getAdminDashboardStats, type AdminDashboardStats } from '../../lib/admin-api';

interface DashboardStat {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dashboardStats = await getAdminDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const dashboardStats: DashboardStat[] = [
    {
      title: 'Total Users',
      value: stats?.users.total ?? '-',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Scholarships',
      value: stats?.scholarships.active ?? '-',
      icon: Award,
      color: 'text-green-600',
    },
    {
      title: 'Open Reports',
      value: stats?.reports.open ?? '-',
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
    {
      title: 'Featured Scholarships',
      value: stats?.scholarships.featured ?? '-',
      icon: CreditCard,
      color: 'text-[#567c8d]',
    },
  ];

  const quickActions = [
    {
      title: 'Payment Verification',
      description: 'Review pending payment submissions',
      icon: CreditCard,
      href: '/admin/payments',
      badge: stats?.reports.open ?? undefined,
    },
    {
      title: 'User Reports',
      description: 'Moderate reported content',
      icon: AlertTriangle,
      href: '/forum/reports',
      badge: stats?.reports.open ?? undefined,
    },
    {
      title: 'Subscription Monitor',
      description: 'View subscription analytics',
      icon: Activity,
      href: '/subscription-snapshot',
    },
  ];

  const recentActivity = stats?.recent_activity ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2f4156]">
            Welcome back, {user?.name || 'Admin'}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with ScholarPath today
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Ke Tampilan Biasa
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="rounded-2xl border border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="rounded-2xl border border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-[#2f4156] mb-2">
                      {isLoading ? '...' : stat.value}
                    </p>
                    <span className="text-sm text-gray-500">live backend data</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-[#2f4156] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.href}>
                <Card className="rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[#c8d9e6] flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-[#2f4156]" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{action.title}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </div>
                      {action.badge && (
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {action.badge}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-[#2f4156] mb-4">Recent Activity</h2>
        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading recent activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((entry, index) => {
                  const iconMap: Record<string, any> = {
                    user: Users,
                    payment: CreditCard,
                    forum: MessageSquare,
                    report: AlertTriangle,
                  };

                  const Icon = iconMap[entry.type] || Activity;
                  const time = entry.timestamp
                    ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })
                    : 'just now';

                  return (
                    <ActivityItem
                      key={`${entry.type}-${entry.timestamp}-${index}`}
                      icon={Icon}
                      title={entry.title}
                      description={entry.description}
                      time={time}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  icon: any;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon: Icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="w-10 h-10 rounded-lg bg-[#f5efeb] flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-[#567c8d]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#2f4156]">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
