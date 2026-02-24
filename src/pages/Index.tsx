import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-lg"
      >
        <div className="text-6xl float">🛡️</div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground text-shadow-playful">
          KikiWarrior
        </h1>
        <p className="font-body text-lg text-muted-foreground">
          Learn to be safe, smart, and kind online! Fun lessons, quizzes, and badges for ages 6–13.
        </p>
        <Link
          to="/course"
          className="touch-target inline-flex items-center gap-3 gradient-hero text-primary-foreground rounded-2xl px-8 py-4 font-display font-extrabold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          Start the Course <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
};

export default Index;
