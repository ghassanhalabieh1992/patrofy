import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/dictionary";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Patrofy — Moldes com IA",
  description: "Geração de moldes de costura profissionais com inteligência artificial.",
  metadataBase: new URL("https://patrofy.ai"),
  openGraph: {
    title: "Patrofy — Moldes com IA",
    description: "Geração de moldes de costura profissionais com inteligência artificial.",
    url: "https://patrofy.ai",
    siteName: "Patrofy",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patrofy — Moldes com IA",
    description: "Geração de moldes de costura profissionais com inteligência artificial.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale: Locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "pt";

  return (
    <html lang={initialLocale === "en" ? "en" : "pt-BR"} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
