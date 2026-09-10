import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FactoryMesh",
  description: "Programmable manufacturing capacity for global brands.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
