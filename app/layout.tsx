import { Metadata } from "next";
import "./globals.css";

import { Work_Sans } from "next/font/google";
import { ToastProvider } from "@/components/Toast";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "Editorial CMS Platform | Techinika",
  description:
    "A Rwandan voice for technology, startups, and innovation. Covering the latest trends, news, and know-how for a global audience.",

  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={workSans.className}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
