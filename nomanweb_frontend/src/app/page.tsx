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
  Search,
  Filter,
  Flame,
  Crown,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { homepageService, HomepageSections } from "../services/homepageService";
import { Story } from "../types/story";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homepageData, setHomepageData] = useState<HomepageSections | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch homepage data on component mount
  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);
        const data = await homepageService.getAllHomepageSections();
        setHomepageData(data);
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
        setError("Failed to load homepage content");
        // Fallback to mock data
        const mockData = await homepageService.getMockHomepageData();
        setHomepageData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  // Featured stories now come from API data (weeklyFeatures)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max((homepageData?.weeklyFeatures?.content || []).length, 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max((homepageData?.weeklyFeatures?.content || []).length, 1));
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + Math.max((homepageData?.weeklyFeatures?.content || []).length, 1)) % Math.max((homepageData?.weeklyFeatures?.content || []).length, 1)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Carousel at Top */}
      <section className="relative bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative">
            <div className="relative bg-gray-50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Story Cover */}
                <div className="relative h-96 lg:h-80">
                  <img
                    src={(homepageData?.weeklyFeatures?.content || [])[currentSlide]?.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop"}
                    alt={(homepageData?.weeklyFeatures?.content || [])[currentSlide]?.title || "Featured Story"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Story Info */}
                <div className="lg:col-span-2 p-8 flex flex-col justify-center">
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">
                      {(homepageData?.weeklyFeatures?.content || [])[currentSlide]?.title || "Featured Story"}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {(homepageData?.weeklyFeatures?.content || [])[currentSlide]?.description || "Discover amazing stories from our featured collection."}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-base text-gray-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>
                        {((homepageData?.weeklyFeatures?.content || [])[currentSlide]?.totalViews || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span>{(((homepageData?.weeklyFeatures?.content || [])[currentSlide]?.totalLikes || 0) / Math.max(((homepageData?.weeklyFeatures?.content || [])[currentSlide]?.totalViews || 1), 1) * 5).toFixed(1)}</span>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/stories/${(homepageData?.weeklyFeatures?.content || [])[currentSlide]?.id || '#'}`}
                      className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
                    >
                      <span>Read Now</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {(homepageData?.weeklyFeatures?.content || []).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? "bg-gray-900" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genre Navigation */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Explore by Genre
            </h2>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <button
              onClick={() => {
                const element = document.getElementById("fantasy-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">🧙‍♂️</div>
              <h3 className="font-medium text-gray-900 text-sm">Fantasy</h3>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("romance-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">💕</div>
              <h3 className="font-medium text-gray-900 text-sm">Romance</h3>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("sci-fi-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-medium text-gray-900 text-sm">Sci-Fi</h3>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("mystery-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-medium text-gray-900 text-sm">Mystery</h3>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("adventure-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">⚔️</div>
              <h3 className="font-medium text-gray-900 text-sm">Adventure</h3>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("horror-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">👻</div>
              <h3 className="font-medium text-gray-900 text-sm">Horror</h3>
            </button>
          </div>
        </div>
      </section>

      {/* Weekly Features */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Flame className="h-7 w-7 text-orange-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                Weekly Features
              </h2>
              <Flame className="h-7 w-7 text-orange-500 ml-3" />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              Handpicked stories that are trending this week
            </p>
            <Link
              href="/stories?featured=weekly"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>VIEW ALL FEATURED</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl p-4 shadow-lg"
                >
                  <div className="flex space-x-4">
                    <div className="bg-gray-200 w-20 h-28 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(
                homepageData?.weeklyFeatures?.content || [
                  {
                    id: "1",
                    title: "My girlfriend is a Devil",
                    author: { username: "fec.quangvu" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
                    totalLikes: 850,
                    totalViews: 3100,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "2",
                    title: "Into the Darkness",
                    author: { username: "Jason Boyce" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=300&fit=crop",
                    totalLikes: 750,
                    totalViews: 2500,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "3",
                    title: "SHADOW AND LIGHT (CHIAROSCURO)",
                    author: { username: "Prince Firelorn" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=200&h=300&fit=crop",
                    totalLikes: 1180,
                    totalViews: 5900,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "4",
                    title: "Love In The Time Of Outbreak",
                    author: { username: "MissTerious" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1586013289902-a341e30fac6a?w=200&h=300&fit=crop",
                    totalLikes: 648,
                    totalViews: 3600,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "5",
                    title: "The Age Of The Dead",
                    author: { username: "Enermax" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1484411993299-85da9931a5b5?w=200&h=300&fit=crop",
                    totalLikes: 944,
                    totalViews: 5900,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "6",
                    title: "The Serial Killer: A headache for the police",
                    author: { username: "Jejewiyyah" },
                    coverImageUrl:
                      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop",
                    totalLikes: 450,
                    totalViews: 2500,
                    createdAt: new Date().toISOString(),
                  },
                ]
              )
                .slice(0, 6)
                .map((story: any) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 border border-blue-100"
                  >
                    <div className="flex space-x-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={story.coverImageUrl || story.coverImage}
                          alt={story.title}
                          className="w-20 h-28 object-cover rounded-lg shadow-md border border-gray-200 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                          <Flame className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 font-medium">
                          by{" "}
                          {story.author?.displayName ||
                            story.author?.username ||
                            story.author}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>
                              {story.totalLikes && story.totalViews
                                ? (
                                    (story.totalLikes /
                                      Math.max(story.totalViews, 1)) *
                                    5
                                  ).toFixed(1)
                                : story.rating || "4.8"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>
                              {story.totalViews
                                ? story.totalViews > 1000
                                  ? `${(story.totalViews / 1000).toFixed(1)}K`
                                  : story.totalViews
                                : story.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-green-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">New Releases</h2>
              <Zap className="h-7 w-7 text-green-500 ml-3" />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              Fresh stories just published by our talented authors
            </p>
            <Link
              href="/stories?sort=newest"
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
            >
              <span>VIEW ALL NEW RELEASES</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl shadow-lg p-4"
                >
                  <div className="bg-gray-200 w-full h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {(homepageData?.newReleases?.content || [])
                .slice(0, 5)
                .map((story: Story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100"
                  >
                    <div className="relative">
                      <img
                        src={story.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"}
                        alt={story.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Zap className="h-3 w-3" />
                        <span>NEW</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        by {story.author.displayName || story.author.username}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(story.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>
                            {story.totalViews > 1000
                              ? `${(story.totalViews / 1000).toFixed(1)}K`
                              : story.totalViews || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Weekly Ranking */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Star className="h-7 w-7 text-blue-500 mr-3 fill-current" />
              <h2 className="text-3xl font-bold text-gray-900">Best Rating</h2>
              <Star className="h-7 w-7 text-blue-500 ml-3 fill-current" />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              Top-rated stories loved by our community
            </p>
            <Link
              href="/stories?sort=rating"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>VIEW ALL TOP RATED</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="space-y-0">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-4 space-x-4 border-b border-gray-100 last:border-b-0 animate-pulse"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="space-y-0">
                {(homepageData?.bestRating?.content || [])
                  .slice(0, 6)
                  .map((story: Story, index: number) => (
                    <Link
                      key={story.id}
                      href={`/stories/${story.id}`}
                      className="group block hover:bg-blue-50 transition-all duration-300 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center p-5 space-x-4">
                        {/* Rank Number */}
                        <div className="flex-shrink-0 w-10 text-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                        </div>

                        {/* Book Cover */}
                        <div className="flex-shrink-0 relative">
                          <img
                            src={
                              story.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"
                            }
                            alt={story.title}
                            className="w-16 h-20 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                                {story.title}
                              </h3>
                              <p className="text-gray-600 font-medium mb-1">
                                by{" "}
                                {story.author.displayName ||
                                  story.author.username}
                              </p>
                              <div className="flex items-center space-x-3 text-sm">
                                <span className="text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full text-xs">
                                  {story.category?.name || "Uncategorized"}
                                </span>
                                <div className="flex items-center text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="text-xs">
                                    {new Date(
                                      story.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex-shrink-0 text-right">
                              <div className="flex items-center space-x-1 text-yellow-500 mb-2">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-lg font-bold">
                                  {(
                                    (story.totalLikes /
                                      Math.max(story.totalViews, 1)) *
                                    5
                                  ).toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-500 mb-2">
                                <Eye className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {story.totalViews > 1000
                                    ? `${(story.totalViews / 1000).toFixed(1)}K`
                                    : story.totalViews}{" "}
                                  views
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Heart className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {story.totalLikes > 1000
                                    ? `${(story.totalLikes / 1000).toFixed(1)}K`
                                    : story.totalLikes}{" "}
                                  likes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Best of All Time */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                Best of All Time
              </h2>
              <Crown className="h-8 w-8 text-amber-500 ml-3" />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover the most beloved stories that have captivated readers
              across generations
            </p>
            <div className="flex justify-center mt-4">
              <Link
                href="/stories?sort=all-time-best"
                className="text-amber-600 hover:text-amber-700 font-medium flex items-center space-x-1"
              >
                <span>VIEW ALL CLASSICS</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 w-full h-64 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(homepageData?.bestOfAllTime?.content || [])
                .slice(0, 6)
                .map((story: Story, index: number) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100"
                  >
                    <div className="relative">
                      <img
                        src={story.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop"}
                        alt={story.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Crown className="h-4 w-4" />
                        <span>#{index + 1}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        <span>
                          {(
                            (story.totalLikes / Math.max(story.totalViews, 1)) *
                            5
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-gray-600 font-medium mb-3">
                        by {story.author.displayName || story.author.username}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>
                              {story.totalViews > 1000000
                                ? `${(story.totalViews / 1000000).toFixed(1)}M`
                                : story.totalViews > 1000
                                ? `${(story.totalViews / 1000).toFixed(1)}K`
                                : story.totalViews}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>
                              {story.totalLikes > 1000
                                ? `${(story.totalLikes / 1000).toFixed(1)}K`
                                : story.totalLikes}
                            </span>
                          </div>
                        </div>
                        <span className="text-amber-600 font-medium">
                          {story.category?.name || "Classic"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-7 w-7 text-purple-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                Recommended for You
              </h2>
              <Heart className="h-7 w-7 text-purple-500 ml-3" />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              Personalized picks based on your reading preferences
            </p>
            <Link
              href="/stories?sort=recommended"
              className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <span>VIEW ALL RECOMMENDATIONS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl shadow-lg p-4"
                >
                  <div className="bg-gray-200 w-full h-40 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {(homepageData?.recommended?.content || [])
                .slice(0, 6)
                .map((book: Story) => (
                  <Link
                    key={book.id}
                    href={`/stories/${book.id}`}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100"
                  >
                    <div className="relative">
                      <img
                        src={book.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"}
                        alt={book.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>FOR YOU</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        by {book.author.displayName || book.author.username}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>
                            {book.totalLikes && book.totalViews
                              ? (
                                  (book.totalLikes / book.totalViews) *
                                  5
                                ).toFixed(1)
                              : "4.5"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>
                            {book.totalViews > 1000
                              ? `${(book.totalViews / 1000).toFixed(1)}K`
                              : book.totalViews || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Books by Genre */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Books for Each Genre
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Explore our diverse collection of stories across different genres
            </p>
          </div>

          {/* Fantasy Genre */}
          <div
            id="fantasy-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-purple-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">✨</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Fantasy</h3>
                  <p className="text-gray-600 text-sm">
                    Magical worlds and epic adventures
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=fantasy"
                className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Fantasy</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-50 rounded-xl p-4"
                  >
                    <div className="bg-gray-200 w-full h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {(homepageData?.weeklyFeatures?.content || [])
                  .slice(0, 6)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100"
                    >
                      <div className="relative">
                        <img
                          src={book.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"}
                          alt={book.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          ✨
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                          by {book.author.displayName || book.author.username}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>
                              {(
                                (book.totalLikes /
                                  Math.max(book.totalViews, 1)) *
                                5
                              ).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>
                              {book.totalViews > 1000
                                ? `${(book.totalViews / 1000).toFixed(1)}K`
                                : book.totalViews}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Romance Genre */}
          <div
            id="romance-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-pink-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💕</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Romance</h3>
                  <p className="text-gray-600 text-sm">
                    Love stories and heartfelt connections
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=romance"
                className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-medium bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Romance</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                {
                  title: "Hearts Entwined",
                  author: "Isabella Rose",
                  rating: "9.4",
                  views: "245K",
                  img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop",
                },
                {
                  title: "Summer Love",
                  author: "Emma Grace",
                  rating: "8.9",
                  views: "189K",
                  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop",
                },
                {
                  title: "Midnight Kiss",
                  author: "Sophia Heart",
                  rating: "9.2",
                  views: "312K",
                  img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop",
                },
                {
                  title: "Love's Promise",
                  author: "Victoria Sweet",
                  rating: "8.7",
                  views: "156K",
                  img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop",
                },
                {
                  title: "Eternal Flame",
                  author: "Lily Passion",
                  rating: "9.0",
                  views: "278K",
                  img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop",
                },
                {
                  title: "Destined Hearts",
                  author: "Rose Valentine",
                  rating: "8.8",
                  views: "201K",
                  img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop",
                },
              ].map((book, i) => (
                <Link
                  key={i}
                  href={`/stories/romance-${i + 1}`}
                  className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-pink-100"
                >
                  <div className="relative">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      💕
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      by{" "}
                      {book.author?.displayName ||
                        book.author?.username ||
                        book.author}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{book.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{book.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sci-Fi Genre */}
          <div
            id="sci-fi-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-blue-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🚀</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Sci-Fi</h3>
                  <p className="text-gray-600 text-sm">
                    Futuristic worlds and space adventures
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=sci-fi"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Sci-Fi</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                {
                  title: "Galactic Empire",
                  author: "Dr. Alex Nova",
                  rating: "9.3",
                  views: "198K",
                  img: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=280&fit=crop",
                },
                {
                  title: "Time Paradox",
                  author: "Sarah Quantum",
                  rating: "8.8",
                  views: "142K",
                  img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=280&fit=crop",
                },
                {
                  title: "Neural Network",
                  author: "Marcus Cyber",
                  rating: "9.1",
                  views: "267K",
                  img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=280&fit=crop",
                },
                {
                  title: "Mars Colony",
                  author: "Luna Starship",
                  rating: "8.9",
                  views: "183K",
                  img: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=280&fit=crop",
                },
                {
                  title: "Quantum Leap",
                  author: "Tesla Future",
                  rating: "9.0",
                  views: "221K",
                  img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&h=280&fit=crop",
                },
                {
                  title: "Space Odyssey",
                  author: "Orion Clarke",
                  rating: "8.7",
                  views: "156K",
                  img: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=280&fit=crop",
                },
              ].map((book, i) => (
                <Link
                  key={i}
                  href={`/stories/sci-fi-${i + 1}`}
                  className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100"
                >
                  <div className="relative">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      🚀
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      by{" "}
                      {book.author?.displayName ||
                        book.author?.username ||
                        book.author}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{book.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{book.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mystery Genre */}
          <div
            id="mystery-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🔍</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Mystery</h3>
                  <p className="text-gray-600 text-sm">
                    Thrilling puzzles and suspenseful tales
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=mystery"
                className="inline-flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Mystery</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-50 rounded-xl p-4"
                  >
                    <div className="bg-gray-200 w-full h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {(homepageData?.bestRating?.content || [])
                  .slice(0, 6)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                    >
                      <div className="relative">
                        <img
                          src={book.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"}
                          alt={book.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-bold">
                          🔍
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                          by {book.author.displayName || book.author.username}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>
                              {(
                                (book.totalLikes /
                                  Math.max(book.totalViews, 1)) *
                                5
                              ).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>
                              {book.totalViews > 1000
                                ? `${(book.totalViews / 1000).toFixed(1)}K`
                                : book.totalViews}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Adventure Genre */}
          <div
            id="adventure-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-green-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚔️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Adventure
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Epic quests and thrilling journeys
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=adventure"
                className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Adventure</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-50 rounded-xl p-4"
                  >
                    <div className="bg-gray-200 w-full h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {(homepageData?.newReleases?.content || [])
                  .slice(0, 6)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100"
                    >
                      <div className="relative">
                        <img
                          src={book.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"}
                          alt={book.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          ⚔️
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                          by {book.author.displayName || book.author.username}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>
                              {(
                                (book.totalLikes /
                                  Math.max(book.totalViews, 1)) *
                                5
                              ).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>
                              {book.totalViews > 1000
                                ? `${(book.totalViews / 1000).toFixed(1)}K`
                                : book.totalViews}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Horror Genre */}
          <div
            id="horror-section"
            className="mb-16 bg-white rounded-2xl shadow-lg p-8 border border-red-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👻</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Horror</h3>
                  <p className="text-gray-600 text-sm">
                    Spine-chilling tales and dark mysteries
                  </p>
                </div>
              </div>
              <Link
                href="/stories?category=horror"
                className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
              >
                <span>View All Horror</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-50 rounded-xl p-4"
                  >
                    <div className="bg-gray-200 w-full h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {(homepageData?.recommended?.content || [])
                  .slice(0, 6)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-red-100"
                    >
                      <div className="relative">
                        <img
                          src={book.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"}
                          alt={book.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          👻
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                          by {book.author.displayName || book.author.username}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>
                              {(
                                (book.totalLikes /
                                  Math.max(book.totalViews, 1)) *
                                5
                              ).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>
                              {book.totalViews > 1000
                                ? `${(book.totalViews / 1000).toFixed(1)}K`
                                : book.totalViews}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <BookOpen className="h-8 w-8" />
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  NoManWeb
                </span>
              </div>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed max-w-md">
                The premier platform for storytellers to share their creativity,
                build communities, and earn from their passion. Join our
                community of passionate storytellers.
              </p>
              <div className="flex space-x-6">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors text-lg font-medium"
                >
                  Facebook
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors text-lg font-medium"
                >
                  Twitter
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors text-lg font-medium"
                >
                  Instagram
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xl text-white">Platform</h4>
              <div className="space-y-3 text-gray-300">
                <Link
                  href="/stories"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Browse Stories
                </Link>
                <Link
                  href="/register"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Start Writing
                </Link>
                <Link
                  href="/login"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xl text-white">Support</h4>
              <div className="space-y-3 text-gray-300">
                <Link
                  href="#"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Help Center
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Community Guidelines
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors text-lg"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              &copy; 2024 NoManWeb. All rights reserved. Made with ❤️ for book
              lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
