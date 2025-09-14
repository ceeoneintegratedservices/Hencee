"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"/><path d="M3 10h18"/><path d="M7 16v2"/><path d="M17 16v2"/></svg>
    ),
    title: "Inventory Management",
    desc: "Track product stock, handle multi-location warehouses, set reorder points, and run reconciliations."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M16 16v-1a4 4 0 0 0-8 0v1"/><rect width="20" height="8" x="2" y="16" rx="2"/></svg>
    ),
    title: "User Management",
    desc: "Create users, assign roles, and control access — with secure login, MFA, and full audit logs."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M4 10h16"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    ),
    title: "Sales & Invoicing",
    desc: "Generate invoices, process payments (full or partial), manage returns, and track sales performance."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    title: "Customer Management",
    desc: "View transaction history, set credit limits, and build loyalty with custom dashboards."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 6.5a5 5 0 0 0-10 0c0 2.5 2.5 4.5 5 4.5s5-2 5-4.5Z"/></svg>
    ),
    title: "Financial Management",
    desc: "Handle pricing, expenses, and budgets with real-time profit tracking and visual reports."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><rect width="7" height="9" x="7" y="7" rx="1"/><path d="M17 7v9"/></svg>
    ),
    title: "Reporting & Analytics",
    desc: "Build custom dashboards, schedule reports, and track KPIs across teams and departments."
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
  "/images/pirelli.png",
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
        {visible.map((src) => (
          <div key={src} className="flex items-center justify-center w-40 h-40">
            <Image src={src} alt={`Brand logo`} width={120} height={120} style={{ objectFit: 'contain', maxHeight: 120 }} />
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
      Trusted by 20,000+ Businesses and Professionals Worldwide. <br /> From startups to industry giants — companies rely on Ceeone every day.
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

function MissionSection() {
  return (
    <section className="w-full bg-[#f7f7f8] py-8 flex flex-col md:flex-row items-center justify-center animate-fade-in">
      <div className="flex-1 flex flex-col gap-4 max-w-xl px-4 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#02016A" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="#02016A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h2 className="text-3xl md:text-4xl font-bold text-[#171717]">About Ceeone</h2>
        </div>
        <p className="text-lg text-[#444] mb-4">Ceeone provides attentive services and safest tire solutions, which is made to protect and empower every bond built along the way. No matter which path you are going to choose — Ceeone is here to support you on your drive towards a life you love.</p>
        <div className="mb-2 bg-white/80 rounded-lg p-4 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke="#5570F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-bold text-lg">Proactive</h3>
          </div>
          <p className="text-[#444]">With Ceeone, we hope to make your every moment on the road the moment to be cherished. We make every effort to provide products and services that support you and your loved ones through the path to the desired destination, rooted in the love of companionship</p>
        </div>
        <div className="mb-2 bg-white/80 rounded-lg p-4 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#519C66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-bold text-lg">Our Vision</h3>
          </div>
          <p className="text-[#444]">To support you towards a life you love and make every journey counts.<br/>Making every journey count, driving you towards the life you love.</p>
        </div>
        <div className="bg-white/80 rounded-lg p-4 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2" stroke="#CC5F5F" strokeWidth="2"/><path d="M2 10h20" stroke="#CC5F5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-bold text-lg">Our Mission</h3>
          </div>
          <p className="text-[#444]">Providing personalized tire products and services with harmonious technology to safeguard every bond built along the road.</p>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center mt-10 md:mt-0 px-4 md:px-0">
        <div className="w-full max-w-md md:max-w-lg h-auto flex justify-center items-center">
          <Image src="/icons/illustration.png" alt="Ceeone Mission" width={0} height={0} sizes="100vw" className="w-full h-auto" />
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
          <p className="text-lg md:text-xl" style={{ color: 'var(--black-60)', fontFamily: 'Inter, sans-serif' }}>Meet Ceeone — a next-gen ERP platform designed to simplify your operations. Automate inventory, streamline sales, manage customer relationships, and gain total financial visibility — all in one intelligent system.</p>
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
          <Image src="/images/dashboard.svg" alt="Dashboard Preview" width={600} height={320} className="rounded-xl shadow-lg" />
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

function ProductShowcaseSection() {
  return (
    <section className="w-full bg-[#FAFAFA] py-20">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-start">
        <h2 className="text-2xl md:text-4xl font-bold text-zinc-800" style={{ fontFamily: "'Work Sans', sans-serif" }}>
          Get Started with Ceeone today.
        </h2>
        <Link href="/signup" className="group text-lg text-blue-600 hover:text-blue-800 transition-colors duration-300 mt-4 flex items-center gap-2">
          Sign up for a free account
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </Link>
        <div className="mt-10 w-full">
          <Image
            src="/images/orders.png"
            alt="Ceeone Dashboard Orders Page"
            width={1120}
            height={700}
            className="rounded-xl shadow-lg w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white py-16">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 text-[#171717]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200 flex justify-between items-center"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-semibold text-[#171717]">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 bg-gray-50">
                  <p className="text-[#444] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CompaniesSection />
      <MissionSection />
      <FeaturesSection />
      <ProductShowcaseSection />
      <FAQSection />
    </main>
  );
}