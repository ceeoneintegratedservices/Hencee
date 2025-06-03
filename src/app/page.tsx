"use client";
import Image from "next/image";
import { useState } from "react";

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
    ),
    title: "Domain Marketplace",
    desc: "Branded domains are the perfect solution for any company looking to stand out and scale."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" /></svg>
    ),
    title: "Find the Perfect Name",
    desc: "Powerful and unique brandable domain names are hard to find. Our collection is hand-selected by branding experts."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" /></svg>
    ),
    title: "Payment Plans",
    desc: "Flexible payment options to help you get started quickly and easily."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
    ),
    title: "Fast Transfer",
    desc: "Get your domain transferred to you quickly and securely after purchase."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    ),
    title: "Trademark Assistance",
    desc: "Guidance on trademark and business registration for your new domain."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" /></svg>
    ),
    title: "Customer Support",
    desc: "Our team is here to help you every step of the way."
  }
];

const faqs = [
  {
    q: "What makes a strong brand name?",
    a: "A strong brand name is unique, memorable, easy to pronounce, and relevant to your business or industry."
  },
  {
    q: "How and when does the domain I purchase get transferred to me?",
    a: "After purchase, the domain is transferred to your account within 24-48 hours. You will receive instructions via email."
  },
  {
    q: "Do these names come with Trademark or Business Registration?",
    a: "No, domains do not come with trademark or business registration, but we can guide you through the process."
  },
  {
    q: "Do you offer payment plans?",
    a: "Yes, we offer flexible payment plans to help you get started. Contact our sales team for more details."
  },
  {
    q: "What else do I get when I purchase a domain?",
    a: "You get full ownership of the domain, support from our team, and resources to help you launch your brand."
  }
];

function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center pt-8 pb-8 bg-[#f7f7f8] animate-fade-in">
      <header className="w-full max-w-6xl flex justify-between items-center px-4 md:px-8 mb-8">
        <div className="flex items-center gap-2">
          <Image src="/Logo-dark.png" alt="Logo" width={48} height={48} />
        </div>
        <nav className="hidden md:flex gap-8 text-[16px] font-medium text-[#171717]">
          <a href="#" className="hover:underline transition-colors">Business types</a>
          <a href="#features" className="hover:underline transition-colors">Features</a>
          <a href="#pricing" className="hover:underline transition-colors">Pricing</a>
          <a href="#about" className="hover:underline transition-colors">About us</a>
        </nav>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-white border border-[#e5e7eb] text-[#171717] font-medium hover:bg-gray-100 transition">Sign in</button>
          <button className="px-4 py-2 rounded bg-[#1717ff] text-white font-medium shadow-lg hover:bg-blue-700 transition">Get started</button>
        </div>
      </header>
      <div className="flex flex-col md:flex-row items-center w-full max-w-6xl px-4 md:px-8 gap-8">
        <div className="flex-1 flex flex-col gap-4 animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-bold text-[#171717]">Award-Winning ERP<br />Simplified</h1>
          <p className="text-lg md:text-xl text-[#444] max-w-xl">Meet Ceeone — the next generation ERP platform that's simple, fast, and built for modern businesses. Automate inventory, streamline sales, manage customers, and gain full financial control — all from one powerful, easy-to-use system.</p>
          <div className="flex gap-4 mt-4">
            <button className="px-6 py-3 rounded bg-[#1717ff] text-white font-semibold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">Get started</button>
            <button className="px-6 py-3 rounded bg-white border border-[#e5e7eb] text-[#1717ff] font-semibold hover:bg-blue-50 transition-transform hover:scale-105">Contact Sales</button>
          </div>
          <div className="flex gap-4 mt-6 items-center flex-wrap">
            <span className="text-[#444] font-medium">Over 20,000 People and Companies uses Ceeone</span>
            <Image src="/logoIcon.png" alt="Logo Icon" width={40} height={40} />
          </div>
        </div>
        <div className="flex-1 flex justify-center animate-fade-in">
          <Image src="/Home.png" alt="Dashboard Preview" width={420} height={320} className="rounded-xl shadow-lg" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="w-full bg-white py-16 flex flex-col items-center animate-fade-in">
      <h2 className="text-2xl md:text-4xl font-bold mb-10 text-[#171717]">Ceeone ERP – Key Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-6xl px-4 md:px-8">
        {features.map((f, i) => (
          <div key={i} className="bg-[#f7f7f8] rounded-xl p-8 flex flex-col items-center text-center shadow-md hover:shadow-xl transition-shadow duration-300 group animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-[#171717]">{f.title}</h3>
            <p className="text-[#444]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GetStartedSection() {
  return (
    <section className="w-full bg-[#f7f7f8] py-16 flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-3xl flex flex-col items-center gap-6 px-4 md:px-0">
        <h2 className="text-2xl md:text-4xl font-bold text-[#171717]">Get Started with Ceeone today.</h2>
        <p className="text-lg text-[#444]">Sign up for a free account and experience the next generation of ERP for your business.</p>
        <div className="flex gap-4 flex-wrap">
          <button className="px-8 py-3 rounded bg-[#1717ff] text-white font-semibold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">Get started</button>
          <button className="px-8 py-3 rounded bg-white border border-[#e5e7eb] text-[#1717ff] font-semibold hover:bg-blue-50 transition-transform hover:scale-105">Contact Sales</button>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="w-full bg-white py-16 flex flex-col items-center animate-fade-in">
      <h2 className="text-2xl md:text-4xl font-bold mb-10 text-[#171717]">Frequently Asked Questions</h2>
      <div className="w-full max-w-3xl flex flex-col gap-4 px-4 md:px-0">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-gray-200 py-4">
            <button
              className="w-full flex justify-between items-center text-left text-lg font-medium text-[#171717] focus:outline-none transition-colors hover:text-blue-700"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              aria-controls={`faq-${i}`}
            >
              {faq.q}
              <span className={`ml-2 transition-transform ${open === i ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div
              id={`faq-${i}`}
              className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-[#444] text-base p-2">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-[#f7f7f8] w-full min-h-screen flex flex-col items-center">
      <HeroSection />
      <FeaturesSection />
      <GetStartedSection />
      <FAQSection />
    </div>
  );
}

// Tailwind Animations (add to your globals.css or tailwind.config.js if not present)
// .animate-fade-in { animation: fadeIn 0.8s ease; }
// .animate-slide-up { animation: slideUp 0.8s cubic-bezier(.4,2,.6,1) both; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideUp { from { opacity: 0; transform: translateY(40px);} to { opacity: 1; transform: none; } }
