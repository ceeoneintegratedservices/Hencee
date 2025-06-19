"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

const brandImages = [
  "/images/firestone.png",
  "/images/dunlop.png",
  "/images/continental.png",
  "/images/goodyear.png",
  "/images/michelin.png",
  "/images/Bridgestone.png",
  "/images/Pirelli.png",
  "/images/hankook.png",
  "/images/yokohama.png",
  "/images/maxxis.png",
];

function BrandCarousel() {
  const [start, setStart] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const total = brandImages.length;

  useEffect(() => {
    // Responsive visibleCount
    function handleResize() {
      if (window.innerWidth < 768) {
        setVisibleCount(4);
      } else {
        setVisibleCount(5);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStart((prev) => (prev + 1) % total);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [total]);

  const visible = [];
  for (let i = 0; i < visibleCount; i++) {
    visible.push(brandImages[(start + i) % total]);
  }

  return (
    <div className="w-full flex justify-center">
      <div className="flex gap-8 justify-center items-center my-6 min-h-[80px] w-full max-w-6xl px-4 md:px-8">
        {visible.map((src, idx) => (
          <div key={idx} className="flex items-center justify-center w-40 h-40">
            <Image src={src} alt={`Brand ${idx}`} width={120} height={120} style={{ objectFit: 'contain', maxHeight: 120 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompaniesSection() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-16" style={{ background: '#d3d3d3' }}>
      <div className="font-bold text-center mb-6" style={{ color: 'var(--ceeone-black)', fontFamily: 'Work Sans, sans-serif', fontSize: 20 }}>
        Over 20,000 People and Companies uses Ceeone
      </div>
      <BrandCarousel />
      <div className="flex justify-center mt-6 items-center">
        <div className="flex shadow-sm">
          <button
            className="flex items-center gap-2 px-8 py-3 rounded-l-full border border-[#79747e] border-r border-r-[#79747e] bg-[#e8def8] text-[#625b71] font-medium h-14 transition-colors duration-200 hover:bg-[#d1c4e9]"
            style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 18, minWidth: 180 }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M7 10.833 9.5 13.333l5-5" stroke="#625b71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Get started
          </button>
          <button
            className="px-8 py-3 rounded-r-full border border-[#79747e] border-l border-l-[#79747e] bg-white text-[#222] font-medium h-14 focus:outline-none transition-colors duration-200 hover:bg-[#f3f3f3]"
            style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 18, minWidth: 180 }}
          >
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center pt-8 pb-8 animate-fade-in" style={{ background: '#d3d3d3' }}>
      <header className="w-full max-w-6xl flex justify-between items-center px-4 md:px-8 mb-8">
        <div className="flex items-center gap-2">
          <Image src="/icons/Logo-dark.png" alt="Logo" width={48} height={48} />
        </div>
        <nav className="hidden md:flex gap-8 text-[16px] font-bold" style={{ color: 'var(--ceeone-black)', fontFamily: 'Work Sans, sans-serif' }}>
          <a href="#" className="hover:underline transition-colors">Business types</a>
          <a href="#features" className="hover:underline transition-colors">Features</a>
          <a href="#pricing" className="hover:underline transition-colors">Pricing</a>
          <a href="#about" className="hover:underline transition-colors">About us</a>
        </nav>
        <div className="flex gap-2">
          <Link href="/login">
            <span className="px-6 py-2 rounded-full border border-[#79747e] font-medium transition-colors duration-200 hover:bg-[#e9f4ff]" style={{ background: 'var(--secondary-2)', color: 'var(--ceeone-black)', fontFamily: 'Work Sans, sans-serif' }}>Sign in</span>
          </Link>
          <Link href="/signup">
            <span className="px-4 py-2 rounded" style={{ background: 'var(--primary-main)', color: 'var(--ceeone-white)', fontFamily: 'Work Sans, sans-serif', fontWeight: 700, boxShadow: '0 2px 8px 0 rgba(2,1,106,0.10)' }}>Get started</span>
          </Link>
        </div>
      </header>
      <div className="flex flex-col md:flex-row items-center w-full max-w-6xl px-4 md:px-8 gap-8">
        <div className="flex-1 flex flex-col gap-4 animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-bold" style={{ color: 'var(--ceeone-black)', fontFamily: 'Work Sans, sans-serif' }}>Award-Winning ERP<br />Simplified</h1>
          <p className="text-lg md:text-xl" style={{ color: 'var(--black-60)', fontFamily: 'Inter, sans-serif' }}>Meet Ceeone — the next generation ERP platform that's simple, fast, and built for modern businesses. Automate inventory, streamline sales, manage customers, and gain full financial control — all from one powerful, easy-to-use system.</p>
          <div className="flex gap-4 flex-wrap items-center">
     <button
       className="px-8 py-3 min-h-[48px] flex items-center rounded bg-[#02016a] text-white font-semibold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 text-[16px]"
       onClick={() => window.location.href = '/signup'}
     >
       Get started
     </button>
     <button
       className="flex items-center gap-2 px-6 h-[48px] rounded border border-[#02016A] bg-white text-[#020155] font-bold text-[18px] font-[Work Sans,sans-serif] hover:bg-[#f3f3f3] transition-colors duration-200"
       style={{ fontFamily: 'Work Sans, sans-serif' }}
       onClick={() => window.location.href = '/'}
     >
       <svg width="23" height="23" fill="none" viewBox="0 0 23 23" className="mr-2">
         <g id="messages-2">
           <g id="Vector">
             <path d="M17.5235 15.9675L17.8935 18.9655C17.9884 19.753 17.144 20.3033 16.4704 19.8953L12.4951 17.5329C12.0587 17.5329 11.6318 17.5045 11.2143 17.4476C11.9164 16.6221 12.3339 15.5785 12.3339 14.4495C12.3339 11.755 9.99993 9.57293 7.11573 9.57293C6.01517 9.57293 5.00001 9.88599 4.15562 10.4363C4.12716 10.1991 4.11767 9.96188 4.11767 9.71521C4.11767 5.39839 7.86524 1.8975 12.4951 1.8975C17.1251 1.8975 20.8726 5.39839 20.8726 9.71521C20.8726 12.2768 19.5539 14.5444 17.5235 15.9675Z" stroke="#02016A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.42313" />
             <path d="M17.5235 15.9675L17.8935 18.9655C17.9884 19.753 17.144 20.3033 16.4704 19.8953L12.4951 17.5329C12.0587 17.5329 11.6318 17.5045 11.2143 17.4476C11.9164 16.6221 12.3339 15.5785 12.3339 14.4495C12.3339 11.755 9.99993 9.57293 7.11573 9.57293C6.01517 9.57293 5.00001 9.88599 4.15562 10.4363C4.12716 10.1991 4.11767 9.96188 4.11767 9.71521C4.11767 5.39839 7.86524 1.8975 12.4951 1.8975C17.1251 1.8975 20.8726 5.39839 20.8726 9.71521C20.8726 12.2768 19.5539 14.5444 17.5235 15.9675Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="1.42313" />
           </g>
           <g id="Vector_2">
             <path d="M12.3338 14.4493C12.3338 15.5783 11.9163 16.622 11.2143 17.4474C10.275 18.5859 8.78544 19.3164 7.11564 19.3164L4.6394 20.787C4.22195 21.0431 3.69064 20.6921 3.74757 20.2082L3.98475 18.3392C2.71343 17.4569 1.8975 16.0432 1.8975 14.4493C1.8975 12.7795 2.78934 11.3089 4.15554 10.4361C4.99993 9.88582 6.01509 9.57276 7.11564 9.57276C9.99984 9.57276 12.3338 11.7548 12.3338 14.4493Z" stroke="#02016A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.42313" />
             <path d="M12.3338 14.4493C12.3338 15.5783 11.9163 16.622 11.2143 17.4474C10.275 18.5859 8.78544 19.3164 7.11564 19.3164L4.6394 20.787C4.22195 21.0431 3.69064 20.6921 3.74757 20.2082L3.98475 18.3392C2.71343 17.4569 1.8975 16.0432 1.8975 14.4493C1.8975 12.7795 2.78934 11.3089 4.15554 10.4361C4.99993 9.88582 6.01509 9.57276 7.11564 9.57276C9.99984 9.57276 12.3338 11.7548 12.3338 14.4493Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="1.42313" />
           </g>
         </g>
       </svg>
       Talk to sales
     </button>
   </div>
        </div>
        <div className="flex-1 flex justify-center animate-fade-in">
          <Image src="/images/Dashboard.png" alt="Dashboard Preview" width={600} height={320} className="rounded-xl shadow-lg" />
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
        <div className="flex gap-4 flex-wrap items-center">
          <button
            className="px-8 py-3 min-h-[48px] flex items-center rounded bg-[#02016a] text-white font-semibold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 text-[16px]"
            onClick={() => window.location.href = '/signup'}
          >
            Get started
          </button>
          <button
            className="px-8 py-3 min-h-[48px] flex items-center rounded bg-white border border-[#e5e7eb] text-[#02016a] font-semibold hover:bg-blue-50 transition-transform hover:scale-105 text-[16px]"
          >
            Contact Sales
          </button>
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
              <svg
                className={`w-5 h-5 transform transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              id={`faq-${i}`}
              className={`mt-2 text-[#444] overflow-hidden transition-all duration-300 ${
                open === i ? 'max-h-40' : 'max-h-0'
              }`}
            >
              {faq.a}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CompaniesSection />
      <FeaturesSection />
      <GetStartedSection />
      <FAQSection />
    </main>
  );
}