"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const coreServices = [
  "Wholesale pharmaceutical distribution",
  "Bulk hospital and pharmacy supply",
  "Branded and generic medicine sourcing",
  "Chronic disease medication supply",
  "Over-the-counter (OTC) products",
  "Specialty medicine procurement",
];

const whyChoose = [
  "Verified & certified suppliers",
  "Strict quality control processes",
  "Reliable inventory management",
  "Regulatory compliance assurance",
  "Dedicated institutional support",
];

const industries = [
  "Hospitals",
  "Retail Pharmacies",
  "Private Clinics",
  "Diagnostic Centers",
  "Corporate Health Programs",
  "NGOs & Healthcare Initiatives",
];

const values = [
  { title: "Integrity", text: "We prioritize authenticity and transparency." },
  { title: "Quality", text: "We supply only verified and certified medicines." },
  { title: "Reliability", text: "We ensure dependable delivery and stock availability." },
  { title: "Compliance", text: "We adhere strictly to pharmaceutical regulations." },
  { title: "Service Excellence", text: "We build long-term partnerships through trust." },
];

const prescriptionCategories = [
  "Cardiovascular medications",
  "Antibiotics & anti-infectives",
  "Antidiabetic drugs",
  "Gastrointestinal treatments",
  "Respiratory medications",
  "Pain management therapies",
];

const otcCategories = [
  "Analgesics",
  "Cold & flu remedies",
  "Allergy medications",
  "Supplements & vitamins",
  "Pediatric formulations",
];

function Header() {
  return (
    <header className="w-full max-w-6xl flex flex-wrap justify-between items-center gap-4 px-4 md:px-8 py-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/icons/Logo-dark.png" alt="Hencee Pharmaceuticals" width={48} height={48} />
        <span className="font-bold text-lg md:text-xl" style={{ color: "var(--hencee-black)", fontFamily: "Work Sans, sans-serif" }}>
          Hencee Pharmaceuticals
        </span>
      </Link>
      <nav className="hidden lg:flex flex-wrap gap-6 text-[15px] font-bold" style={{ color: "var(--hencee-black)", fontFamily: "Work Sans, sans-serif" }}>
        <a href="#who-we-are" className="hover:underline transition-colors">
          Who we are
        </a>
        <a href="#services" className="hover:underline transition-colors">
          Services
        </a>
        <a href="#products" className="hover:underline transition-colors">
          Products
        </a>
        <a href="#compliance" className="hover:underline transition-colors">
          Compliance
        </a>
        <a href="#about" className="hover:underline transition-colors">
          About
        </a>
        <a href="#contact" className="hover:underline transition-colors">
          Contact
        </a>
      </nav>
      <div className="flex gap-2">
        <Link href="/login">
          <span
            className="inline-flex px-5 py-2 rounded-full border border-[#79747e] font-medium transition-colors duration-200 hover:bg-[#e9f4ff]"
            style={{ background: "var(--secondary-2)", color: "var(--hencee-black)", fontFamily: "Work Sans, sans-serif" }}
          >
            Sign in
          </span>
        </Link>
        <Link href="/signup">
          <span
            className="inline-flex px-4 py-2 rounded"
            style={{
              background: "var(--primary-main)",
              color: "var(--hencee-white)",
              fontFamily: "Work Sans, sans-serif",
              fontWeight: 700,
              boxShadow: "0 2px 8px 0 rgba(2,1,106,0.10)",
            }}
          >
            Portal access
          </span>
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="w-full flex flex-col items-center pt-4 pb-16 animate-fade-in" style={{ background: "#e8ecf4" }}>
      <Header />
      <div className="flex flex-col items-center text-center w-full max-w-4xl px-4 md:px-8 gap-6 mt-4">
        <p className="text-sm md:text-base font-semibold tracking-wide text-[#02016A] uppercase">Hencee Pharmaceuticals</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: "var(--hencee-black)", fontFamily: "Work Sans, sans-serif" }}>
          Trusted Supply. <span className="text-[#02016A]">Health Delivered.</span>
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-[#1e293b]">Delivering quality medicines with integrity, precision, and reliability.</p>
        <p className="text-lg text-[var(--black-60)] max-w-3xl leading-relaxed">
          We provide certified pharmaceutical products to hospitals, pharmacies, clinics, and healthcare institutions — ensuring consistent access to safe and
          effective treatments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <a
            href="#contact"
            className="inline-flex justify-center items-center px-8 py-3 min-h-[48px] rounded bg-[#02016a] text-white font-semibold shadow-lg hover:bg-blue-800 transition-transform hover:scale-[1.02] text-[16px]"
          >
            Request Supply Partnership
          </a>
          <a
            href="#contact"
            className="inline-flex justify-center items-center gap-2 px-8 py-3 min-h-[48px] rounded border-2 border-[#02016A] bg-white text-[#020155] font-bold hover:bg-[#f8fafc] transition-colors"
            style={{ fontFamily: "Work Sans, sans-serif" }}
          >
            Contact Our Team
          </a>
        </div>
      </div>
    </section>
  );
}

function WhoWeAreSection() {
  return (
    <section id="who-we-are" className="w-full bg-white py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-6">Who We Are</h2>
        <p className="text-lg text-[#444] leading-relaxed max-w-3xl mb-4">
          Hencee Pharmaceuticals is a trusted pharmaceutical supply company committed to distributing authentic, high-quality medicines sourced from licensed
          manufacturers and authorized distributors.
        </p>
        <p className="text-lg text-[#444] leading-relaxed max-w-3xl">
          We bridge the gap between manufacturers and healthcare providers through a reliable, compliant, and professionally managed supply chain.
        </p>
      </div>
    </section>
  );
}

function CoreServicesSection() {
  return (
    <section id="services" className="w-full bg-[#f7f7f8] py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-10">Our Core Services</h2>
        <ul className="grid sm:grid-cols-2 gap-4 max-w-4xl">
          {coreServices.map((item) => (
            <li key={item} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <span className="text-green-600 mt-1 shrink-0" aria-hidden>
                ✓
              </span>
              <span className="text-[#444]">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
    <section id="why-us" className="w-full bg-white py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-10">Why Choose Hencee Pharmaceuticals?</h2>
        <ul className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {whyChoose.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[#444]">
              <span className="text-[#02016A] font-bold" aria-hidden>
                ✔
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function IndustriesSection() {
  return (
    <section id="industries" className="w-full bg-[#f0f4ff] py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-10">Industries We Serve</h2>
        <div className="flex flex-wrap gap-3">
          {industries.map((name) => (
            <span key={name} className="px-5 py-2 rounded-full bg-white border border-[#c7d2fe] text-[#1e293b] font-medium shadow-sm">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="w-full bg-white py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-2">Our Commitment to Healthcare Excellence</h2>
        <p className="text-slate-500 mb-10">About Hencee Pharmaceuticals</p>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-[#02016A] mb-2">Our Mission</h3>
              <p className="text-[#444] leading-relaxed">
                To ensure consistent access to safe, high-quality, and affordable pharmaceutical products while maintaining the highest standards of integrity
                and compliance.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#02016A] mb-2">Our Vision</h3>
              <p className="text-[#444] leading-relaxed">
                To become a leading pharmaceutical distribution partner known for reliability, regulatory excellence, and public health impact.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#02016A] mb-3">Our Values</h3>
              <ul className="space-y-3">
                {values.map((v) => (
                  <li key={v.title} className="text-[#444]">
                    <span className="font-semibold text-[#171717]">{v.title}</span> – {v.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#02016A] mb-2">Our Approach</h3>
              <p className="text-[#444] mb-4">We operate through a structured procurement and distribution system that ensures:</p>
              <ul className="list-disc pl-5 space-y-2 text-[#444]">
                <li>Product authenticity verification</li>
                <li>Proper temperature-controlled storage</li>
                <li>Accurate inventory monitoring</li>
                <li>Timely and secure deliveries</li>
                <li>Full documentation and traceability</li>
              </ul>
            </div>
            <p className="text-[#444] font-medium border-l-4 border-[#02016A] pl-4 py-2 bg-slate-50 rounded-r">
              Healthcare is critical — and we treat it with the responsibility it deserves.
            </p>
            <div className="rounded-xl overflow-hidden shadow-md bg-slate-100">
              <Image src="/icons/illustration.png" alt="Hencee Pharmaceuticals commitment" width={560} height={360} className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section id="products" className="w-full bg-[#f7f7f8] py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-4">Comprehensive Pharmaceutical Portfolio</h2>
        <p className="text-lg text-[#444] mb-10 max-w-3xl">
          Hencee Pharmaceuticals supplies a wide range of therapeutic categories, including:
        </p>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#02016A] mb-4">Prescription Medicines</h3>
            <ul className="list-disc pl-5 space-y-2 text-[#444]">
              {prescriptionCategories.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#02016A] mb-4">Over-the-Counter (OTC) Products</h3>
            <ul className="list-disc pl-5 space-y-2 text-[#444]">
              {otcCategories.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6 text-[#444] leading-relaxed max-w-4xl">
          <div>
            <h3 className="text-lg font-bold text-[#171717] mb-2">Generic & Branded Medicines</h3>
            <p>
              We provide both branded pharmaceuticals and high-quality generic alternatives to suit various institutional and retail needs.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#171717] mb-2">Specialty & Hard-to-Source Medicines</h3>
            <p>
              Through our verified supplier network, we assist healthcare institutions in sourcing specialty and less commonly available medicines (subject to
              regulatory compliance).
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#171717] mb-2">Bulk & Institutional Supply</h3>
            <p className="mb-3">We offer structured bulk procurement solutions with scheduled delivery options for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hospitals</li>
              <li>Pharmacy chains</li>
              <li>Clinics</li>
              <li>Health organizations</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section id="compliance" className="w-full bg-white py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-4">Commitment to Regulatory Standards</h2>
        <p className="text-lg text-[#444] mb-10 max-w-3xl">
          At Hencee Pharmaceuticals, compliance is foundational to our operations.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Regulatory Adherence</h3>
              <p className="text-[#444] leading-relaxed">
                We operate in accordance with national pharmaceutical laws and regulatory authorities governing medicine procurement, storage, and distribution.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Product Authenticity Assurance</h3>
              <p className="text-[#444] leading-relaxed">All medicines are sourced from licensed manufacturers and authorized distributors.</p>
            </div>
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Ethical Distribution</h3>
              <p className="text-[#444] leading-relaxed">
                We do not engage in unauthorized medicine distribution and strictly follow prescription requirements where mandated.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Storage & Handling Standards</h3>
              <ul className="list-disc pl-5 space-y-2 text-[#444]">
                <li>Temperature-controlled storage</li>
                <li>Humidity monitoring</li>
                <li>Expiry date tracking</li>
                <li>Batch traceability systems</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Documentation & Transparency</h3>
              <p className="text-[#444] leading-relaxed">
                We maintain accurate records, invoices, and batch documentation to ensure transparency and accountability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const inquiryTypes = [
  "General inquiry",
  "Product availability & pricing",
  "Bulk & institutional supply",
  "Partnership discussion",
  "Other",
];

function ContactSection() {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState(inquiryTypes[0]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Hencee inquiry: ${inquiryType}`);
    const body = encodeURIComponent(
      `Name: ${name}\nOrganization: ${organization}\nEmail: ${email}\nPhone: ${phone}\nType of inquiry: ${inquiryType}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:henceepharmaceuticals@outlook.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <section id="contact" className="w-full bg-[#f0f4ff] py-16 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#171717] mb-2">Partner With Confidence</h2>
        <p className="text-lg text-[#444] mb-10 max-w-3xl">
          We welcome partnerships with healthcare institutions, pharmacies, and medical organizations.
        </p>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">General Inquiries</h3>
              <p className="text-[#444]">For product availability, pricing, or partnership discussions, contact our team.</p>
            </div>
            <div>
              <h3 className="font-bold text-[#02016A] mb-2">Bulk & Institutional Supply Requests</h3>
              <p className="text-[#444]">Speak with our procurement specialists to design a tailored supply plan.</p>
            </div>
            <address className="not-italic space-y-3 text-[#444]">
              <p>
                <span className="font-semibold text-[#171717]">Office Address:</span> Mgbajiaka Lane, opposite East End Hotel, Aroma, Awka
              </p>
              <p>
                <span className="font-semibold text-[#171717]">Phone:</span>{" "}
                <a href="tel:+2349037636783" className="text-[#02016A] hover:underline">
                  +234 903 763 6783
                </a>
              </p>
              <p>
                <span className="font-semibold text-[#171717]">Email:</span>{" "}
                <a href="mailto:henceepharmaceuticals@outlook.com" className="text-[#02016A] hover:underline">
                  henceepharmaceuticals@outlook.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-[#171717]">Business Hours:</span> 24/7
              </p>
            </address>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#171717] mb-6">Send a message</h3>
            {submitted ? (
              <p className="text-[#444]">
                If your email client did not open, reach us directly at{" "}
                <a href="mailto:henceepharmaceuticals@outlook.com" className="text-[#02016A] font-medium">
                  henceepharmaceuticals@outlook.com
                </a>
                .
              </p>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-[#374151] mb-1">
                  Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-org" className="block text-sm font-medium text-[#374151] mb-1">
                  Organization
                </label>
                <input
                  id="contact-org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-[#374151] mb-1">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-[#374151] mb-1">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-type" className="block text-sm font-medium text-[#374151] mb-1">
                  Type of Inquiry
                </label>
                <select
                  id="contact-type"
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none bg-white"
                >
                  {inquiryTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-[#374151] mb-1">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[#171717] focus:ring-2 focus:ring-[#02016A] focus:border-transparent outline-none resize-y min-h-[120px]"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#02016a] text-white font-semibold hover:bg-blue-800 transition-colors shadow-md"
              >
                Submit inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-[#101828] text-slate-300 py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-lg">Hencee Pharmaceuticals</span>
        </div>
        <p className="text-sm text-center md:text-right">Trusted Supply. Health Delivered.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <WhoWeAreSection />
      <CoreServicesSection />
      <WhyChooseSection />
      <IndustriesSection />
      <AboutSection />
      <ProductsSection />
      <ComplianceSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
