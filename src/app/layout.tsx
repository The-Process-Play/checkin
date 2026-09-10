import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TPP Check-In",
  description: "Internal performance & engagement tracking for TPP",
};

// Applied before paint (see the inline script below) so there's no light-mode
// flash for users with a DARK/SYSTEM-dark preference.
const themeScript = `
(function () {
  try {
    var pref = document.documentElement.getAttribute("data-theme-preference");
    var isDark = pref === "DARK" || (pref === "SYSTEM" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  let themePreference: "LIGHT" | "DARK" | "SYSTEM" = "SYSTEM";
  if (session?.user) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { theme: true } });
    if (user) themePreference = user.theme;
  }

  return (
    <html
      lang="en"
      data-theme-preference={themePreference}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
