import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { AgePaths, Missions, Academy, Rewards, ParentReviews, Parents } from "@/components/landing/HomeSections";
import FooterSection from "@/components/landing/FooterSection";
import SEO from "@/components/SEO";
import { SITE_URL } from "@/data/routes";
import { courseData } from "@/data/courseData";

const LESSONS = courseData.reduce((n, s) => n + s.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0);
const HOME_LD = [
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#org`,
    name: "Kiki Warrior",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.png`,
    image: `${SITE_URL}/og-image.png`,
    description: "Free online safety course for kids aged 6 to 13, led by Kiki Warrior, with short video lessons, quizzes, rewards and a parent dashboard.",
    areaServed: "Worldwide",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Kiki Warrior",
    url: `${SITE_URL}/`,
    publisher: { "@id": `${SITE_URL}/#org` },
  },
];


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
      <SEO
        title="Kiki Warrior | Free Online Safety Course for Kids Aged 6-13"
        description={`Free online safety course for kids aged 6-9 and 10-13. ${LESSONS} short video lessons with Kiki Warrior, quizzes, Armour of God rewards and a parent dashboard to track progress.`}
        path="/"
        jsonLd={HOME_LD}
      />
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
