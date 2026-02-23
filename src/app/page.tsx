"use client";

import { useState } from "react";
import EmailUploader from "@/components/EmailUploader";
import EmailDashboard from "@/components/EmailDashboard";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const emailOne = process.env.NEXT_PUBLIC_EMAIL_ONE || "email1@example.com";
  const emailTwo = process.env.NEXT_PUBLIC_EMAIL_TWO || "email2@example.com";

  interface EmailData {
    email: string;
    name: string;
  }

  const [extractedEmails, setExtractedEmails] = useState<EmailData[]>([]);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);

  const handleEmailsExtracted = (emails: EmailData[], sender: string) => {
    setExtractedEmails(emails);
    setSenderEmail(sender);
  };

  const handleReset = () => {
    setExtractedEmails([]);
    setSenderEmail(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex flex-col gap-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 pb-2">
            Bulk Mail Sender
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-lg">
            Professional email campaign management. Select your sender and upload your list to begin.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {extractedEmails.length > 0 && senderEmail ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <EmailDashboard
                emails={extractedEmails}
                senderEmail={senderEmail}
                onReset={handleReset}
              />
            </motion.div>
          ) : (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full"
            >
              <EmailUploader
                emailOne={emailOne}
                emailTwo={emailTwo}
                onEmailsExtracted={handleEmailsExtracted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>
    </main>
  );
}
