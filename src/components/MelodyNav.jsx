import { useEffect, useState } from "react";
import { Menu, MoonStar, Sun, X } from "lucide-react";

const links = [["discover", "01 / Discover"], ["your-melody", "02 / Your Melody"], ["inside-melody", "03 / Inside the Melody"], ["matches", "04 / Matches"], ["melody-lab", "05 / Melody Lab"]];

export default function MelodyNav({ onToggleTheme }) {
  const isDarkMode = document.documentElement.dataset.theme !== "light";
  const [active, setActive] = useState("discover");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const sections = links.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(visible.target.id); }, { rootMargin: "-30% 0px -55%", threshold: [0, .2, .6] });
    sections.forEach((section) => observer.observe(section)); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = null;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
      frame = null;
    };
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(updateProgress); };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  const goTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };
  return <header className={`floating-nav ${menuOpen ? "is-open" : ""}`}><button className="nav-brand" type="button" onClick={() => goTo("discover")}><span className="brand-dot" />MelodyMatch</button><nav className="nav-links" aria-label="Page sections">{links.map(([id, label]) => <button type="button" key={id} className={active === id ? "is-active" : ""} aria-current={active === id ? "page" : undefined} onClick={() => goTo(id)}>{label}</button>)}</nav><div className="nav-tools"><button className="nav-theme" type="button" onClick={onToggleTheme} aria-label={`Switch to ${isDarkMode ? "light" : "dark"} theme`} title={`Switch to ${isDarkMode ? "light" : "dark"} theme`}>{isDarkMode ? <Sun size={14} /> : <MoonStar size={14} />}</button><button className="nav-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button></div><span className="nav-progress-track" aria-hidden="true"><span className="nav-progress-fill" style={{ transform: `scaleX(${scrollProgress})` }} /></span></header>;
}
