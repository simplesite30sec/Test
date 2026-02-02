import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL('https://30site.com'),
  title: "SimpleSite - 30초만에 홈페이지 만들기",
  description: "디자인 몰라도 괜찮습니다. 빈칸만 채우면 완벽한 홈페이지가 완성됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
