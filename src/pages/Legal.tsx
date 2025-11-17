import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  Search, 
  FileText, 
  BookOpen,
  Download,
  Globe,
  ChevronRight,
  Shield
} from "lucide-react";

export default function Legal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("en");

  const categories = [
    { id: "rights", name: "Your Rights", icon: Shield, count: 12 },
    { id: "reporting", name: "How to Report", icon: FileText, count: 8 },
    { id: "laws", name: "Safety Laws", icon: Scale, count: 15 },
    { id: "resources", name: "Resources", icon: BookOpen, count: 20 },
  ];

  const topics = [
    {
      id: 1,
      title: "Your Right to Safety",
      category: "rights",
      description: "Learn about your fundamental right to be safe and protected",
      readTime: "5 min",
    },
    {
      id: 2,
      title: "How to Report Abuse",
      category: "reporting",
      description: "Step-by-step guide to reporting abuse safely and confidentially",
      readTime: "8 min",
    },
    {
      id: 3,
      title: "Digital Privacy Rights",
      category: "rights",
      description: "Understanding your privacy rights online and how to protect them",
      readTime: "6 min",
    },
    {
      id: 4,
      title: "Laws Against Harassment",
      category: "laws",
      description: "Legal protections against harassment and what actions you can take",
      readTime: "7 min",
    },
  ];

  const reportingGuides = [
    {
      id: 1,
      title: "Emergency Situations",
      steps: ["Call 911 immediately", "Get to a safe location", "Don't destroy evidence", "Contact trusted adult"],
    },
    {
      id: 2,
      title: "Non-Emergency Reporting",
      steps: ["Document incidents", "Contact local authorities", "Seek legal advice", "File official report"],
    },
  ];

  const templates = [
    { id: 1, name: "Incident Report Template", format: "PDF" },
    { id: 2, name: "Safety Plan Document", format: "DOC" },
    { id: 3, name: "Rights Information Sheet", format: "PDF" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              Legal Awareness
            </h1>
            <p className="text-muted-foreground">Know your rights and how to protect them</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            {language === "en" ? "English" : "Español"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search legal information..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-sm">{category.name}</p>
                  <Badge variant="secondary" className="mt-2">
                    {category.count} topics
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="space-y-3 mt-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{topic.category}</Badge>
                        <span className="text-xs text-muted-foreground">{topic.readTime}</span>
                      </div>
                      <h3 className="font-semibold mb-1">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reporting" className="space-y-4 mt-4">
            {reportingGuides.map((guide) => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-sm pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Need Immediate Help?</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you're in danger, call emergency services immediately or use the SOS button.
                    </p>
                    <Button size="sm" variant="emergency">
                      Emergency SOS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-3 mt-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <Badge variant="outline" className="mt-1">{template.format}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Using Legal Templates</CardTitle>
                <CardDescription>
                  These templates are designed to help you document incidents and plan for safety
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Fill out templates with as much detail as possible</li>
                  <li>• Keep copies in a safe, secure location</li>
                  <li>• Share with trusted adults or legal advisors when needed</li>
                  <li>• Update documents regularly as situations change</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
