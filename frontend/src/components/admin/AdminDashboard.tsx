import { useState } from 'react';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth-context';

interface DashboardStat {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

const DASHBOARD_STATS: DashboardStat[] = [
  {
    title: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Active Scholarships',
    value: '156',
    change: '+8 new',
    trend: 'up',
    icon: Award,
    color: 'text-green-600',
  },
  {
    title: 'Pending Reports',
    value: '12',
    change: '-3 today',
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-yellow-600',
  },
  {
    title: 'Subscription Revenue',
    value: 'Rp 45.6M',
    change: '+18.2%',
    trend: 'up',
    icon: CreditCard,
    color: 'text-[#567c8d]',
  },
];

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  href: string;
  badge?: number;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Payment Verification',
    description: 'Review pending payment submissions',
    icon: CreditCard,
    href: '/admin/payment-verification-demo',
    badge: 12,
  },
  {
    title: 'User Reports',
    description: 'Moderate reported content',
    icon: AlertTriangle,
    href: '/forum/reports',
    badge: 8,
  },
  {
    title: 'Pending Posts',
    description: 'Review posts awaiting approval',
    icon: FileText,
    href: '/forum/pending',
    badge: 5,
  },
  {
    title: 'Subscription Monitor',
    description: 'View subscription analytics',
    icon: Activity,
    href: '/subscription-snapshot-demo',
  },
];

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2f4156]">
          Welcome back, {user?.name || 'Admin'}
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with ScholarPath today
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DASHBOARD_STATS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="rounded-2xl border border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-[#2f4156] mb-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        className={`h-4 w-4 ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500">this month</span>
                    </div>
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
          {QUICK_ACTIONS.map((action, index) => {
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
            <div className="space-y-4">
              <ActivityItem
                icon={Users}
                title="New user registration"
                description="Siti Nurhaliza joined as Free User"
                time="5 minutes ago"
              />
              <ActivityItem
                icon={CreditCard}
                title="Payment submitted"
                description="Budi Santoso submitted payment proof (Rp 49,000)"
                time="12 minutes ago"
              />
              <ActivityItem
                icon={MessageSquare}
                title="New forum post"
                description="Ahmad Fauzi created a post about LPDP scholarship"
                time="1 hour ago"
              />
              <ActivityItem
                icon={AlertTriangle}
                title="Content reported"
                description="User reported a post for spam"
                time="2 hours ago"
              />
            </div>
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
