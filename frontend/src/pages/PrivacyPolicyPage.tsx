import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getStaticContent } from "@/lib/storage";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const content = getStaticContent().privacyPolicy;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Content */}
        <div className="max-w-3xl mx-auto prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      <Footer />
    </div>
  );
}
