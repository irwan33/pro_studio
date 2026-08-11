import type { Metadata } from "next";
import "./editor-fonts.css";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Pro Studio",
  description: "Sports content creation platform for matchday graphics, lineups, stats, and social posts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
