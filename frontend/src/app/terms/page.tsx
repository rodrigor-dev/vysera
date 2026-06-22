import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: June 22, 2026</p>

        <div className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Vysera, you agree to be bound by these Terms of Service. If you
              do not agree, you may not use the service. We reserve the right to update these terms
              at any time, and continued use constitutes acceptance of the changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must provide accurate and
              complete information when creating your account. Notify us immediately of any
              unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Service Usage</h2>
            <p>
              You agree to use Vysera only for lawful purposes and in accordance with these terms.
              You may not use the service to create or distribute content that violates any
              applicable law or infringes on the rights of others. We reserve the right to suspend
              or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Intellectual Property</h2>
            <p>
              You retain ownership of the content you create using Vysera. By using our service, you
              grant us a license to host, store, and process your content solely for the purpose of
              providing the service. Our platform, branding, and underlying technology are owned by
              Vysera.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Subscription and Billing</h2>
            <p>
              Paid plans are billed in advance on a monthly or annual basis as selected. You may
              cancel at any time, and access will continue until the end of the current billing
              period. Refunds are handled on a case-by-case basis. Prices are subject to change
              with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
            <p>
              Vysera is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
              permitted by law, we shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
            <p>
              For questions about these terms, please contact us at legal@vysera.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
