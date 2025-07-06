import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics Dashboard | MALKUTH",
  description: "Comprehensive analytics dashboard for monitoring Malkuth platform performance, bot activity, content engagement, and system health metrics.",
  keywords: ["analytics", "dashboard", "metrics", "bot activity", "engagement", "content performance"],
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-layout">
      {children}
    </div>
  );
}