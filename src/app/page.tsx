import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Shirt, Zap, Heart } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-[calc(100vh-72px)]">
      {/* Animated background with gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-oxford-blue to-background"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-duke-blue/30 rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-blue/20 rounded-full blur-3xl animate-glow-pulse animation-delay-300"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-1/50 backdrop-blur-sm border border-border/50 text-sm text-muted-foreground mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            Your personal AI stylist
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal tracking-tight leading-tight">
            Reimagine Your
            <span className="block bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent mt-2">
              Wardrobe
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            Discover the future of personal styling. Effortless, intelligent, and uniquely yours.
            Transform how you dress with AI-powered outfit recommendations.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started for Free
              </Button>
            </Link>
            <Link href="https://github.com/avimaybee/what2wear" target="_blank">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shirt,
                title: "Smart Wardrobe",
                description: "Organize your entire wardrobe digitally with AI-powered categorization and smart tagging.",
              },
              {
                icon: Zap,
                title: "Instant Outfits",
                description: "Get personalized outfit recommendations in seconds based on weather, occasion, and your style.",
              },
              {
                icon: Heart,
                title: "Style Learning",
                description: "The more you use it, the better it understands your preferences and unique style.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
