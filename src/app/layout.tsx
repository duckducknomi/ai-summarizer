import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Summarizer",
  description: "Summarize any text quickly with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
