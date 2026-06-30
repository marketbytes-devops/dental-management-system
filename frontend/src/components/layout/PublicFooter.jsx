import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";

const footerLinks = [
  {
    heading: "Quick Links",
    links: [
      { label: "Home",            href: "/" },
      { label: "About Us",        href: "/about" },
      { label: "Our Services",    href: "/#features" },
      { label: "Book Appointment",href: "/login?role=patient" },
      { label: "Patient Portal",  href: "/login?role=patient" },
    ],
  },
  {
    heading: "Staff Portals",
    links: [
      { label: "Doctor Portal",     href: "/login" },
      { label: "Front Desk",        href: "/login" },
      { label: "Lab Technician",    href: "/login" },
      { label: "Accountant",        href: "/login" },
      { label: "Admin Panel",       href: "/login" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "General Dentistry",   href: "/#features" },
      { label: "Orthodontics",        href: "/#features" },
      { label: "Cosmetic Dentistry",  href: "/#features" },
      { label: "Root Canal Therapy",  href: "/#features" },
      { label: "Dental Implants",     href: "/#features" },
    ],
  },
];

const contactItems = [
  { icon: MapPin, text: "Chennai, Tamil Nadu, India" },
  { icon: Phone, text: "+91 98765 43210" },
  { icon: Mail,  text: "hello@smilecare.in" },
  { icon: Clock, text: "Mon – Sat: 9:00 AM – 7:00 PM" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400">

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

        {/* Brand column — takes 2 cols on lg */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <ToothIcon className="w-8 h-8 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-black text-white tracking-tight">SmileCare</span>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">
            A premium, full-spectrum dental management system connecting patients, doctors,
            lab specialists, and front desk operators in real time.
          </p>

          {/* Contact info */}
          <ul className="space-y-2 pt-2">
            {contactItems.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-xs">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Link columns */}
        {footerLinks.map(({ heading, links }) => (
          <div key={heading} className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">{heading}</h4>
            <ul className="space-y-2">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmileCare Dental Ltd. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <span className="text-slate-700">·</span>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Staff Login</Link>
            <span className="text-slate-700">·</span>
            <Link href="/login?role=patient" className="hover:text-slate-300 transition-colors">Patient Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
