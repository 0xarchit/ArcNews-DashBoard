import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Newspaper, ArrowLeft, Target, Users, Zap, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const About = () => {
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Target,
      title: "Accuracy First",
      description: "We prioritize delivering accurate, verified news from trusted sources to keep you reliably informed."
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Every feature is designed with our users in mind, focusing on intuitive design and personalized experiences."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We leverage cutting-edge AI and technology to revolutionize how you consume and interact with news."
    },
    {
      icon: Globe,
      title: "Global Perspective",
      description: "We believe in providing diverse, global perspectives to help you understand the world better."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ArcNews</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            About ArcNews
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're on a mission to revolutionize how people consume news. By combining artificial intelligence 
            with user-centric design, we make staying informed effortless and enjoyable.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-4">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                In today's information-rich world, staying informed shouldn't be overwhelming. ArcNews was created 
                to solve the problem of information overload by intelligently curating and presenting news in a way 
                that respects your time and interests.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that access to quality journalism and diverse perspectives is essential for an informed 
                society. Our platform aggregates content from trusted sources worldwide, providing you with 
                comprehensive coverage while filtering out noise and misinformation.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at ArcNews
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-4">Powered by Innovation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                ArcNews leverages advanced artificial intelligence to provide smart summaries, intelligent content 
                curation, and personalized recommendations. Our technology stack is built for speed, reliability, 
                and scalability to ensure you always have access to the latest news.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">AI-Powered</div>
                  <p className="text-sm text-muted-foreground">Smart content analysis and summarization</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">Real-time</div>
                  <p className="text-sm text-muted-foreground">Instant updates from global sources</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">Secure</div>
                  <p className="text-sm text-muted-foreground">Privacy-first approach to data handling</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-4">Join Our Community</CardTitle>
              <CardDescription className="text-lg">
                Be part of the future of news consumption. Start your journey with ArcNews today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?mode=signup')}
                  className="flex-1 sm:flex-none"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 sm:flex-none"
                >
                  Try Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default About;