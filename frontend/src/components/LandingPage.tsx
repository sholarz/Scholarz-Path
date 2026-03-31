import { Link } from 'react-router';
import { Header } from './Header';
import { Button } from './ui/button';
import { GraduationCap, Search, Calendar, Bookmark, CheckCircle, Clock, Globe } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function LandingPage() {
  const features = [
    {
      icon: Search,
      title: 'Curated Scholarships',
      description: 'Access scholarships to top universities in Indonesia, especially Java region',
    },
    {
      icon: Calendar,
      title: 'Scholarship Calendar',
      description: 'Never miss a deadline with our comprehensive calendar view',
    },
    {
      icon: Clock,
      title: 'Preparation Timeline',
      description: 'Automated timeline breaks down all tasks needed before deadlines',
    },
    {
      icon: Bookmark,
      title: 'Bookmark & Track',
      description: 'Save and organize scholarships you want to apply for',
    },
    {
      icon: CheckCircle,
      title: 'Verified Information',
      description: 'All scholarships are verified and regularly updated',
    },
    {
      icon: Globe,
      title: 'International Focus',
      description: 'Specialized in opportunities for international students in Indonesia',
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Your Path to Education in Indonesia</span>
          </div>
          
          <h1 className="mb-6 max-w-4xl mx-auto">
            Find Your Perfect Scholarship to Study         </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover scholarships, track deadlines, and prepare your application with our automated timeline. 
            Everything you need to study at top universities in Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link to="/scholarships">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Scholarships
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ScholarPath provides all the tools you need to find, track, and apply for scholarships efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2">
                <CardContent className="pt-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students who are using ScholarPath to achieve their educational goals in Indonesia.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ScholarPath. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}