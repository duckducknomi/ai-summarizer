import Header from "@/components/Header";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ToastProvider>
          <Header />
          <main className="mx-auto max-w-6xl p-6">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
