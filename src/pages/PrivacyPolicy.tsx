import { Link } from "react-router-dom";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen gradient-dark">
      {/* Header */}
      <header className="border-b border-border/40 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full gradient-copper">
              <ShieldIcon size={16} className="stroke-primary-foreground" />
            </div>
            <span className="font-display text-sm text-foreground uppercase tracking-wider font-bold">
              Kiki Warrior
            </span>
          </Link>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wide mb-2">
          Privacy Policy
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-10">
          Last updated: March 2026
        </p>

        <div className="space-y-8 font-body text-sm text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              1. Introduction
            </h2>
            <p>
              Kiki Warrior ("we", "us", "our") is committed to protecting the privacy of all users,
              particularly children. This Privacy Policy explains how we collect, use, store, and
              protect personal information in compliance with the{" "}
              <strong>Protection of Personal Information Act (POPIA)</strong> of South Africa and the{" "}
              <strong>General Data Protection Regulation (GDPR)</strong> of the European Union.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              2. Information We Collect
            </h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Parent/Guardian account data:</strong> name, email address, and encrypted password.</li>
              <li><strong>Child profile data:</strong> first name, age band (6–9 or 10–13), and avatar colour preference. No email or direct identifiers are collected from children.</li>
              <li><strong>Learning progress:</strong> lesson completion, quiz scores, time spent, and badges earned.</li>
              <li><strong>Technical data:</strong> device type, browser information, and anonymised usage analytics.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To provide and personalise the learning experience for each child profile.</li>
              <li>To track and report learning progress to parents/guardians.</li>
              <li>To send course-related communications to parent/guardian email addresses.</li>
              <li>To improve our platform, content, and safety features.</li>
              <li>To comply with legal obligations under applicable data protection laws.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              4. Legal Basis for Processing
            </h2>
            <p>We process personal data based on:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Consent:</strong> explicit consent provided by the parent/guardian during account creation.</li>
              <li><strong>Contractual necessity:</strong> to deliver the services you have signed up for.</li>
              <li><strong>Legitimate interest:</strong> to maintain platform security and improve our educational content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              5. Children's Privacy
            </h2>
            <p>
              We take the privacy of children extremely seriously. Child profiles are created and managed
              exclusively by a verified parent or legal guardian. We do not collect email addresses,
              photographs, or any unnecessary personal information from children. All child data is
              accessible only to the parent/guardian who created the profile. Our platform contains no
              advertisements within the child learning area.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              6. Data Storage & Security
            </h2>
            <p>
              Personal data is stored securely using industry-standard encryption and access controls.
              We implement appropriate technical and organisational measures to protect against
              unauthorised access, alteration, disclosure, or destruction of personal information.
              Data is hosted on secure, SOC 2-compliant infrastructure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              7. Data Sharing
            </h2>
            <p>
              We do not sell, rent, or trade personal information to third parties. Data may be shared
              only with trusted service providers who assist in operating our platform (e.g., hosting,
              email delivery), and only under strict data processing agreements that ensure equivalent
              levels of protection.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              8. Your Rights
            </h2>
            <p>Under POPIA and GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal data we hold about you and your children.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Withdraw consent at any time.</li>
              <li>Object to processing based on legitimate interest.</li>
              <li>Data portability — receive your data in a structured, machine-readable format.</li>
              <li>Lodge a complaint with the relevant supervisory authority (Information Regulator in South Africa or your local Data Protection Authority under GDPR).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              9. Data Retention
            </h2>
            <p>
              We retain personal data only for as long as necessary to provide our services or as
              required by law. When an account is deleted, all associated personal data — including
              child profiles and progress records — is permanently removed within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              10. Contact Us
            </h2>
            <p>
              For any privacy-related enquiries, data access requests, or to exercise your rights,
              please contact us at{" "}
              <a href="mailto:privacy@kikiwarrior.com" className="text-primary hover:underline font-semibold">
                privacy@kikiwarrior.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <Link to="/auth?mode=signup" className="font-body text-sm text-primary hover:underline">
            ← Back to Sign Up
          </Link>
        </div>
      </motion.main>
    </div>
  );
}
