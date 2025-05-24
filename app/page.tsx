import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Target, Award, ArrowRight, Check } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-amber-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              The Future of
              <span className="block text-orange-500">Homeschooling</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Empower your children&apos;s education with our comprehensive platform designed specifically for modern homeschooling families.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/home">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-orange-200 text-gray-700 hover:bg-orange-50">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose ScholarSpace?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create an exceptional homeschooling experience for your family.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
                <CardTitle className="text-xl">Comprehensive Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Access grade-appropriate lessons across all subjects with interactive content and assessments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-xl">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Monitor your children&apos;s learning progress with detailed analytics and personalized insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Connect with other homeschooling families, share experiences, and get expert guidance.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Tailored Learning for Every Child
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform adapts to each child&apos;s unique learning style and pace, ensuring no one gets left behind.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Personalized learning paths</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Interactive lessons and activities</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Real-time progress monitoring</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Expert-designed curriculum</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 text-center">
              <Award className="h-20 w-20 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Award-Winning Platform</h3>
              <p className="text-gray-600">
                Recognized by educators and parents worldwide for excellence in homeschool education technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Homeschooling Experience?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who have already discovered the power of personalized education.
          </p>
          <Link href="/home">
            <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-orange-500" />
                <span className="text-xl font-bold">ScholarSpace</span>
              </div>
              <p className="text-gray-400">
                Empowering families through personalized education and community support.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Curriculum</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Community</Link></li>
                <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ScholarSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
