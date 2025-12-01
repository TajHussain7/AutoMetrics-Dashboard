import { useRef } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/home/hero-section";
import { WalkthroughSteps } from "@/components/home/walkthrough-steps";
import { DemoWidget } from "@/components/home/demo-widget";
import { FieldExplanation } from "@/components/home/field-explanation";
import { SecuritySection } from "@/components/home/security-section";
import { FAQSection } from "@/components/home/faq-section";
import { FooterCTA } from "@/components/home/footer-cta";
import { useLocation } from "wouter";
import Footer from "@/components/navigation/footer";

export default function Home() {
  const demoRef = useRef<HTMLDivElement>(null);
  const walkthroughRef = useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToWalkthrough = () => {
    walkthroughRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col home-page">
      <Header />

      <main className="flex-1">
        <HeroSection
          onTryDemo={scrollToDemo}
          onHowItWorks={scrollToWalkthrough}
        />

        <div ref={walkthroughRef}>
          <WalkthroughSteps />
        </div>

        <div ref={demoRef}>
          <DemoWidget />
        </div>

        <FieldExplanation />

        <SecuritySection />

        <FAQSection />

        <FooterCTA
          onGetStarted={() => navigate("/login")}
          onTryDemo={scrollToDemo}
        />

        <Footer />
      </main>
    </div>
  );
}
