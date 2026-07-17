import Link from "next/link";
import { Recycle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="brand">
          <Recycle size={20} /> Scrapix
        </div>
        <div className="footer-links">
          <Link href="/market">Services</Link>
          <Link href="/impact">Impact</Link>
          <Link href="/partners/apply">Partner Network</Link>
        </div>
        <small>
          © {new Date().getFullYear()} Scrapix. Engineering a greener future.
        </small>
      </div>
    </footer>
  );
}
