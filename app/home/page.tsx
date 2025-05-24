import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Play, FileText, Beaker, Book, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-orange-100 to-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="relative mx-auto mb-8 w-full max-w-4xl h-80 rounded-2xl overflow-hidden">
              <Image
                src="/placeholder.svg?height=320&width=800"
                alt="Family homeschooling together"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Homeschool Hub</h1>
                  <p className="text-xl md:text-2xl mb-8 opacity-90">
                    Your all-in-one platform for a successful homeschooling journey.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                      Get Started
                    </Button>
                    <Link href="/dashboard">
                      <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-3 text-lg">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Curriculum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-teal-100 to-teal-200 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="h-32 bg-teal-300 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-teal-700" />
                </div>
                <CardTitle className="text-xl">Math</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">Engaging math lessons</CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-0 hover:shadow-lg transition-shadow text-white">
              <CardHeader className="pb-4">
                <div className="h-32 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <Beaker className="h-12 w-12 text-gray-300" />
                </div>
                <CardTitle className="text-xl">Science</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">Exciting science experiments</CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-100 to-green-200 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="h-32 bg-green-300 rounded-lg mb-4 flex items-center justify-center">
                  <Book className="h-12 w-12 text-green-700" />
                </div>
                <CardTitle className="text-xl">Reading</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">Captivating reading materials</CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 hover:shadow-lg transition-shadow text-white">
              <CardHeader className="pb-4">
                <div className="h-32 bg-emerald-500 rounded-lg mb-4 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-emerald-100" />
                </div>
                <CardTitle className="text-xl">History</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-emerald-100">Interactive history modules</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section id="progress" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Emily's Progress</CardTitle>
                <div className="text-3xl font-bold text-orange-500">75%</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ethan's Progress</CardTitle>
                <div className="text-3xl font-bold text-orange-500">60%</div>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Emily's Progress</span>
                <span className="text-sm text-gray-600">75%</span>
              </div>
              <Progress value={75} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Ethan's Progress</span>
                <span className="text-sm text-gray-600">60%</span>
              </div>
              <Progress value={60} className="h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Download className="h-8 w-8 text-blue-500 mr-4" />
                <div>
                  <CardTitle>Downloadable Worksheets</CardTitle>
                  <CardDescription>Access hundreds of printable worksheets</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Play className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <CardTitle>Educational Videos</CardTitle>
                  <CardDescription>Watch engaging educational content</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-16 bg-gradient-to-br from-amber-100 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-orange-300/20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Join Our Homeschooling Forum</h2>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                Connect with other homeschooling families, share tips, and ask questions.
              </p>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section id="profile" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Profile</h2>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Sarah Miller" />
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">Sarah Miller</CardTitle>
                    <CardDescription className="text-lg">Homeschooling Mom</CardDescription>
                  </div>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="text-gray-900">Sarah Miller</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-gray-900">sarah.miller@email.com</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="text-gray-900">Austin, Texas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Child Profiles</CardTitle>
                <Button variant="outline" size="sm">
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Emily Miller" />
                  <AvatarFallback>EM</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Emily Miller</div>
                  <div className="text-sm text-gray-600">Age 8, Grade 3</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Ethan Miller" />
                  <AvatarFallback>EM</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Ethan Miller</div>
                  <div className="text-sm text-gray-600">Age 6, Grade 1</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
} 