import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocietySetu | Visitor Management",
  description: "Secure visitor approval management for residential societies."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
