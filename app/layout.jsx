// first line unchanged
import "./globals.css"; // keep your styles here
import Providers from "./providers";

export const metadata = {
  title: "TrackBased – Vibe Tracker",
  description: "VibeMarket activity tracker • packs • pulls • tokens • verified"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap entire app with Wagmi + Web3Modal providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
