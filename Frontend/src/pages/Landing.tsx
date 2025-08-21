import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Newspaper, 
  Zap, 
  Filter, 
  User, 
  Globe, 
  Share, 
  FileText, 
  Search, 
  BarChart3, 
  Clock,
  Users,
  Star,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle Get Started button click
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  // Add smooth scrolling function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Smart Summaries",
      description: "Get AI-powered summaries of articles to quickly understand key points without reading the full content."
    },
    {
      icon: Globe,
      title: "Complete Content Access",
      description: "Access full articles from original sources with direct links and complete context."
    },
    {
      icon: Search,
      title: "Advanced Source Tracking",
      description: "Track and verify news sources with detailed attribution and credibility information."
    },
    {
      icon: Users,
      title: "People of Interest",
      description: "Follow key figures and personalities to get personalized news about people you care about."
    },
    {
      icon: Share,
      title: "Shareable URLs",
      description: "Share any article or news collection with a unique URL that preserves your view and filters."
    },
    {
      icon: BarChart3,
      title: "10+ News Sources",
      description: "Aggregate news from over 10 trusted sources including major publications and specialized outlets."
    },
    {
      icon: Filter,
      title: "Multiple Sorting Methods",
      description: "Sort by date, relevance, popularity, source credibility, or reading time to find what matters most."
    },
    {
      icon: Clock,
      title: "Thousands of Articles",
      description: "Access thousands of news articles updated in real-time from global sources."
    }
  ];

  const stats = [
    { number: "10+", label: "News Sources" },
    { number: "1000+", label: "Daily Articles" },
    { number: "24/7", label: "Real-time Updates" },
    { number: "5+", label: "Categories" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section id="hero" className="py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Newspaper className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              ArcNews
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Your intelligent news companion. Stay informed with AI-powered summaries, 
            real-time updates, and personalized content from trusted sources worldwide.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="flex items-center gap-2 text-lg px-8 py-6"
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="text-lg px-8 py-6"
            >
              Try Dashboard
            </Button>
          </div>

          {/* Quick navigation */}
          <div className="flex justify-center gap-4 text-sm">
            <Button 
              variant="link" 
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-primary"
            >
              Features
            </Button>
            <Button 
              variant="link" 
              onClick={() => scrollToSection('benefits')}
              className="text-muted-foreground hover:text-primary"
            >
              Benefits
            </Button>
            <Button 
              variant="link" 
              onClick={() => scrollToSection('contact')}
              className="text-muted-foreground hover:text-primary"
            >
              Contact
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for a comprehensive news reading experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-border/50">
                <CardHeader className="pb-3">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Benefits */}
        <section id="benefits" className="py-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold mb-4">Why Choose ArcNews?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of informed readers who trust ArcNews for their daily news consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Intelligent Curation</h4>
                      <p className="text-sm text-muted-foreground">AI-powered content curation ensures you see the most relevant and important news</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Time-Saving Summaries</h4>
                      <p className="text-sm text-muted-foreground">Quick summaries help you stay informed without spending hours reading</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Verified Sources</h4>
                      <p className="text-sm text-muted-foreground">Only trusted and credible news sources for accurate information</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Personalized Experience</h4>
                      <p className="text-sm text-muted-foreground">Customize your feed based on interests and reading preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Cross-Device Sync</h4>
                      <p className="text-sm text-muted-foreground">Access your personalized news feed from any device, anywhere</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Social Sharing</h4>
                      <p className="text-sm text-muted-foreground">Share interesting articles and insights with your network easily</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <Card className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl font-bold mb-4">Ready to Transform Your News Experience?</CardTitle>
              <CardDescription className="text-lg">
                Join our community of informed readers and never miss important news again
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="flex-1 sm:flex-none text-lg px-8 py-6"
              >
                {user ? 'Go to Dashboard' : 'Start Reading Today'}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="flex-1 sm:flex-none text-lg px-8 py-6"
              >
                Explore Dashboard
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer id="contact" className="py-12 border-t border-border/50">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">ArcNews</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your intelligent news companion for staying informed in today's fast-paced world.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/dashboard')}>Dashboard</Button></div>
                <div><Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/auth')}>Sign Up</Button></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/about')}>About Us</Button></div>
                <div><Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/contact')}>Contact</Button></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/privacy')}>Privacy Policy</Button></div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-border/50">
            <p className="text-muted-foreground">&copy; 2025 ArcNews. Stay informed, stay ahead.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;