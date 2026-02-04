import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL('https://30site.com'),
  title: "SimpleSite - 30초만에 홈페이지 만들기",
  description: "디자인 몰라도 괜찮습니다. 빈칸만 채우면 완벽한 홈페이지가 완성됩니다.",
  verification: {
    google: "hbMQTAfd41KsA68UXYkSWj7o6tvyTqXzhPQ51TGavTs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* Global Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PZ73QVCM4J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics-global" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PZ73QVCM4J');
          `}
        </Script>
        <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
