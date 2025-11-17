import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search, 
  Phone,
  Mail,
  MessageCircle,
  PlayCircle,
  ChevronRight,
  Book
} from "lucide-react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const supportOptions = [
    { 
      id: "chat", 
      name: "Live Chat", 
      icon: MessageCircle, 
      description: "Get instant help",
      available: true 
    },
    { 
      id: "email", 
      name: "Email Support", 
      icon: Mail, 
      description: "Response in 24 hours",
      available: true 
    },
    { 
      id: "phone", 
      name: "Phone Support", 
      icon: Phone, 
      description: "M-F, 9AM-5PM",
      available: false 
    },
  ];

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I set up my account?",
          a: "Create an account by tapping 'Sign Up', enter your details, and follow the setup wizard to configure your safety preferences and emergency contacts.",
        },
        {
          q: "Is my data secure and private?",
          a: "Yes, all your data is encrypted and stored securely. We never share your personal information without your consent.",
        },
      ],
    },
    {
      category: "Safety Features",
      questions: [
        {
          q: "How does the SOS button work?",
          a: "The SOS button sends an immediate alert to your emergency contacts with your location. There's a 5-second countdown before the alert is sent, which you can cancel if needed.",
        },
        {
          q: "What is AI Safety Monitoring?",
          a: "Our AI monitors your communications for harmful content, harassment, or dangerous patterns. It alerts you and your guardians if concerning content is detected.",
        },
      ],
    },
    {
      category: "Learning & Community",
      questions: [
        {
          q: "How does the learning system work?",
          a: "Complete interactive stories and quizzes to learn about safety, boundaries, and resilience. Earn XP and badges as you progress through different topics.",
        },
        {
          q: "Can I post anonymously in the community?",
          a: "Yes, you can choose to post anonymously in forums and support groups to protect your privacy while getting help and support.",
        },
      ],
    },
  ];

  const tutorials = [
    { 
      id: 1, 
      title: "Setting Up Your Profile", 
      duration: "3:45",
      category: "Getting Started" 
    },
    { 
      id: 2, 
      title: "Using Emergency Features", 
      duration: "5:20",
      category: "Safety" 
    },
    { 
      id: 3, 
      title: "Navigating the Learning Center", 
      duration: "4:15",
      category: "Learning" 
    },
    { 
      id: 4, 
      title: "Guardian Dashboard Overview", 
      duration: "6:30",
      category: "For Guardians" 
    },
  ];

  const guides = [
    { id: 1, title: "Complete User Guide", pages: 24 },
    { id: 2, title: "Safety Best Practices", pages: 12 },
    { id: 3, title: "Guardian Handbook", pages: 18 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Help & Support
          </h1>
          <p className="text-muted-foreground">Find answers and get assistance</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contact Options */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Choose how you'd like to get help</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {supportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="h-auto flex-col gap-3 py-6"
                    disabled={!option.available}
                  >
                    <Icon className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">{option.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                    {!option.available && (
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4 mt-4">
            {faqs.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-3 mt-4">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <PlayCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tutorial.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{tutorial.category}</Badge>
                        <span className="text-sm text-muted-foreground">{tutorial.duration}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="guides" className="space-y-3 mt-4">
            {guides.map((guide) => (
              <Card key={guide.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Book className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {guide.pages} pages
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  All guides are available offline for your convenience
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
