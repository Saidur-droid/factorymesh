import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";

export const metadata: Metadata = {
  title: {
    default: "FactoryMesh",
    template: "%s · FactoryMesh",
  },
  description: "AI-native manufacturing orchestration that turns factory capacity into bookable, routable production.",
  applicationName: "FactoryMesh",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
