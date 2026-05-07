import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenSandbox 管理后台",
  description: "OpenSandbox 沙箱生命周期、命令、文件和端点管理界面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
