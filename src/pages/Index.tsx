import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldIcon, LockIcon, EyeIcon, HeartIcon } from "@/components/course/CourseIcons";
import { ArrowRight, BookOpen, Users, Award, Shield } from "lucide-react";

const courses = [
  {
    id: "internet-safety",
    title: "Internet Safety for Kids",
    description: "Learn to be safe, smart, and strong online. Fun lessons, quizzes, and badges for ages 6–13.",
    icon: "shield",
    ageRange: "Ages 6–13",
    lessons: 12,
    modules: 6,
    tag: "Featured",
    available: true,
  },
  {
    id: "digital-citizenship",
    title: "Digital Citizenship",
    description: "Understand your rights and responsibilities in the digital world.",
    icon: "eye",
    ageRange: "Ages 8–14",
    lessons: 8,
    modules: 4,
    tag: "Coming Soon",
    available: false,
  },
  {
    id: "cyber-bullying",
    title: "Beating Cyber Bullying",
    description: "Build resilience and learn to stand up against online bullying.",
    icon: "heart",
    ageRange: "Ages 7–13",
    lessons: 10,
    modules: 5,
    tag: "Coming Soon",
    available: false,
  },
];

const features = [
  { icon: <BookOpen className="w-6 h-6" />, title: "Fun Lessons", desc: "Animated, story-driven content kids love" },
  { icon: <Shield className="w-6 h-6" />, title: "Quiz & Badges", desc: "Earn rewards as you master each topic" },
  { icon: <Users className="w-6 h-6" />, title: "Parent Dashboard", desc: "Track your child's progress in real-time" },
  { icon: <Award className="w-6 h-6" />, title: "Certificates", desc: "Downloadable proof of completion" },
];

const CourseIcon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    shield: <ShieldIcon size={28} className="stroke-primary-foreground" />,
    lock: <LockIcon size={28} className="stroke-primary-foreground" />,
    eye: <EyeIcon size={28} className="stroke-primary-foreground" />,
    heart: <HeartIcon size={28} className="stroke-primary-foreground" />,
  };
  return icons[name] || icons.shield;
};

export default function Index() {
  return (
    <div className="min-h-screen gradient-dark">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon size={28} className="stroke-primary" />
            <span className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
              Kiki Warrior
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="btn-copper px-5 py-2 text-xs uppercase tracking-widest font-display">
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-body text-xs text-primary uppercase tracking-wider">Building an Online Safety Community</span>
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground uppercase tracking-wider leading-tight">
                Raising Digital<br />
                <span className="text-primary">Warriors</span>
              </h1>
              <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-md">
                Empower your children with the skills to navigate the internet safely. 
                Fun, interactive courses designed for young minds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/auth?mode=signup"
                  className="touch-target inline-flex items-center gap-2 btn-copper px-8 py-4 text-sm uppercase tracking-widest"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/courses/internet-safety"
                  className="touch-target inline-flex items-center gap-2 border border-border rounded-xl px-8 py-4 text-sm font-display uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
                >
                  Preview Course
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <div className="absolute inset-0 rounded-full gradient-copper opacity-20 blur-3xl" />
                <img
                  src="/images/hero-warrior.png"
                  alt="Kiki Warrior character - a young African warrior protecting children online"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-3"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">{f.title}</h3>
                <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
              Our Courses
            </h2>
            <p className="font-body text-muted-foreground max-w-lg mx-auto">
              Interactive, age-appropriate courses designed to keep your children safe online.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {course.available ? (
                  <Link to={`/courses/${course.id}`} className="block h-full">
                    <CourseCard course={course} />
                  </Link>
                ) : (
                  <CourseCard course={course} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h2 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider">
            Join Our Tribe
          </h2>
          <p className="font-body text-muted-foreground">
            Create a free parent account and start protecting your children's digital journey today.
          </p>
          <Link
            to="/auth?mode=signup"
            className="touch-target inline-flex items-center gap-2 btn-copper px-10 py-4 text-sm uppercase tracking-widest"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldIcon size={20} className="stroke-primary" />
            <span className="font-display text-sm text-muted-foreground uppercase tracking-wider">
              Kiki Warrior © 2026
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            Building an online safety community for African children and families.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CourseCard({ course }: { course: typeof courses[0] }) {
  return (
    <div className={`card-kiki h-full flex flex-col transition-all ${course.available ? "hover:border-primary/40 cursor-pointer group" : "opacity-60"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl gradient-copper flex items-center justify-center">
          <CourseIcon name={course.icon} />
        </div>
        <span className={`font-display text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${
          course.available
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}>
          {course.tag}
        </span>
      </div>
      <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide mb-2 group-hover:text-primary transition-colors">
        {course.title}
      </h3>
      <p className="font-body text-sm text-muted-foreground mb-4 flex-1">
        {course.description}
      </p>
      <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
        <span>{course.ageRange}</span>
        <span>•</span>
        <span>{course.modules} modules</span>
        <span>•</span>
        <span>{course.lessons} lessons</span>
      </div>
    </div>
  );
}
