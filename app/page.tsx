import { Button } from "@/components/ui/button"
import { Upload, ArrowRight, Check, Clock, Star, FileText, Download, Sparkles, Zap } from "lucide-react"
import TrialWidget from "@/components/trial-widget"

export default function HomePage() {
  return (
    <div className="min-h-screen continuous-bg">
      <header className="header-premium">
        <div className="header-container">
          <div className="header-content">
            <div className="header-logo">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold heading-premium">PDF to QuickBooks</span>
            </div>
            <nav className="header-nav">
              <a href="#how-it-works" className="header-nav-link smooth-scroll">
                How it Works
              </a>
              <a href="#features" className="header-nav-link smooth-scroll">
                Features
              </a>
              <a href="#pricing" className="header-nav-link smooth-scroll">
                Pricing
              </a>
              <a href="/login" className="header-nav-link">
                Sign In
              </a>
              <Button className="header-cta-button" asChild>
                <a href="/signup">Get Started</a>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="pt-40 pb-16 relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Text & Proof Elements */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif heading-premium leading-[1.1] tracking-tight">
                  Convert <em className="italic text-3d">PDF</em> to <em className="italic text-3d">QuickBooks</em>
                  <br />
                  in <em className="italic text-3d">minutes</em>, not hours
                </h1>

                <p className="text-lg md:text-xl subheading-premium leading-relaxed font-light">
                  Save 5+ billable hours weekly. Upload <em className="italic">PDF receipts</em>, get{" "}
                  <em className="italic">QuickBooks-ready</em> CSV files instantly.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <div className="badge-premium px-4 py-2 rounded-xl text-purple-700 font-medium text-sm">
                  <span>5 hours saved weekly</span>
                </div>
                <div className="badge-premium px-4 py-2 rounded-xl text-purple-700 font-medium text-sm">
                  <span>$300+ recovered time</span>
                </div>
                <div className="badge-premium px-4 py-2 rounded-xl text-purple-700 font-medium text-sm">
                  <span>QuickBooks ready</span>
                </div>
              </div>
            </div>

            {/* Right Column - Premium Interactive Widget */}
            <TrialWidget />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif heading-premium mb-6 leading-tight">
              From PDF receipts to QuickBooks
              <br />
              <em className="italic text-3d">in 4 simple steps</em>
            </h2>
            <p className="text-lg subheading-premium max-w-3xl mx-auto leading-relaxed">
              Transform your manual data entry process into an <em className="italic">automated workflow</em> that saves
              hours every week
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                num: "01",
                title: "Upload PDFs",
                desc: "Drag and drop up to 10 PDF receipts at once. Supports both scanned and digital receipts.",
                icon: Upload,
              },
              {
                num: "02",
                title: "AI Processing",
                desc: "Our AI extracts date, vendor, amount, and description from each receipt automatically.",
                icon: Zap,
              },
              {
                num: "03",
                title: "Review & Edit",
                desc: "Review extracted data in a simple table. Click any field to make corrections instantly.",
                icon: FileText,
              },
              {
                num: "04",
                title: "Export CSV",
                desc: "Download QuickBooks-ready CSV in 3-column or 4-column format. Import with one click.",
                icon: Download,
              },
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="card-premium rounded-2xl p-6 mb-4 group-hover:scale-105 transition-all duration-500">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg">
                    {step.num}
                  </div>
                  <step.icon className="h-6 w-6 text-purple-600 mx-auto mb-3" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center space-x-3 badge-premium px-6 py-3 rounded-xl">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center">
                <Zap className="h-3 w-3" />
              </div>
              <span className="font-semibold text-purple-700">Complete process in under 5 minutes</span>
            </div>
            <p className="text-gray-500 mt-3 text-sm">What used to take hours now takes minutes</p>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif heading-premium mb-6 leading-tight">
              Recover 5 <em className="italic text-3d">hours</em> weekly,
              <br />
              boost your <em className="italic text-3d">billable time</em>
            </h2>
            <p className="text-lg subheading-premium max-w-3xl mx-auto leading-relaxed">
              Transform your bookkeeping workflow with <em className="italic">automated receipt processing</em> designed
              specifically for <em className="italic">QuickBooks</em> users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6 lg:col-span-1 shadow-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Bulk PDF Upload</h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                Upload up to 10 PDF receipts at once. Supports scanned receipts, digital invoices, and various receipt
                formats.
              </p>
            </div>

            {[
              {
                title: "AI Data Extraction",
                desc: "Advanced AI automatically extracts date, vendor, amount, and description from receipts with high accuracy.",
                icon: Zap,
              },
              {
                title: "Review & Edit",
                desc: "Simple table interface to review and edit extracted data. Click any field to make corrections instantly.",
                icon: FileText,
              },
              {
                title: "QuickBooks Export",
                desc: "Export to 3-column or 4-column CSV format. Ready to import directly into QuickBooks with one click.",
                icon: Download,
              },
            ].map((feature, index) => (
              <div key={index} className="card-premium rounded-xl p-6">
                <div className="w-10 h-10 badge-premium rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { number: "5+", label: "Hours Saved", sublabel: "Per week per bookkeeper" },
              { number: "$300+", label: "Recovered Value", sublabel: "Weekly billable time" },
              { number: "10", label: "Files at Once", sublabel: "Batch processing capability" },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-4xl md:text-5xl font-light text-3d mb-2 group-hover:scale-110 transition-transform duration-500">
                  {stat.number}
                </div>
                <div className="text-base font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-gray-600 text-xs">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="card-premium rounded-3xl p-12">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="flex justify-start mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-purple-600 fill-current" />
                  ))}
                </div>
                <blockquote className="text-2xl md:text-3xl font-serif text-gray-900 mb-8 leading-relaxed">
                  "This tool has saved me 5+ hours every week. What used to take me an entire afternoon now takes 10
                  minutes. My clients love the faster turnaround, and I can take on more work."
                </blockquote>
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gray-900 mb-2">Sarah Rodriguez, CPA</div>
                  <div className="text-gray-600 mb-2">Freelance Bookkeeper • 8 years experience • 12 clients</div>
                  <div className="text-purple-600 font-semibold">Saves $300+ weekly in billable time</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src="/professional-woman-bookkeeper-working-at-desk-with.jpg"
                    alt="Sarah Rodriguez, CPA"
                    className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-purple-600/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">Trusted by bookkeepers processing 200+ receipts monthly</p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              {[
                { label: "99.5% accuracy rate", color: "green" },
                { label: "4.8/5 user rating", color: "green" },
                { label: "500+ bookkeepers", color: "green" },
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 bg-${item.color}-500 rounded-full`}></div>
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif heading-premium mb-6 leading-tight">
              Simple, Transparent <em className="italic text-3d">Pricing</em>
            </h2>
            <p className="text-lg subheading-premium mb-4 leading-relaxed">
              One plan. All features. No hidden fees.
            </p>
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Currently FREE during feedback phase
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Phase Card */}
            <div className="card-premium rounded-2xl p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <div className="text-center mb-6">
                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Limited Time
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Feedback Phase</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">$0<span className="text-base text-gray-500">/month</span></div>
                <p className="text-gray-600 text-sm">Help us improve the product</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 text-sm">1,500 pages per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 text-sm">Up to 10 files per batch</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 text-sm">QuickBooks-ready CSV export</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 text-sm">Edit and review extracted data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 text-sm">Direct feedback channel</span>
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl" asChild>
                <a href="/signup">Start Free Now</a>
              </Button>
            </div>

            {/* Future Paid Plan */}
            <div className="card-premium rounded-2xl p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="text-center mb-6">
                <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Coming Soon
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Plan</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">$9<span className="text-base text-gray-500">/month</span></div>
                <p className="text-gray-600 text-sm">Full production features</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-700 text-sm">1,500 pages per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-700 text-sm">Up to 10 files per batch</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-700 text-sm">QuickBooks-ready CSV export</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-700 text-sm">Edit and review extracted data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-700 text-sm">Priority email support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-3 rounded-xl" disabled>
                Available Soon
              </Button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-3 text-sm">
              <strong>Free feedback phase includes:</strong> All features, unlimited usage, direct access to our team for feedback
            </p>
            <p className="text-xs text-gray-500">
              We'll notify you 30 days before transitioning to paid plans. No surprise charges.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif heading-premium mb-6 leading-tight">
            Ready to save <em className="italic text-3d">5 hours</em> weekly?
          </h2>
          <p className="text-lg subheading-premium mb-8 leading-relaxed">
            Join hundreds of bookkeepers who have transformed their workflow with{" "}
            <em className="italic">automated receipt processing</em>
          </p>
          <Button size="lg" className="btn-premium text-white font-semibold px-10 py-5 text-lg rounded-2xl" asChild>
            <a href="/signup">
              <Sparkles className="h-5 w-5 mr-3" />
              Start Free Now
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-gray-200/50 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg flex items-center justify-center">
                <FileText className="h-3 w-3" />
              </div>
              <span className="font-semibold text-gray-900">PDF to QuickBooks</span>
            </div>
            <p className="text-gray-500 text-sm">&copy; 2025 PDF to QuickBooks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
