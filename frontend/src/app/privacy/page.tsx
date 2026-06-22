import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: June 22, 2026</p>

        <div className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, email address,
              and payment information when you create an account or make a purchase. We also collect
              information about your use of our services, such as the videos you create, projects you
              build, and features you interact with.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to
              process transactions, to send you technical notices and support messages, and to
              communicate with you about our products and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Sharing and Disclosure</h2>
            <p>
              We do not share your personal information with third parties except as described in
              this policy. We may share data with service providers who help us operate our platform
              (such as payment processors and cloud hosting providers), when required by law, or
              with your consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including
              encryption at rest and in transit, regular security audits, and access controls.
              However, no method of electronic storage is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete, or
              port your personal data. You can manage most of this through your account settings.
              For additional requests, contact us at privacy@vysera.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at
              privacy@vysera.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
