"use client";

import { usePathname, useRouter } from "next/navigation";
import "./globals.css";

const navItems = [
  { name: "Home", href: "/", icon: "⌂" },
  { name: "Intelligence", href: "/intelligence", icon: "◈" },
  { name: "Performance", href: "/performance", icon: "📈" },
  { name: "Production", href: "/production", icon: "▣" },
  { name: "Tasks", href: "/tasks", icon: "◷" },
  { name: "History", href: "/history", icon: "▤" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show navigation on login page if applicable
  const isAuthPage = pathname?.startsWith("/login");

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>CreatorOS — AI YouTube Shorts Agent</title>
      </head>
      <body>
        <div className="app-shell">
          {!isAuthPage && (
            <aside className="desktop-sidebar">
              <div className="sidebar-brand">
                <div className="brand-logo">C</div>
                <div>
                  <strong>CreatorOS</strong>
                  <span>AI WORKSPACE</span>
                </div>
              </div>
              <nav className="sidebar-nav">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      className={`sidebar-link ${active ? "active" : ""}`}
                      onClick={() => router.push(item.href)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          )}

          <div className="main-content-wrapper">
            {!isAuthPage && (
              <header className="mobile-topbar">
                <div className="brand-mini">
                  <div className="brand-logo-mini">C</div>
                  <strong>CreatorOS</strong>
                </div>
                <div className="topbar-status">
                  <span className="online-dot" />
                  <span>Online</span>
                </div>
              </header>
            )}

            <main className="content-container">{children}</main>

            {!isAuthPage && (
              <nav className="bottom-nav">
                {navItems.slice(0, 5).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      className={`nav-tab ${active ? "active" : ""}`}
                      onClick={() => router.push(item.href)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        <style jsx global>{`
          :root {
            --bg: #070b14;
            --panel: rgba(15, 27, 44, 0.75);
            --border: rgba(112, 165, 220, 0.16);
            --text: #edf6ff;
            --muted: #8da2bb;
            --blue: #3298ff;
            --cyan: #25d8e8;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
          }

          .app-shell {
            display: flex;
            min-height: 100dvh;
          }

          .desktop-sidebar {
            display: none;
            width: 240px;
            background: rgba(7, 13, 23, 0.9);
            border-right: 1px solid var(--border);
            padding: 24px 16px;
            position: sticky;
            top: 0;
            height: 100dvh;
            flex-direction: column;
            z-index: 50;
          }

          @media (min-width: 1024px) {
            .desktop-sidebar {
              display: flex;
            }
          }

          .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            padding: 0 8px;
          }

          .brand-logo, .brand-logo-mini {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            color: white;
            font-weight: 900;
            background: linear-gradient(135deg, #168cff, #13d4e8);
            box-shadow: 0 0 20px rgba(22, 140, 255, 0.3);
          }

          .brand-logo-mini {
            width: 28px;
            height: 28px;
            font-size: 14px;
            border-radius: 8px;
          }

          .sidebar-brand strong {
            display: block;
            font-size: 14px;
          }

          .sidebar-brand span {
            display: block;
            color: #748ba7;
            font-size: 8px;
            letter-spacing: 1px;
          }

          .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: none;
            background: transparent;
            color: var(--muted);
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
          }

          .sidebar-link:hover, .sidebar-link.active {
            color: var(--text);
            background: rgba(41, 135, 220, 0.15);
          }

          .sidebar-link.active {
            color: #70c7ff;
            box-shadow: inset 3px 0 0 var(--blue);
          }

          .main-content-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            padding-bottom: calc(75px + env(safe-area-inset-bottom));
          }

          @media (min-width: 1024px) {
            .main-content-wrapper {
              padding-bottom: 0;
            }
          }

          .mobile-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 56px;
            padding: 0 16px;
            background: rgba(7, 13, 23, 0.85);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 40;
            backdrop-filter: blur(15px);
          }

          @media (min-width: 1024px) {
            .mobile-topbar {
              display: none;
            }
          }

          .brand-mini {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
          }

          .topbar-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: var(--muted);
            background: rgba(255, 255, 255, 0.05);
            padding: 4px 10px;
            border-radius: 20px;
            border: 1px solid var(--border);
          }

          .online-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #45dfaa;
            box-shadow: 0 0 8px #45dfaa;
          }

          .content-container {
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
            padding: 20px 16px;
          }

          .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            background: rgba(7, 13, 23, 0.92);
            border-top: 1px solid var(--border);
            padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
            z-index: 40;
            backdrop-filter: blur(20px);
          }

          @media (min-width: 1024px) {
            .bottom-nav {
              display: none;
            }
          }

          .nav-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            background: transparent;
            border: none;
            color: var(--muted);
            font-size: 9px;
            padding: 6px 0;
            cursor: pointer;
            transition: color 0.2s;
          }

          .nav-icon {
            font-size: 18px;
          }

          .nav-tab.active {
            color: #70c7ff;
          }
        `}</style>
      </body>
    </html>
  );
}
