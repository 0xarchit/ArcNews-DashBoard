import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Newspaper, ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Privacy = () => {
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information: When you create an account, we collect your email address and chosen username.",
        "Usage data: We collect information about how you use ArcNews, including articles read, time spent, and preferences.",
        "Device information: We may collect device type, browser information, and IP address for security and optimization purposes.",
        "Cookies: We use cookies to enhance your experience and remember your preferences."
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Personalization: To customize your news feed based on your interests and reading history.",
        "Service improvement: To analyze usage patterns and improve our platform's functionality.",
        "Communication: To send you important updates about our service (you can opt out of marketing emails).",
        "Security: To protect your account and detect suspicious activity."
      ]
    },
    {
      icon: Shield,
      title: "Information Sharing",
      content: [
        "We do not sell, trade, or rent your personal information to third parties.",
        "We may share aggregated, anonymized data for research and improvement purposes.",
        "We may disclose information if required by law or to protect our rights and users' safety.",
        "Third-party services (like authentication providers) operate under their own privacy policies."
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "We use industry-standard encryption to protect your data in transit and at rest.",
        "Access to personal data is restricted to authorized personnel only.",
        "We regularly review and update our security practices.",
        "In case of a data breach, we will notify affected users within 72 hours."
      ]
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
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, and protect 
            your information when you use ArcNews.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 2025
          </p>
        </section>

        {/* Overview */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Our Commitment to Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                At ArcNews, we believe in transparency and your right to privacy. We collect only the information 
                necessary to provide you with a personalized news experience, and we never sell your personal data.
              </p>
              <p className="text-muted-foreground">
                This privacy policy applies to all users of ArcNews and covers our practices regarding the collection, 
                use, and disclosure of your information.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Privacy Sections */}
        <section className="mb-16">
          <div className="grid gap-8 max-w-4xl mx-auto">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Rights and Choices</CardTitle>
              <CardDescription>
                You have several rights regarding your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Access and Portability</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can request a copy of your personal data at any time through your account settings.
                  </p>
                  
                  <h4 className="font-semibold mb-2">Correction</h4>
                  <p className="text-sm text-muted-foreground">
                    You can update your account information and preferences in your profile settings.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Deletion</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can delete your account at any time, which will remove all your personal data from our systems.
                  </p>
                  
                  <h4 className="font-semibold mb-2">Opt-out</h4>
                  <p className="text-sm text-muted-foreground">
                    You can opt out of non-essential communications and data collection features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cookies */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience on ArcNews:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Essential Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Required for the website to function properly, including authentication and security.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Preference Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Remember your settings and preferences to provide a personalized experience.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how users interact with our platform to improve our services.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Managing Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    You can control cookies through your browser settings, though some features may not work properly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Contact Us About Privacy</CardTitle>
              <CardDescription>
                If you have questions about this privacy policy or our data practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have any questions, concerns, or requests regarding this privacy policy or how we handle 
                  your personal information, please don't hesitate to contact us:
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Email:</span>
                  <span className="text-primary">mail@0xarchit.is-a.dev</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We will respond to your privacy-related inquiries within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Updates */}
        <section>
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-muted/20 to-muted/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We may update this privacy policy from time to time to reflect changes in our practices or 
                applicable laws. When we make significant changes, we will:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Notify you via email if you have an account with us</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Update the "Last updated" date at the top of this policy</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">Post a notice on our platform highlighting the changes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Privacy;