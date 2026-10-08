import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicPage>
      <main className="editorial-focus flex items-center justify-center bg-cream bg-tech-grid px-4">
      <div className="text-center">
        <Eyebrow>Find your way</Eyebrow>
          <h1 className="mb-4 font-display text-4xl font-bold uppercase text-charcoal">404</h1>
        <p className="mb-6 font-body text-xl text-charcoal/70">Oops! Page not found</p>
        <Button asChild className="btn-copper adventure-button">
          <a href="/">Return to Home <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card"><ArrowUpRight /></span></a>
        </Button>
      </div>
      </main>
    </PublicPage>
  );
};

export default NotFound;
