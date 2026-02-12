import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = [
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/dmca", label: "DMCA" },
  { path: "/credits", label: "Credits" },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border bg-background/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary glow-text">SKYFLIXER</h2>
              <p className="text-sm text-muted-foreground">
                © {currentYear} SKYFLIXER. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                This site does not store any files on its server. All contents are
                provided by non-affiliated third parties.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Telegram Link - Highlighted */}
              <a
                href="https://t.me/MAIN_SKYFLIXER"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Join Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
