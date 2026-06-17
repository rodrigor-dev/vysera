"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { VyseraLogo } from "@/components/shared/vysera-logo";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Templates", href: "/templates" },
    { name: "Integrations", href: "/integrations" },
    { name: "API", href: "/api" },
  ],
  Company: [
    { name: "About", href: "#about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Press", href: "/press" },
  ],
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "Support", href: "/support" },
    { name: "Community", href: "/community" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "GDPR", href: "/gdpr" },
  ],
};

const socialLinks = [
  { icon: MessageCircle, href: "https://discord.gg/vysera", label: "Discord" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <VyseraLogo size="md" animated={false} showText />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Create stunning AI-powered videos in minutes. Made for creators,
              by creators.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:text-primary hover:shadow-lg hover:shadow-purple-500/10 hover:bg-primary/5"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="premium-divider mt-12 mb-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vysera. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with{" "}
            <span className="text-primary">&hearts;</span> for creators
          </p>
        </div>
      </div>
    </footer>
  );
}
