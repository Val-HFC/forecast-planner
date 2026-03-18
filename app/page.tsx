import Link from "next/link";

export default function Home() {
  const features = [
    { href: "/products", title: "Products", desc: "Manage SKUs, dimensions, and carton specs" },
    { href: "/forecast", title: "Demand Forecast", desc: "Per-market quarterly forecasts for AU & UK" },
    { href: "/container", title: "Container Optimiser", desc: "Fill 20ft containers to 95%+ capacity" },
    { href: "/production", title: "Production Split", desc: "Allocate production runs between AU and UK" },
    { href: "/charts", title: "Charts", desc: "Visualise forecast, demand trends, and container fill" },
    { href: "/export", title: "Export", desc: "Download Excel or PDF reports for AU, UK, and container plan" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">AU + UK Forecast Planner</h1>
      <p className="text-gray-500 mb-8">Production forecasting, container optimisation, and multi-market demand planning.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-sm transition">
            <h2 className="font-semibold text-lg mb-1">{f.title}</h2>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
