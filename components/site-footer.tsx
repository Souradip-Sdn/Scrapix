import Link from "next/link";
import Image from "next/image";
import logo from "@/app/assets/logo.png";
import logoText from "@/app/assets/logo-text.png";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link href="/" className="brand" style={{ display: "flex", alignItems: "center", gap: "1px" }}>
          <Image src={logo} alt="Scrapix Logo" height={45} className="brand-logo" style={{ width: "auto" }} />
          <Image src={logoText} alt="Scrapix" height={35} className="brand-logo" style={{ width: "auto" }} />
        </Link>
        <div className="footer-links">
          <Link href="/market">Services</Link>
          <Link href="/impact">Impact</Link>
        </div>
        <small>
          © {new Date().getFullYear()} Scrapix. Engineering a greener future.
        </small>
      </div>
    </footer>
  );
}
