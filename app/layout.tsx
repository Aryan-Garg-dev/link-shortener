import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Link Shortener",
  description: "Create a short, shareable link and track clicks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${epilogue.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
