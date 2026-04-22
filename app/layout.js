import { Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth-cookie";
import AppHeader from "./AppHeader";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const SESSION_SECRET =
  process.env.HULLBOARD_SESSION_SECRET ||
  "dev-hullboard-session-secret-min-32-chars!";

export const metadata = {
  title: "Hullboard",
  description:
    "Shipyard production visibility, IE metrics, and job coordination.",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hullboard_session")?.value;
  let authed = false;
  try {
    authed = Boolean(
      token && (await verifySessionToken(token, SESSION_SECRET)),
    );
  } catch {
    authed = false;
  }

  return (
    <html lang="en" className={`${outfit.variable} ${plexMono.variable}`}>
      <body className="hb-body">
        <div className="hb-noise" aria-hidden />
        <AppHeader authed={authed} />
        <main className="hb-main">{children}</main>
      </body>
    </html>
  );
}
