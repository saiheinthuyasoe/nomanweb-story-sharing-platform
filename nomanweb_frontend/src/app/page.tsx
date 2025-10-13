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
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  // Featured stories now come from API data (carousel)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) =>
          (prev + 1) %
          Math.max((homepageData?.carousel?.content || []).length, 1)
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev + 1) % Math.max((homepageData?.carousel?.content || []).length, 1)
    );
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev -
          1 +
          Math.max((homepageData?.carousel?.content || []).length, 1)) %
        Math.max((homepageData?.carousel?.content || []).length, 1)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Carousel at Top */}
      <section className="relative bg-white py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <div className="relative bg-gray-50 overflow-hidden rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Story Cover */}
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-80 flex items-center justify-center p-4 sm:p-6">
                  <div className="w-32 sm:w-40 md:w-48 lg:w-56">
                    <img
                      src={
                        (homepageData?.carousel?.content || [])[currentSlide]
                          ?.coverImageUrl ||
                        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop"
                      }
                      alt={
                        (homepageData?.carousel?.content || [])[currentSlide]
                          ?.title || "Featured Story"
                      }
                      className="w-full aspect-[3/4] object-cover shadow-lg rounded"
                    />
                  </div>
                </div>

                {/* Story Info */}
                <div className="lg:col-span-2 p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                      {(homepageData?.carousel?.content || [])[currentSlide]
                        ?.title || "Featured Story"}
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                      {(homepageData?.carousel?.content || [])[currentSlide]
                        ?.description ||
                        "Discover amazing stories from our featured collection."}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 sm:space-x-6 text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">
                        {(
                          (homepageData?.carousel?.content || [])[currentSlide]
                            ?.totalViews || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      <span className="text-xs sm:text-sm">
                        {(
                          (((homepageData?.carousel?.content || [])[
                            currentSlide
                          ]?.totalLikes || 0) /
                            Math.max(
                              (homepageData?.carousel?.content || [])[
                                currentSlide
                              ]?.totalViews || 1,
                              1
                            )) *
                          5
                        ).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/stories/${
                        (homepageData?.carousel?.content || [])[currentSlide]
                          ?.id || "#"
                      }`}
                      className="bg-gray-900 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-800 transition-colors inline-flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <span>Read Now</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-1.5 rounded-full shadow transition-colors z-10 touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-1.5 rounded-full shadow transition-colors z-10 touch-manipulation"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-3 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-1">
                {(homepageData?.carousel?.content || []).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-colors touch-manipulation ${
                      index === currentSlide ? "bg-gray-900" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-8 sm:py-10 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">Genre</h2>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start md:flex-nowrap md:overflow-x-auto md:scrollbar-hide">
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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              ADVENTURE
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("comedy-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              COMEDY
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("drama-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              DRAMA
            </button>

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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              FANTASY
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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              HORROR
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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              MYSTERY
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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              ROMANCE
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
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              SCIENCE FICTION
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("thriller-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              THRILLER
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("young-adult-section");
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.pageYOffset +
                    yOffset;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="px-3 sm:px-4 py-2 sm:py-1 text-white text-xs sm:text-sm font-medium rounded-full hover:opacity-90 transition-all cursor-pointer touch-manipulation"
              style={{ backgroundColor: "#18243c" }}
            >
              YOUNG ADULT
            </button>
          </div>
        </div>
      </section>

      {/* Weekly Features */}
      <section className="py-8 sm:py-10 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">
              Weekly Featured
            </h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                  <div className="px-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
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
                .slice(0, 8)
                .map((story: any) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group block hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative">
                      <img
                        src={story.coverImageUrl || story.coverImage}
                        alt={story.title}
                        className="w-full aspect-[3/4] object-cover shadow-sm"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                        {story.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {story.author?.displayName ||
                          story.author?.username ||
                          story.author}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {story.category?.name || story.category || "Fantasy"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section className="py-8 sm:py-10 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">
              New Releases
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                  <div className="px-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {(homepageData?.newReleases?.content || [])
                .slice(0, 8)
                .map((story: Story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group block hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative">
                      <img
                        src={
                          story.coverImageUrl ||
                          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop"
                        }
                        alt={story.title}
                        className="w-full aspect-[3/4] object-cover shadow-sm"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                        {story.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {story.author.displayName || story.author.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {story.category?.name || story.category || "New"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Rating */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
              Best Rating
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                  <div className="px-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {(homepageData?.bestRating?.content || [])
                .slice(0, 8)
                .map((story: Story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group block hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative">
                      <img
                        src={
                          story.coverImageUrl ||
                          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"
                        }
                        alt={story.title}
                        className="w-full aspect-[3/4] object-cover shadow-sm"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                        {story.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {story.author?.displayName || story.author?.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {story.category?.name || "Fantasy"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Best of All Time */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
              Best of All Time
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                  <div className="px-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {(homepageData?.bestOfAllTime?.content || [])
                .slice(0, 8)
                .map((story: Story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group block hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative">
                      <img
                        src={
                          story.coverImageUrl ||
                          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"
                        }
                        alt={story.title}
                        className="w-full aspect-[3/4] object-cover shadow-sm"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                        {story.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {story.author?.displayName || story.author?.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {story.category?.name || "Fantasy"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center sm:text-left">
              Recommended for You
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {(homepageData?.recommended?.content || [])
                .slice(0, 8)
                .map((book: Story) => (
                  <Link
                    key={book.id}
                    href={`/stories/${book.id}`}
                    className="group block hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative">
                      <img
                        src={
                          book.coverImageUrl ||
                          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop"
                        }
                        alt={book.title}
                        className="w-full aspect-[3/4] object-cover shadow-sm"
                      />
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {book.author?.displayName || book.author?.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {book.category?.name || "Romance"}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Books by Genre */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Books for Each Genre
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Explore our diverse collection of stories across different genres
            </p>
          </div>

          {/* Fantasy Genre */}
          <div id="fantasy-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Fantasy</h3>
              </div>
              <Link
                href="/stories?category=fantasy"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.fantasy?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Fantasy</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Romance Genre */}
          <div id="romance-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Romance</h3>
              </div>
              <Link
                href="/stories?category=romance"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.romance?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Romance</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sci-Fi Genre */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="sci-fi-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Sci-Fi</h3>
              </div>
              <Link
                href="/stories?category=sci-fi"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.scienceFiction?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Sci-Fi</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Weekly Features */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="mystery-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Mystery</h3>
              </div>
              <Link
                href="/stories?category=mystery"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.mystery?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Mystery</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Adventure Genre */}
          <div id="adventure-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Adventure</h3>
              </div>
              <Link
                href="/stories?category=adventure"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.adventure?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Adventure</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Horror Genre */}
          <div id="horror-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Horror</h3>
              </div>
              <Link
                href="/stories?category=horror"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.horror?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Horror</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Comedy Genre */}
          <div id="comedy-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Comedy</h3>
              </div>
              <Link
                href="/stories?category=comedy"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.comedy?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Comedy</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Drama Genre */}
          <div id="drama-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Drama</h3>
              </div>
              <Link
                href="/stories?category=drama"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.drama?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Drama</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Thriller Genre */}
          <div id="thriller-section" className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Thriller</h3>
              </div>
              <Link
                href="/stories?category=thriller"
                className="text-sm sm:text-base text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {(homepageData?.thriller?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group block hover:scale-105 transition-transform duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover shadow-sm"
                        />
                      </div>
                      <div className="mt-2 px-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {book.author?.displayName || book.author?.username}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Thriller</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Young Adult Genre */}
          <div id="young-adult-section" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Young Adult</h3>
              </div>
              <Link
                href="/stories?category=young-adult"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white overflow-hidden"
                  >
                    <div className="bg-gray-200 w-full aspect-[3/4] mb-2"></div>
                    <div className="px-1">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {(homepageData?.youngAdult?.content || [])
                  .slice(0, 8)
                  .map((book: Story) => (
                    <Link
                      key={book.id}
                      href={`/stories/${book.id}`}
                      className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="relative">
                        <img
                          src={
                            book.coverImageUrl ||
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop"
                          }
                          alt={book.title}
                          className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1">
                          by {book.author.displayName || book.author.username}
                        </p>
                        <p className="text-xs text-gray-500">Young Adult</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              &copy; 2025 NoManWeb. All rights reserved. Made with ❤️ for book
              lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
