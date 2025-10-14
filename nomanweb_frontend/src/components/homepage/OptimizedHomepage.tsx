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
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { homepageService, HomepageSections } from "../../services/homepageService";
import { Story } from "../../types/story";

// Memoized components for better performance
const MemoizedStoryCard = React.memo(({ story }: { story: Story }) => (
  <Link
    href={`/stories/${story.id}`}
    className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
  >
    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      {story.coverImageUrl ? (
        <img
          src={story.coverImageUrl}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
          {story.category?.name || "Story"}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {story.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {story.description}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>By {story.author?.displayName || story.author?.username}</span>
        <div className="flex items-center space-x-2">
          <span className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {story.viewCount || 0}
          </span>
          <span className="flex items-center">
            <Heart className="w-3 h-3 mr-1" />
            {story.likeCount || 0}
          </span>
        </div>
      </div>
    </div>
  </Link>
));

const MemoizedStorySection = React.memo(({ 
  title, 
  stories, 
  icon: Icon, 
  viewAllLink 
}: { 
  title: string; 
  stories: Story[]; 
  icon: any; 
  viewAllLink: string; 
}) => (
  <section className="mb-16">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-900 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <Link
        href={viewAllLink}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        View All
        <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {stories.slice(0, 6).map((story) => (
        <MemoizedStoryCard key={story.id} story={story} />
      ))}
    </div>
  </section>
));

export default function OptimizedHomepage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Optimized data fetching with React Query
  const { data: homepageData, isLoading, error } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: () => homepageService.getAllHomepageSections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Memoized carousel stories
  const carouselStories = useMemo(() => {
    return homepageData?.carousel?.content || [];
  }, [homepageData?.carousel?.content]);

  // Auto-advance carousel
  useEffect(() => {
    if (carouselStories.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselStories.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [carouselStories.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Hero skeleton */}
          <div className="relative h-96 bg-gray-200 rounded-2xl mb-16 animate-pulse" />
          
          {/* Sections skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-16">
              <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">We're having trouble loading the homepage content.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Carousel */}
      {carouselStories.length > 0 && (
        <section className="relative h-96 mb-16 overflow-hidden rounded-2xl mx-4 mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10" />
          
          {carouselStories.map((story, index) => (
            <div
              key={story.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {story.coverImageUrl ? (
                <img
                  src={story.coverImageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
            </div>
          ))}

          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  Featured Story
                </h1>
                <p className="text-xl text-gray-200 mb-2">
                  Discover amazing stories from our featured collection.
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                    {carouselStories[currentSlide]?.viewCount || 0} views
                  </span>
                  <span className="text-white text-2xl font-bold">
                    {(carouselStories[currentSlide]?.rating || 0).toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= (carouselStories[currentSlide]?.rating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Link
                  href={`/stories/${carouselStories[currentSlide]?.id}`}
                  className="inline-flex items-center bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Read Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Carousel controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex space-x-2">
              {carouselStories.map((_, index) => (
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
      )}

      <div className="container mx-auto px-4 pb-16">
        {/* Story Sections */}
        {homepageData?.weeklyFeatures?.content && (
          <MemoizedStorySection
            title="Weekly Featured"
            stories={homepageData.weeklyFeatures.content}
            icon={Crown}
            viewAllLink="/stories?filter=weekly-featured"
          />
        )}

        {homepageData?.newReleases?.content && (
          <MemoizedStorySection
            title="New Releases"
            stories={homepageData.newReleases.content}
            icon={Zap}
            viewAllLink="/stories?filter=new-releases"
          />
        )}

        {homepageData?.bestRating?.content && (
          <MemoizedStorySection
            title="Best Rating"
            stories={homepageData.bestRating.content}
            icon={Star}
            viewAllLink="/stories?filter=best-rating"
          />
        )}

        {homepageData?.bestOfAllTime?.content && (
          <MemoizedStorySection
            title="Best of All Time"
            stories={homepageData.bestOfAllTime.content}
            icon={Flame}
            viewAllLink="/stories?filter=best-of-all-time"
          />
        )}

        {homepageData?.recommended?.content && (
          <MemoizedStorySection
            title="Recommended for You"
            stories={homepageData.recommended.content}
            icon={TrendingUp}
            viewAllLink="/stories?filter=recommended"
          />
        )}

        {/* Genre Sections */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Books for Each Genre
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Explore our diverse collection of stories across different genres
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
              { name: "Fantasy", data: homepageData?.fantasy, color: "from-purple-500 to-pink-500" },
              { name: "Romance", data: homepageData?.romance, color: "from-red-500 to-pink-500" },
              { name: "Sci-Fi", data: homepageData?.scienceFiction, color: "from-blue-500 to-cyan-500" },
              { name: "Mystery", data: homepageData?.mystery, color: "from-gray-700 to-gray-900" },
              { name: "Adventure", data: homepageData?.adventure, color: "from-green-500 to-teal-500" },
              { name: "Horror", data: homepageData?.horror, color: "from-red-700 to-black" },
              { name: "Comedy", data: homepageData?.comedy, color: "from-yellow-400 to-orange-500" },
              { name: "Drama", data: homepageData?.drama, color: "from-indigo-500 to-purple-600" },
              { name: "Thriller", data: homepageData?.thriller, color: "from-gray-800 to-red-900" },
              { name: "Young Adult", data: homepageData?.youngAdult, color: "from-pink-400 to-purple-500" },
            ].map((genre) => (
              <Link
                key={genre.name}
                href={`/stories?genre=${genre.name.toLowerCase()}`}
                className="group relative h-48 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-90`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{genre.name}</h3>
                    <p className="text-sm opacity-90">
                      {genre.data?.totalElements || 0} stories
                    </p>
                  </div>
                  <div className="flex items-center text-sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}