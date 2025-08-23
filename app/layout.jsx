import "./globals.css";   // 👈 måste in här

export const metadata = {
  title: "TrackBased – Vibe Tracker",
  description: "VibeMarket activity tracker • packs • pulls • tokens • verified"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
