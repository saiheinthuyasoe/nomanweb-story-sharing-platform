import Link from 'next/link';
import { BookOpen, Users, Coins, Star, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-nomanweb-gradient">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-6">
              <span className="block">Share Your Stories</span>
              <span className="block text-yellow-300">Earn While You Write</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg lg:text-xl text-white/90 leading-relaxed">
              Join our community of storytellers. Write, share, and monetize your stories with our innovative coin system.
              Connect with readers who love great content.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="btn-gradient px-8 py-4 rounded-xl text-lg font-semibold hover-lift flex items-center space-x-2"
              >
                <span>Start Writing</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/stories"
                className="px-8 py-4 border-2 border-white/30 text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all-smooth flex items-center space-x-2"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explore Stories</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-gray-50" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-nomanweb-primary mb-4">
              Why Choose NoManWeb?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the perfect platform for storytellers to create, share, and earn from their creativity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={BookOpen}
              title="Write Stories"
              description="Create and publish your stories with our intuitive, easy-to-use editor designed for writers."
              gradient="from-blue-500 to-purple-600"
            />
            <FeatureCard
              icon={Users}
              title="Build Community"
              description="Connect with readers and fellow writers in our vibrant, supportive community ecosystem."
              gradient="from-green-500 to-teal-600"
            />
            <FeatureCard
              icon={Coins}
              title="Earn Coins"
              description="Monetize your content with our innovative coin system and turn your passion into profit."
              gradient="from-yellow-500 to-orange-600"
            />
            <FeatureCard
              icon={Star}
              title="Get Featured"
              description="Quality stories get featured on our platform and reach thousands of engaged readers."
              gradient="from-pink-500 to-red-600"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl lg:text-4xl font-bold text-nomanweb-primary mb-6">
                Everything you need to succeed as a storyteller
              </h3>
              <div className="space-y-4">
                <BenefitItem text="Advanced text editor with formatting options" />
                <BenefitItem text="Chapter management and organization tools" />
                <BenefitItem text="Reader engagement and comment system" />
                <BenefitItem text="Coin-based monetization platform" />
                <BenefitItem text="Analytics and performance tracking" />
                <BenefitItem text="Mobile-responsive reading experience" />
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="btn-gradient px-6 py-3 rounded-lg font-semibold hover-lift inline-flex items-center space-x-2"
                >
                  <span>Join NoManWeb Today</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-nomanweb-gradient rounded-2xl p-8 text-white">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Professional Writing Tools</h4>
                      <p className="text-white/80 text-sm">Everything you need to create amazing stories</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Earn Real Money</h4>
                      <p className="text-white/80 text-sm">Monetize your stories with our coin system</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Growing Community</h4>
                      <p className="text-white/80 text-sm">Connect with thousands of readers and writers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-nomanweb-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-6">
            Ready to start your writing journey?
          </h2>
          <p className="text-lg lg:text-xl text-white/90 mb-8">
            Join thousands of writers who are already sharing their stories and earning coins on NoManWeb.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn-gradient px-8 py-4 rounded-xl text-lg font-semibold hover-lift"
            >
              Start Writing for Free
            </Link>
            <Link
              href="/stories"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all-smooth"
            >
              Browse Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-nomanweb-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8" />
                <span className="text-2xl font-bold">NoManWeb</span>
              </div>
              <p className="text-white/80 max-w-md">
                The premier platform for storytellers to share their creativity, build communities, and earn from their passion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-white/80">
                <Link href="/stories" className="block hover:text-white transition-colors">Browse Stories</Link>
                <Link href="/register" className="block hover:text-white transition-colors">Start Writing</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-white/80">
                <Link href="#" className="block hover:text-white transition-colors">Help Center</Link>
                <Link href="#" className="block hover:text-white transition-colors">Community Guidelines</Link>
                <Link href="#" className="block hover:text-white transition-colors">Contact Us</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 NoManWeb. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <div className="card-elevated p-6 text-center">
      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r ${gradient} text-white mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-nomanweb-primary mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Benefit Item Component
function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
