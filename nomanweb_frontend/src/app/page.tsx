"use client";

import Link from "next/link";
import {
  BookOpen,
  Users,
  Coins,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

// Mock data for featured stories - in real app, this would come from API
const featuredStories = [
  {
    id: "1",
    title: "The Chronicles of Ethereal Realms",
    author: "MysticWriter",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    genre: "Fantasy",
    views: 125000,
    likes: 8500,
    chapters: 45,
    status: "Ongoing",
    rating: 4.8,
    description:
      "A young mage discovers ancient secrets that could reshape the magical world forever.",
  },
  {
    id: "2",
    title: "Digital Shadows: A Cyberpunk Tale",
    author: "TechNoir",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    genre: "Sci-Fi",
    views: 98000,
    likes: 7200,
    chapters: 32,
    status: "Ongoing",
    rating: 4.6,
    description:
      "In a world where reality and virtual merge, a hacker uncovers a conspiracy.",
  },
  {
    id: "3",
    title: "Hearts in the Royal Court",
    author: "RomanceQueen",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    genre: "Romance",
    views: 156000,
    likes: 12000,
    chapters: 28,
    status: "Completed",
    rating: 4.9,
    description:
      "A forbidden love story between a princess and her mysterious guardian.",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredStories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredStories.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredStories.length) % featuredStories.length
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Stories Hero Carousel */}
      <section className="relative h-[70vh] overflow-hidden bg-gradient-to-r from-[#18243c] via-[#22325a] to-[#18243c]">
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Carousel Content */}
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Story Info */}
              <div className="text-white space-y-6">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-semibold">
                    Featured
                  </span>
                  <span className="text-yellow-300">
                    {featuredStories[currentSlide].genre}
                  </span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  {featuredStories[currentSlide].title}
                </h1>

                <p className="text-lg text-gray-200 leading-relaxed">
                  {featuredStories[currentSlide].description}
                </p>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>
                      {featuredStories[currentSlide].views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>
                      {featuredStories[currentSlide].likes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {featuredStories[currentSlide].chapters} chapters
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{featuredStories[currentSlide].rating}</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Link
                    href={`/stories/${featuredStories[currentSlide].id}`}
                    className="bg-white text-[#18243c] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Read Now</span>
                  </Link>
                  <Link
                    href="/stories"
                    className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#18243c] transition-colors"
                  >
                    Browse All
                  </Link>
                </div>
              </div>

              {/* Story Cover */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  <img
                    src={featuredStories[currentSlide].coverImage}
                    alt={featuredStories[currentSlide].title}
                    className="w-64 h-96 object-cover rounded-lg shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    {featuredStories[currentSlide].status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {featuredStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Genre Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore by Genre
            </h2>
            <p className="text-lg text-gray-600">
              Discover stories that match your interests
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <Link
              href="/stories?category=fantasy"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🧙‍♂️</div>
                <h3 className="font-semibold text-lg">Fantasy</h3>
                <p className="text-sm opacity-90">2.5k stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>

            <Link
              href="/stories?category=romance"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 to-red-500 p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">💕</div>
                <h3 className="font-semibold text-lg">Romance</h3>
                <p className="text-sm opacity-90">3.2k stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>

            <Link
              href="/stories?category=sci-fi"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-semibold text-lg">Sci-Fi</h3>
                <p className="text-sm opacity-90">1.8k stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>

            <Link
              href="/stories?category=mystery"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-semibold text-lg">Mystery</h3>
                <p className="text-sm opacity-90">1.2k stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>

            <Link
              href="/stories?category=adventure"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">⚔️</div>
                <h3 className="font-semibold text-lg">Adventure</h3>
                <p className="text-sm opacity-90">2.1k stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>

            <Link
              href="/stories?category=horror"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-black p-6 text-white hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">👻</div>
                <h3 className="font-semibold text-lg">Horror</h3>
                <p className="text-sm opacity-90">890 stories</p>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Stories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Trending Now
              </h2>
              <p className="text-lg text-gray-600">
                Most popular stories this week
              </p>
            </div>
            <Link
              href="/stories?sort=trending"
              className="text-[#18243c] hover:text-[#22325a] font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: "4",
                title: "The Last Dragon Keeper",
                author: "DragonMaster",
                coverImage:
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
                genre: "Fantasy",
                views: 89000,
                rating: 4.7,
                trend: "+15%",
              },
              {
                id: "5",
                title: "Neon Dreams",
                author: "CyberPunk",
                coverImage:
                  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop",
                genre: "Sci-Fi",
                views: 67000,
                rating: 4.5,
                trend: "+22%",
              },
              {
                id: "6",
                title: "Midnight Secrets",
                author: "MysteryWriter",
                coverImage:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
                genre: "Mystery",
                views: 54000,
                rating: 4.6,
                trend: "+18%",
              },
              {
                id: "7",
                title: "Love in Tokyo",
                author: "RomanceAuthor",
                coverImage:
                  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=400&fit=crop",
                genre: "Romance",
                views: 78000,
                rating: 4.8,
                trend: "+25%",
              },
            ].map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{story.trend}</span>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {story.genre}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    by {story.author}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{story.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>{story.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-[#18243c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Join Our Growing Community
            </h2>
            <p className="text-lg text-blue-200">
              Be part of the largest storytelling platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-200">Active Writers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2M+</div>
              <div className="text-blue-200">Stories Published</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15M+</div>
              <div className="text-blue-200">Monthly Readers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$500K+</div>
              <div className="text-blue-200">Earned by Authors</div>
            </div>
          </div>
        </div>
      </section>

      {/* New Releases */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                New Releases
              </h2>
              <p className="text-lg text-gray-600">
                Fresh stories from talented authors
              </p>
            </div>
            <Link
              href="/stories?sort=newest"
              className="text-[#18243c] hover:text-[#22325a] font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                id: "8",
                title: "Quantum Hearts",
                author: "SciFiRomance",
                coverImage:
                  "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop",
                genre: "Sci-Fi Romance",
                publishedAt: "2 days ago",
              },
              {
                id: "9",
                title: "The Shadow Guild",
                author: "DarkFantasy",
                coverImage:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
                genre: "Dark Fantasy",
                publishedAt: "1 day ago",
              },
              {
                id: "10",
                title: "Coffee Shop Chronicles",
                author: "SliceOfLife",
                coverImage:
                  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=400&fit=crop",
                genre: "Contemporary",
                publishedAt: "3 hours ago",
              },
              {
                id: "11",
                title: "Pirate Queen",
                author: "AdventureSeeker",
                coverImage:
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
                genre: "Historical Adventure",
                publishedAt: "5 hours ago",
              },
              {
                id: "12",
                title: "Digital Detox",
                author: "ModernLife",
                coverImage:
                  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop",
                genre: "Contemporary Fiction",
                publishedAt: "1 hour ago",
              },
            ].map((story) => (
              <div key={story.id} className="group cursor-pointer">
                <div className="relative mb-3">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                  />
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    NEW
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-[#18243c] transition-colors">
                  {story.title}
                </h3>
                <p className="text-gray-600 text-xs mb-1">by {story.author}</p>
                <p className="text-gray-500 text-xs">{story.genre}</p>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{story.publishedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Ranking */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Weekly Ranking</h2>
            <Link
              href="/stories?sort=weekly"
              className="text-[#18243c] hover:text-[#22325a] font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <div
              className="flex space-x-6 pb-4"
              style={{ width: "max-content" }}
            >
              {[
                {
                  id: "13",
                  title: "The Immortal Cultivator",
                  coverImage:
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
                  rank: 1,
                },
                {
                  id: "14",
                  title: "Space Odyssey Chronicles",
                  coverImage:
                    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=300&fit=crop",
                  rank: 2,
                },
                {
                  id: "15",
                  title: "Royal Academy Romance",
                  coverImage:
                    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=300&fit=crop",
                  rank: 3,
                },
                {
                  id: "16",
                  title: "Shadow Assassin Guild",
                  coverImage:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop",
                  rank: 4,
                },
                {
                  id: "17",
                  title: "Magic Academy Chronicles",
                  coverImage:
                    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
                  rank: 5,
                },
                {
                  id: "18",
                  title: "Cyber Punk Revolution",
                  coverImage:
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop",
                  rank: 6,
                },
              ].map((book) => (
                <Link
                  key={book.id}
                  href={`/stories/${book.id}`}
                  className="group flex-shrink-0"
                >
                  <div className="relative w-40">
                    <div className="relative mb-3">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                      />
                      <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        #{book.rank}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-center line-clamp-2 group-hover:text-[#18243c] transition-colors">
                      {book.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Recommended for You
            </h2>
            <Link
              href="/stories?sort=recommended"
              className="text-[#18243c] hover:text-[#22325a] font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <div
              className="flex space-x-6 pb-4"
              style={{ width: "max-content" }}
            >
              {[
                {
                  id: "19",
                  title: "Dragon Emperor Legacy",
                  coverImage:
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
                },
                {
                  id: "20",
                  title: "Stellar Wars Saga",
                  coverImage:
                    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=300&fit=crop",
                },
                {
                  id: "21",
                  title: "Forbidden Love Story",
                  coverImage:
                    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=300&fit=crop",
                },
                {
                  id: "22",
                  title: "Dark Magic Chronicles",
                  coverImage:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop",
                },
                {
                  id: "23",
                  title: "Virtual Reality Quest",
                  coverImage:
                    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
                },
                {
                  id: "24",
                  title: "Time Travel Adventure",
                  coverImage:
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop",
                },
              ].map((book) => (
                <Link
                  key={book.id}
                  href={`/stories/${book.id}`}
                  className="group flex-shrink-0"
                >
                  <div className="w-40">
                    <div className="relative mb-3">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                      />
                    </div>
                    <h3 className="font-semibold text-sm text-center line-clamp-2 group-hover:text-[#18243c] transition-colors">
                      {book.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-[#18243c] to-[#22325a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Share Your Story?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of writers who are already earning from their
            passion. Start your journey today and connect with readers
            worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#18243c] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Start Writing Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/stories"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#18243c] transition-colors flex items-center justify-center space-x-2"
            >
              <BookOpen className="h-5 w-5" />
              <span>Explore Stories</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#18243c] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8" />
                <span className="text-2xl font-bold">NoManWeb</span>
              </div>
              <p className="text-blue-100 max-w-md">
                The premier platform for storytellers to share their creativity,
                build communities, and earn from their passion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-blue-100">
                <Link
                  href="/stories"
                  className="block hover:text-white transition-colors"
                >
                  Browse Stories
                </Link>
                <Link
                  href="/register"
                  className="block hover:text-white transition-colors"
                >
                  Start Writing
                </Link>
                <Link
                  href="/login"
                  className="block hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-blue-100">
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Community Guidelines
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-100">
            <p>&copy; 2024 NoManWeb. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
