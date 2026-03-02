import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProductCards from "@/components/landing/ProductCards";
import SafetyAppSection from "@/components/landing/SafetyAppSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustSection from "@/components/landing/TrustSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Index() {
  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <HeroSection />
      <ProductCards />
      <SafetyAppSection />
      <HowItWorks />
      <TrustSection />
      <TestimonialsSection />
      <FooterSection />
    </div>
  );
}
