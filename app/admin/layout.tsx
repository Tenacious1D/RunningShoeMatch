import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | Running Shoe Match",
    template: "%s | Running Shoe Match Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
