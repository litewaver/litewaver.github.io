const socials = [
  { label: "HQ", href: "#home", icon: "fa-solid fa-house", external: false },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/victoria-joseph-in/",
    icon: "fa-brands fa-linkedin-in",
  },
  {
    label: "GitHub",
    href: "https://github.com/litewaver",
    icon: "fa-brands fa-github",
  },
  {
    label: "X",
    href: "https://x.com/magnolianroot",
    icon: "fa-brands fa-x-twitter",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/maagnolianroot",
    icon: "fa-brands fa-instagram",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@vyktoryawaver",
    icon: "fa-brands fa-tiktok",
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/user/31vgak2t645iy7cd6gbac6jfq3eq",
    icon: "fa-brands fa-spotify",
  },
  {
    label: "Cash App",
    href: "https://cash.app/$victoriajosef",
    icon: "fa-solid fa-dollar-sign",
  },
];

export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4">
      {socials.map(({ label, href, icon, external = true }) => (
        <li key={label}>
          <a
            href={href}
            aria-label={label}
            title={label}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-emerald-200 transition hover:-translate-y-1 hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400"
          >
            <i className={icon}></i>
          </a>
        </li>
      ))}
    </ul>
  );
}