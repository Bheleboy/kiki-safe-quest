import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-copper float">
          <ShieldIcon size={40} className="stroke-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground uppercase tracking-wider">
          Kiki Warrior
        </h1>
        <p className="font-body text-lg text-muted-foreground leading-relaxed">
          Learn to be safe, smart, and strong online. Fun lessons, quizzes, and badges for ages 6–13.
        </p>
        <Link
          to="/auth"
          className="touch-target inline-flex items-center gap-3 btn-copper px-8 py-4 text-base uppercase tracking-widest"
        >
          Start the Course <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
};

export default Index;
