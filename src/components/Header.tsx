import { Link } from 'react-router';
import { GraduationCap, Search, Calendar, Bookmark, LayoutDashboard, Menu, LogOut, User, Crown, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import { usePayment } from '../lib/payment-context';
import { PremiumBadge, AdminBadge } from './PremiumFeatureLock';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = isAuthenticated
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Scholarships', href: '/scholarships', icon: Search },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
        { name: 'Test Prep', href: '/tests', icon: BookOpen },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">ScholarPath</span>
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
                        {user?.role === 'premium' && <PremiumBadge />}
                        {user?.role === 'admin' && <AdminBadge />}
                      </div>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
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