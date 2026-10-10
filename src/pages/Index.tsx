import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { AgePaths, Missions, Academy, Rewards, ParentReviews, Parents } from "@/components/landing/HomeSections";
import FooterSection from "@/components/landing/FooterSection";

export default function Index() {
  useEffect(() => {
    const id = "kiki-home-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <Navbar />
      <main>
        <HeroSection />
        <AgePaths />
        <Missions />
        <Academy />
        <Rewards />
        <ParentReviews />
        <Parents />
      </main>
      <FooterSection />
    </div>
  );
}
