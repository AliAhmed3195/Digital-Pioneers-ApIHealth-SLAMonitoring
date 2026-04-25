import "./globals.css";
import type { ReactNode } from "react";
import { AppShell } from "@/shared/ui/AppShell";
import { ToastProvider } from "@/shared/ui/ToastProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-background">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
