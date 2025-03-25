import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Indo Swiss Training Centre",
  description: "Next.js School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div id="__next">{children}</div> {/* Add id="__next" for react-modal */}
          <ToastWrapper /> {/* Move ToastContainer to a Client Component */}
        </body>
      </html>
    </ClerkProvider>
  );
}

// Create a separate Client Component for ToastContainer
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastWrapper = () => {
  return <ToastContainer position="bottom-right" theme="dark" />;
};