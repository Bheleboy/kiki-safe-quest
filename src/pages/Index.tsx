import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { AgePaths, Missions, Academy, Rewards, Parents } from "@/components/landing/HomeSections";
import FooterSection from "@/components/landing/FooterSection";

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <Navbar />
      <main>
        <HeroSection />
        <AgePaths />
        <Missions />
        <Academy />
        <Rewards />
        <Parents />
      </main>
      <FooterSection />
    </div>
  );
}
