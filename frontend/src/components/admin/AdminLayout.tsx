import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../lib/auth-context';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Scholarships', href: '/admin/scholarships', icon: GraduationCap },
  { label: 'Payment Verification', href: '/admin/payment-verification-demo', icon: CreditCard, badge: 12 },
  { label: 'User Reports', href: '/forum/reports', icon: FileText, badge: 8 },
  { label: 'Pending Posts', href: '/forum/pending', icon: FileText, badge: 5 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-[#f5efeb]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-4 ml-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5 text-[#2f4156]" />
              ) : (
                <Menu className="h-5 w-5 text-[#2f4156]" />
              )}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#2f4156] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SP</span>
              </div>
              <span className="font-bold text-base text-[#2f4156] hidden sm:block">
                ScholarPath Admin
              </span>
            </Link>
          </div>

          {/* Right: Search, Notifications, Profile */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64 h-9 bg-[#f5efeb] border-none"
              />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <Bell className="h-5 w-5 text-[#2f4156]" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#567c8d] rounded-full"></span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <Badge variant="secondary" className="ml-2">25</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[400px] overflow-y-auto">
                  <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-sm">New Payment Verification</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      12 new payments pending approval
                    </span>
                    <span className="text-xs text-muted-foreground pl-4">2 minutes ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-sm">User Reports</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      8 new user reports to review
                    </span>
                    <span className="text-xs text-muted-foreground pl-4">15 minutes ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-sm">Pending Posts</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      5 forum posts awaiting moderation
                    </span>
                    <span className="text-xs text-muted-foreground pl-4">1 hour ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="font-medium text-sm">System Update</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      New admin features available
                    </span>
                    <span className="text-xs text-muted-foreground pl-4">3 hours ago</span>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center justify-center text-sm text-primary font-medium cursor-pointer">
                  View All Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-[#2f4156]">{user?.name || 'Admin User'}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <div className="w-9 h-9 bg-[#567c8d] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-[#2f4156] text-white'
                    : 'text-gray-700 hover:bg-[#f5efeb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge 
                    className={`${
                      active 
                        ? 'bg-white text-[#2f4156]' 
                        : 'bg-[#567c8d] text-white'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}