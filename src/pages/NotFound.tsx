import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex editorial-page min-h-screen items-center justify-center bg-primary/10">
      <div className="text-center">
        <Eyebrow>Find your way</Eyebrow>
          <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-charcoal/70">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
