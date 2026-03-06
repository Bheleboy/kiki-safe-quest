import { Link } from "react-router-dom";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { motion } from "framer-motion";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-10">
          Last updated: March 2026
        </p>

        <div className="space-y-8 font-body text-sm text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or using the Kiki Warrior platform, you agree to be bound by
              these Terms of Service. If you do not agree, you may not access or use our services.
              These terms are governed by applicable laws including the{" "}
              <strong>Protection of Personal Information Act (POPIA)</strong> of South Africa and the{" "}
              <strong>General Data Protection Regulation (GDPR)</strong> of the European Union.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              2. Eligibility & Parent/Guardian Responsibility
            </h2>
            <p>
              Only individuals aged 18 or older may create a parent/guardian account. By registering,
              you confirm that you are the parent or legal guardian of any minor(s) for whom you
              create child profiles. You accept sole responsibility for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Supervising and monitoring the minor's use of the platform.</li>
              <li>Ensuring the accuracy of information provided in child profiles.</li>
              <li>All activity that occurs under your account, including child sub-accounts.</li>
              <li>Compliance with applicable laws in your jurisdiction regarding minors' access to online services.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              3. Account Security
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and
              for all activities under your account. You must notify us immediately of any
              unauthorised access or security breach. We reserve the right to suspend or terminate
              accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              4. Use of the Platform
            </h2>
            <p>Kiki Warrior is an educational platform designed to teach internet safety to children. You agree to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the platform only for its intended educational purpose.</li>
              <li>Not attempt to circumvent security measures or access controls.</li>
              <li>Not use the platform to distribute harmful, offensive, or illegal content.</li>
              <li>Not reverse-engineer, copy, or redistribute any platform content or materials.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              5. Content & Intellectual Property
            </h2>
            <p>
              All content on the Kiki Warrior platform — including courses, illustrations, characters,
              text, and interactive elements — is the intellectual property of Kiki Warrior and is
              protected by copyright law. You may not reproduce, distribute, or create derivative
              works from our content without prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              6. Child Safety Commitment
            </h2>
            <p>
              We are committed to providing a safe, ad-free learning environment for children. The
              platform does not include third-party advertisements, does not allow direct communication
              between users, and does not collect unnecessary personal information from children.
              All child data is managed exclusively through verified parent/guardian accounts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              7. Limitation of Liability
            </h2>
            <p>
              While we strive to provide accurate and helpful educational content, Kiki Warrior is
              provided "as is" without warranties of any kind. We are not liable for any indirect,
              incidental, or consequential damages arising from the use of our platform. Our total
              liability shall not exceed the amount you have paid for the services in the preceding
              12 months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              8. Modifications to Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time. Material changes will be
              communicated to registered users via email. Continued use of the platform after such
              changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              9. Termination
            </h2>
            <p>
              You may delete your account at any time. Upon account deletion, all personal data —
              including child profiles, progress, and badges — will be permanently removed in
              accordance with our Privacy Policy. We reserve the right to terminate accounts that
              violate these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              10. Contact Us
            </h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@kikiwarrior.com" className="text-primary hover:underline font-semibold">
                support@kikiwarrior.com
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
