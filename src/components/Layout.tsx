import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Bookmark, 
  GraduationCap, 
  MessageSquare,
  Bell,
  User,
  LogOut,
  Zap,
  BookOpenCheck,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { NotificationsMenu } from './NotificationsMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signIn, logout, isPremium, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Scholarships', icon: Search, path: '/scholarships' },
    { label: 'Recommendations', icon: Sparkles, path: '/recommendations' },
    { label: 'Calendar', icon: CalendarIcon, path: '/calendar' },
    { label: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
    { label: 'Test Prep', icon: BookOpenCheck, path: '/test-prep' },
    { label: 'Forum', icon: MessageSquare, path: '/forum' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', icon: ShieldCheck, path: '/admin' });
  }

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4 lg:gap-8">
          {user && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-500">
                  <Menu size={20} />
                </Button>
              } />
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-6 border-b border-slate-100 text-left">
                  <SheetTitle className="flex items-center gap-2 text-slate-800 font-bold text-xl">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <GraduationCap size={18} />
                    </div>
                    ScholarPath Indonesia
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        location.pathname === item.path 
                          ? 'text-slate-900 bg-slate-100' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-slate-900' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center gap-2 text-slate-800 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white italic">
               <GraduationCap size={18} className="not-italic" />
            </div>
            <span className="hidden sm:inline">ScholarPath Indonesia</span>
          </Link>
          
          {user && (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'text-slate-900 bg-slate-50' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'text-slate-900' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isPremium && user && (
            <Button asChild size="sm" className="hidden sm:flex bg-amber-400 text-amber-950 hover:bg-amber-500 border-none font-bold px-5 h-9 rounded-lg transition-transform hover:scale-105">
              <Link to="/premium">Upgrade</Link>
            </Button>
          )}
          
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationsMenu />
              
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <button className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer transition-transform hover:scale-105 outline-none">
                    <Avatar className="h-full w-full pointer-events-none">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                        {user.displayName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                } />
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-2 py-1.5 mb-1 bg-slate-50 rounded-md mx-1">
                    <p className="text-xs font-bold truncate text-slate-900">{profile?.displayName || user.displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">
                      {isPremium ? 'Premium Plan' : 'Free Plan'}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full">Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-100 px-6 h-9 rounded-lg text-xs font-bold">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 pt-16 flex flex-col w-full">
        <div className="w-full h-full">
          {children}
        </div>
      </main>

      <footer className="border-t bg-white py-12 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs italic">
               <GraduationCap size={14} className="not-italic" />
            </div>
            ScholarPath
          </div>
          <p className="text-xs text-slate-400 font-medium">© 2026 ScholarPath Indonesia. Built with AI Intelligence.</p>
          <div className="flex gap-6">
            <a href="#" className="font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
