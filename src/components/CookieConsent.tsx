import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-50 p-4"
        >
          <div className="max-w-3xl mx-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="font-body text-sm text-muted-foreground flex-1">
              We use cookies to enhance your experience and analyse usage. By continuing, you agree to our{" "}
              <Link to="/privacy" className="text-primary hover:underline font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={decline}>
                Decline
              </Button>
              <Button size="sm" onClick={accept}>
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
