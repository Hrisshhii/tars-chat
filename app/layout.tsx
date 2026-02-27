import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tars Chat",
};

export default function RootLayout({children}:{children: React.ReactNode}){
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}