import Link from "next/link";

export default function Home() {
  const features = [
    {
      href: "/products",
      title: "Products",
      desc: "Manage SKUs, dimensions, weights, and carton specifications",
      icon: "cube",
    },
    {
      href: "/forecast",
      title: "Demand Forecast",
      desc: "Per-market quarterly forecasts with growth and safety stock",
      icon: "chart",
    },
    {
      href: "/container",
      title: "Container Optimiser",
      desc: "Fill 20ft containers to capacity with orientation optimisation",
      icon: "container",
    },
    {
      href: "/production",
      title: "Production Split",
      desc: "Allocate production between AU and UK markets",
      icon: "split",
    },
    {
      href: "/charts",
      title: "Charts",
      desc: "Visualise demand trends, forecasts, and container fill",
      icon: "bar",
    },
    {
      href: "/export",
      title: "Export",
      desc: "Download Excel and PDF reports for planning",
      icon: "download",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
          Forecast Planner
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Production forecasting, container optimisation, and multi-market demand
          planning for Australia and the United Kingdom.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group block bg-white rounded-2xl border border-gray-200/60 p-6 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <h2 className="font-semibold text-base text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
              {f.title}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs text-gray-400">
          20ft Container: 5.9m x 2.35m x 2.39m = 33.2 CBM | Max payload: 28,000 kg
        </p>
      </div>
    </div>
  );
}
