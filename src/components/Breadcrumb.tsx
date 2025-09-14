"use client";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="bg-white px-5 py-1 border-t border-[#f1f3f9]">
      <div className="flex items-center gap-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 13 14">
          <path d="M4.42915 12.5214V10.4768C4.42914 9.95873 4.85045 9.53781 5.37229 9.53455H7.28841C7.81258 9.53455 8.23751 9.95642 8.23751 10.4768V10.4768V12.5155C8.2375 12.9649 8.60268 13.3301 9.05529 13.3333H10.3626C10.9731 13.3349 11.5592 13.0952 11.9914 12.6671C12.4237 12.2391 12.6667 11.6578 12.6667 11.0517V5.2439C12.6666 4.75426 12.448 4.28981 12.0697 3.97567L7.62865 0.449512C6.85234 -0.167252 5.74358 -0.147328 4.99026 0.496923L0.644675 3.97567C0.248494 4.28055 0.0117015 4.74638 0 5.2439V11.0458C0 12.3091 1.03159 13.3333 2.30412 13.3333H3.58153C3.79945 13.3349 4.00899 13.25 4.16365 13.0976C4.31831 12.9452 4.40528 12.7378 4.40528 12.5214H4.42915Z" fill="#02016A"/>
        </svg>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {index > 0 && <span className="text-[#8b8d97] text-xs">/</span>}
            {item.href ? (
              <a href={item.href} className="text-[#8b8d97] text-xs hover:text-[#45464e] transition-colors">
                {item.label}
              </a>
            ) : (
              <span className="text-[#8b8d97] text-xs">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
