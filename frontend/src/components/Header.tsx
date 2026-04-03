import { Link, useNavigate } from 'react-router';
import { GraduationCap, Search, Calendar, Bookmark, LayoutDashboard, Menu, LogOut, User, Crown, BookOpen, UserCircle, MessageCircle, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import { usePayment } from '../lib/payment-context';
import { RoleBadge, RoleIcon } from './RoleBadge';
import { NotificationCenter } from './notifications/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openPaymentFlow } = usePayment();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = isAuthenticated
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Scholarships', href: '/scholarships', icon: Search },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
        { name: 'Test Prep', href: '/tests', icon: BookOpen },
        { name: 'Forum', href: '/forum', icon: MessageCircle },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6 ml-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-primary rounded-lg p-1">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base">ScholarPath</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link key={item.name} to={item.href}>
                  <Button variant="ghost" className="gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {user?.role === 'free' && (
                <Button 
                  onClick={openPaymentFlow}
                  variant="outline"
                  className="hidden sm:flex gap-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade
                </Button>
              )}
              
              {/* Notification Center */}
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <User className="w-5 h-5" />
                    {user?.role === 'premium' && (
                      <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{user?.name}</p>
                        {user && <RoleBadge role={user.role} size="sm" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin/payment-verification')} className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Payment Verification
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col gap-2 mt-8">
                    {navigationItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </Button>
                      </Link>
                    ))}
                    
                    <div className="my-2 border-t" />
                    
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <UserCircle className="w-4 h-4" />
                        Profile
                      </Button>
                    </Link>
                    
                    {user?.role === 'free' && (
                      <>
                        <div className="my-2 border-t" />
                        <Button 
                          onClick={() => {
                            openPaymentFlow();
                            setMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full justify-start gap-2 border-yellow-400 text-yellow-600"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Premium
                        </Button>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}