import { Button } from "@/components/ui/button"
import { Upload, ArrowRight, Check, Clock, Star, FileText, Download, Sparkles, Zap } from "lucide-react"
import TrialWidget from "@/components/trial-widget"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold heading-premium">PDF to QuickBooks</span>
            </div>
            <nav className="hidden md:flex items-center space-x-10">
              <a
                href="#features"
                className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-all duration-300 hover:scale-105"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-all duration-300 hover:scale-105"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-all duration-300 hover:scale-105"
              >
                Pricing
              </a>
              <a
                href="#support"
                className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-all duration-300 hover:scale-105"
              >
                Support
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
                asChild
              >
                <a href="/login">Sign In</a>
              </Button>
              <Button size="sm" className="btn-premium text-white font-medium px-6 py-2 rounded-xl" asChild>
                <a href="/signup">Get Started</a>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="hero-bg pt-32 pb-20 min-h-screen flex items-center relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Column - Hero Text & Proof Elements */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif heading-premium leading-[1.1] tracking-tight">
                  Convert <em className="italic text-3d">PDF</em> to <em className="italic text-3d">QuickBooks</em>
                  <br />
                  in <em className="italic text-3d">minutes</em>, not hours
                </h1>

                <p className="text-xl md:text-2xl subheading-premium leading-relaxed font-light">
                  Save 4.5+ billable hours weekly. Upload <em className="italic">PDF receipts</em>, get{" "}
                  <em className="italic">QuickBooks-ready</em> CSV files instantly.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="badge-premium flex items-center space-x-3 px-5 py-3 rounded-2xl text-purple-700 font-medium">
                  <Clock className="h-5 w-5" />
                  <span>4.5 hours saved weekly</span>
                </div>
                <div className="badge-premium flex items-center space-x-3 px-5 py-3 rounded-2xl text-purple-700 font-medium">
                  <span className="text-lg">$</span>
                  <span>$135-250 recovered time</span>
                </div>
                <div className="badge-premium flex items-center space-x-3 px-5 py-3 rounded-2xl text-purple-700 font-medium">
                  <Check className="h-5 w-5" />
                  <span>QuickBooks ready</span>
                </div>
              </div>
            </div>

            {/* Right Column - Premium Interactive Widget */}
            <TrialWidget />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-serif heading-premium mb-8 leading-tight">
              From PDF receipts to QuickBooks
              <br />
              <em className="italic text-3d">in 4 simple steps</em>
            </h2>
            <p className="text-xl subheading-premium max-w-3xl mx-auto leading-relaxed">
              Transform your manual data entry process into an <em className="italic">automated workflow</em> that saves
              hours every week
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
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
                <div className="card-premium rounded-3xl p-8 mb-6 group-hover:scale-105 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                    {step.num}
                  </div>
                  <step.icon className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center space-x-4 badge-premium px-8 py-4 rounded-2xl">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-purple-700 text-lg">Complete process in under 5 minutes</span>
            </div>
            <p className="text-gray-500 mt-4">What used to take hours now takes minutes</p>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-serif heading-premium mb-8 leading-tight">
              Recover 4.5 <em className="italic text-3d">hours</em> weekly,
              <br />
              boost your <em className="italic text-3d">billable time</em>
            </h2>
            <p className="text-xl subheading-premium max-w-3xl mx-auto leading-relaxed">
              Transform your bookkeeping workflow with <em className="italic">automated receipt processing</em> designed
              specifically for <em className="italic">QuickBooks</em> users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-10 lg:col-span-1 shadow-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8">
                <Upload className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-6">Bulk PDF Upload</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
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
              <div key={index} className="card-premium rounded-3xl p-10">
                <div className="w-14 h-14 badge-premium rounded-2xl flex items-center justify-center mb-8">
                  <feature.icon className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            {[
              { number: "4.5+", label: "Hours Saved", sublabel: "Per week per bookkeeper" },
              { number: "$250", label: "Recovered Value", sublabel: "Weekly billable time @$55/hr" },
              { number: "10", label: "Files at Once", sublabel: "Batch processing capability" },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-7xl md:text-8xl font-light text-3d mb-4 group-hover:scale-110 transition-transform duration-500">
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-3">{stat.label}</div>
                <div className="text-gray-600">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-br from-purple-50/50 to-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="card-premium rounded-4xl p-16">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="flex justify-start mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-purple-600 fill-current" />
                  ))}
                </div>
                <blockquote className="text-3xl md:text-4xl font-serif text-gray-900 mb-10 leading-relaxed">
                  "This tool has saved me 5+ hours every week. What used to take me an entire afternoon now takes 10
                  minutes. My clients love the faster turnaround, and I can take on more work."
                </blockquote>
                <div className="mb-8">
                  <div className="text-xl font-semibold text-gray-900 mb-2">Sarah Rodriguez, CPA</div>
                  <div className="text-gray-600 mb-3">Freelance Bookkeeper • 8 years experience • 12 clients</div>
                  <div className="text-purple-600 font-semibold text-lg">Saves $275 weekly in billable time</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src="/professional-woman-bookkeeper-working-at-desk-with.jpg"
                    alt="Sarah Rodriguez, CPA"
                    className="w-96 h-96 object-cover rounded-3xl shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-purple-600/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-20">
            <p className="text-gray-600 mb-10 text-lg">Trusted by bookkeepers processing 200+ receipts monthly</p>
            <div className="flex flex-wrap justify-center gap-12 text-sm">
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
      <section id="pricing" className="py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-serif heading-premium mb-8 leading-tight">
              Simple, Transparent <em className="italic text-3d">Pricing</em>
            </h2>
            <p className="text-xl subheading-premium mb-6 leading-relaxed">
              One plan. All features. No hidden fees.
            </p>
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Currently FREE during feedback phase
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Phase Card */}
            <div className="card-premium rounded-3xl p-8 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  Limited Time
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Free Feedback Phase</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">$0<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600">Help us improve the product</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">1,500 pages per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Up to 10 files per batch</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">QuickBooks-ready CSV export</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Edit and review extracted data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Direct feedback channel</span>
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl" asChild>
                <a href="/signup">Start Free Now</a>
              </Button>
            </div>

            {/* Future Paid Plan */}
            <div className="card-premium rounded-3xl p-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  Coming Soon
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Professional Plan</h3>
                <div className="text-4xl font-bold text-purple-600 mb-2">$9<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600">Full production features</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">1,500 pages per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Up to 10 files per batch</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">QuickBooks-ready CSV export</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Edit and review extracted data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Priority email support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-3 rounded-xl" disabled>
                Available Soon
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              <strong>Free feedback phase includes:</strong> All features, unlimited usage, direct access to our team for feedback
            </p>
            <p className="text-sm text-gray-500">
              We'll notify you 30 days before transitioning to paid plans. No surprise charges.
            </p>
          </div>
        </div>
      </section>

      <section className="py-32 hero-bg">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-serif heading-premium mb-8 leading-tight">
            Ready to save <em className="italic text-3d">4.5 hours</em> weekly?
          </h2>
          <p className="text-xl subheading-premium mb-12 leading-relaxed">
            Join hundreds of bookkeepers who have transformed their workflow with{" "}
            <em className="italic">automated receipt processing</em>
          </p>
          <Button size="lg" className="btn-premium text-white font-semibold px-12 py-6 text-xl rounded-2xl" asChild>
            <a href="/signup">
              <Sparkles className="h-6 w-6 mr-3" />
              Start Free Now
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-gray-200/50 py-16 bg-gradient-to-b from-white to-gray-50/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="font-semibold text-gray-900 text-lg">PDF to QuickBooks</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                Save 4.5+ billable hours weekly with automated PDF receipt processing for QuickBooks
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#features" className="hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#support" className="hover:text-gray-900 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200/50 mt-12 pt-12 text-center">
            <p className="text-gray-600">&copy; 2024 PDF to QuickBooks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
