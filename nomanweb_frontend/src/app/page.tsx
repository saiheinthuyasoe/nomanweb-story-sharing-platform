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
                    src={featuredStories[currentSlide].coverImage}
                    alt={featuredStories[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Story Info */}
                <div className="lg:col-span-2 p-8 flex flex-col justify-center">
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">
                      {featuredStories[currentSlide].title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {featuredStories[currentSlide].description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-base text-gray-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>{featuredStories[currentSlide].views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span>{featuredStories[currentSlide].rating}</span>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/stories/${featuredStories[currentSlide].id}`}
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
                {featuredStories.map((_, index) => (
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
                 const element = document.getElementById('fantasy-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
                 }
               }}
               className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
             >
               <div className="text-2xl mb-2">🧙‍♂️</div>
               <h3 className="font-medium text-gray-900 text-sm">Fantasy</h3>
             </button>

             <button
               onClick={() => {
                 const element = document.getElementById('romance-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
                 }
               }}
               className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
             >
               <div className="text-2xl mb-2">💕</div>
               <h3 className="font-medium text-gray-900 text-sm">Romance</h3>
             </button>

             <button
               onClick={() => {
                 const element = document.getElementById('sci-fi-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
                 }
               }}
               className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
             >
               <div className="text-2xl mb-2">🚀</div>
               <h3 className="font-medium text-gray-900 text-sm">Sci-Fi</h3>
             </button>

             <button
               onClick={() => {
                 const element = document.getElementById('mystery-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
                 }
               }}
               className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
             >
               <div className="text-2xl mb-2">🔍</div>
               <h3 className="font-medium text-gray-900 text-sm">Mystery</h3>
             </button>

             <button
               onClick={() => {
                 const element = document.getElementById('adventure-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
                 }
               }}
               className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
             >
               <div className="text-2xl mb-2">⚔️</div>
               <h3 className="font-medium text-gray-900 text-sm">Adventure</h3>
             </button>

             <button
               onClick={() => {
                 const element = document.getElementById('horror-section');
                 if (element) {
                   const yOffset = -100;
                   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                   window.scrollTo({ top: y, behavior: 'smooth' });
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
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-gray-900">Weekly Features</h2>
            <Link href="/stories?featured=weekly" className="text-gray-600 hover:text-gray-900 text-sm">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: "1",
                title: "My girlfriend is a Devil",
                author: "fec.quangvu",
                coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
                rating: 10,
                views: "3.1K"
              },
              {
                id: "2",
                title: "Into the Darkness",
                author: "Jason Boyce",
                coverImage: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=300&fit=crop",
                rating: 10,
                views: "2.5K"
              },
              {
                id: "3",
                title: "SHADOW AND LIGHT (CHIAROSCURO)",
                author: "Prince Firelorn",
                coverImage: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=200&h=300&fit=crop",
                rating: 10,
                views: "5.9K"
              },
              {
                id: "4",
                title: "Love In The Time Of Outbreak",
                author: "MissTerious",
                coverImage: "https://images.unsplash.com/photo-1586013289902-a341e30fac6a?w=200&h=300&fit=crop",
                rating: 9,
                views: "3.6K"
              },
              {
                id: "5",
                title: "The Age Of The Dead",
                author: "Enermax",
                coverImage: "https://images.unsplash.com/photo-1484411993299-85da9931a5b5?w=200&h=300&fit=crop",
                rating: 8,
                views: "5.9K"
              },
              {
                id: "6",
                title: "The Serial Killer: A headache for the police",
                author: "Jejewiyyah",
                coverImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop",
                rating: 9,
                views: "2.5K"
              }
            ].map(story => (
              <div key={story.id} className="flex space-x-3">
                <img src={story.coverImage} alt={story.title} className="w-16 h-24 object-cover rounded-lg shadow-md border border-gray-200"/>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{story.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{story.author}</p>
                  <div className="flex items-center text-xs text-gray-400 space-x-3">
                    <span>★ {story.rating}</span>
                    <span>{story.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>




      {/* New Releases */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-gray-900">
              New Releases
            </h2>
            <Link
              href="/stories?sort=newest"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                id: "8",
                title: "Quantum Hearts",
                author: "SciFiRomance",
                coverImage:
                  "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=300&h=400&fit=crop",
                publishedAt: "2 days ago",
              },
              {
                id: "9",
                title: "The Shadow Guild",
                author: "DarkFantasy",
                coverImage:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
                publishedAt: "1 day ago",
              },
              {
                id: "10",
                title: "Coffee Shop Chronicles",
                author: "SliceOfLife",
                coverImage:
                  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=400&fit=crop",
                publishedAt: "3 hours ago",
              },
              {
                id: "11",
                title: "Pirate Queen",
                author: "AdventureSeeker",
                coverImage:
                  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
                publishedAt: "5 hours ago",
              },
              {
                id: "12",
                title: "Digital Detox",
                author: "ModernLife",
                coverImage:
                  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop",
                publishedAt: "1 hour ago",
              },
            ].map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group"
              >
                <div className="mb-3">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-40 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {story.title}
                </h3>
                <p className="text-xs text-gray-500 mb-1">
                  {story.author}
                </p>
                <p className="text-xs text-gray-400">{story.publishedAt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Ranking */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Best Rating
              </h2>
              <div className="flex justify-center">
                <Link
                  href="/stories?sort=rating"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                <span>MORE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="space-y-0">
              {[
                {
                  id: "13",
                  title: "My girlfriend is a Devil",
                  author: "Ace gaming",
                  coverImage:
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
                  rank: 1,
                  views: "3.1K Views",
                  rating: 4.9,
                  description: "Peter Kent's girlfriend was murdered by a serial killer. Loved one has no...",
                  badge: "M",
                  badgeColor: "bg-red-600"
                },
                {
                  id: "14",
                  title: "Into the Darkness",
                  author: "James Boyce",
                  coverImage:
                    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=300&fit=crop",
                  rank: 2,
                  views: "2.5K Views",
                  rating: 4.7,
                  description: "The saying is 'Out of the darkness and into the light', at least that is lo...",
                  badge: "M",
                  badgeColor: "bg-gray-600"
                },
                {
                  id: "15",
                  title: "SHADOW AND LIGHT (CHIAROSCURO)",
                  author: "Prince Firedra",
                  coverImage:
                    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=300&fit=crop",
                  rank: 3,
                  views: "5.3K Views",
                  rating: 4.8,
                  description: "This is a story of betrayal, revenge and most of all, mystery. For the...",
                  badge: "M",
                  badgeColor: "bg-blue-600"
                },
                {
                  id: "16",
                  title: "Love In The Time Of Outbreak",
                  author: "Miss Fortress",
                  coverImage:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop",
                  rank: 4,
                  views: "3.6K Views",
                  rating: 4.6,
                  description: "Unless they can stop the deadly virus from spreading, the world will...",
                  badge: "M",
                  badgeColor: "bg-purple-600"
                },
                {
                  id: "17",
                  title: "The Age Of The Dead",
                  author: "Eaerness",
                  coverImage:
                    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
                  rank: 5,
                  views: "5.9K Views",
                  rating: 4.5,
                  description: "It was a day like any other in the City of Sunrock when children at school...",
                  badge: "M",
                  badgeColor: "bg-red-700"
                },
                {
                  id: "18",
                  title: "The Serial Killer: A headache for the police",
                  author: "Rajneesh",
                  coverImage:
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=300&fit=crop",
                  rank: 6,
                  views: "2.5K Views",
                  rating: 4.4,
                  description: "Enter the gripping chaos of Rewa as a mysterious killer strikes, targeting...",
                  badge: "M",
                  badgeColor: "bg-gray-700"
                }
              ].map((story, index) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center p-4 space-x-4">
                    {/* Rank Number */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-lg font-bold text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Book Cover */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-16 h-20 object-cover rounded-lg shadow-sm"
                      />
                      <div className={`absolute -top-1 -left-1 w-6 h-6 ${story.badgeColor} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                        {story.badge}
                      </div>
                    </div>
                    
                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {story.title}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {story.author}
                          </p>
                          <p className="text-gray-500 text-sm">{story.genre}</p>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{story.publishedAt}</span>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-medium">{story.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs">{story.views}</span>
                          </div>
                          <button className="mt-2 text-blue-600 hover:text-blue-700 text-xs font-medium">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recommended for You
            </h2>
            <Link
              href="/stories?sort=recommended"
              className="text-gray-600 hover:text-gray-900 text-sm flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <div
              className="flex space-x-4 pb-4"
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
                  <div className="w-32">
                    <div className="relative mb-2">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-44 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-sm text-center line-clamp-2 group-hover:text-gray-600 transition-colors">
                      {book.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books by Genre */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Fantasy Genre */}
           <div id="fantasy-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Fantasy</h2>
              <Link href="/stories?category=fantasy" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "Dragon's Legacy", author: "Elena Blackwood", rating: "9.2", views: "127K", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop" },
                { title: "The Mystic Realm", author: "Marcus Stone", rating: "8.9", views: "89K", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop" },
                { title: "Shadow of Elves", author: "Luna Starweaver", rating: "9.5", views: "203K", img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop" },
                { title: "Crystal Prophecy", author: "Aria Moonlight", rating: "8.7", views: "156K", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop" },
                { title: "Wizard's Quest", author: "Theron Mage", rating: "9.1", views: "98K", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop" },
                { title: "Enchanted Forest", author: "Sage Willowbrook", rating: "8.8", views: "174K", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-40 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                      alt={book.title}
                      className="w-full h-40 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Romance Genre */}
           <div id="romance-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Romance</h2>
              <Link href="/stories?category=romance" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "Hearts Entwined", author: "Isabella Rose", rating: "9.4", views: "245K", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop" },
                { title: "Summer Love", author: "Emma Grace", rating: "8.9", views: "189K", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop" },
                { title: "Midnight Kiss", author: "Sophia Heart", rating: "9.2", views: "312K", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop" },
                { title: "Love's Promise", author: "Victoria Sweet", rating: "8.7", views: "156K", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop" },
                { title: "Eternal Flame", author: "Lily Passion", rating: "9.0", views: "278K", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop" },
                { title: "Destined Hearts", author: "Rose Valentine", rating: "8.8", views: "201K", img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-40 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sci-Fi Genre */}
           <div id="sci-fi-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Sci-Fi</h2>
              <Link href="/stories?category=sci-fi" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "Galactic Empire", author: "Dr. Alex Nova", rating: "9.3", views: "198K", img: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=280&fit=crop" },
                { title: "Time Paradox", author: "Sarah Quantum", rating: "8.8", views: "142K", img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=280&fit=crop" },
                { title: "Neural Network", author: "Marcus Cyber", rating: "9.1", views: "267K", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=280&fit=crop" },
                { title: "Mars Colony", author: "Luna Starship", rating: "8.9", views: "183K", img: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=280&fit=crop" },
                { title: "Quantum Leap", author: "Tesla Future", rating: "9.0", views: "221K", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&h=280&fit=crop" },
                { title: "Space Odyssey", author: "Orion Clarke", rating: "8.7", views: "156K", img: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-40 object-cover rounded-lg shadow-md border border-gray-200 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mystery Genre */}
           <div id="mystery-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Mystery</h2>
              <Link href="/stories?category=mystery" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "The Silent Witness", author: "Detective Morgan", rating: "9.2", views: "234K", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop" },
                { title: "Murder at Midnight", author: "Agatha Holmes", rating: "8.9", views: "187K", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop" },
                { title: "The Missing Heir", author: "Inspector Grey", rating: "9.0", views: "298K", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop" },
                { title: "Cold Case Files", author: "Sarah Detective", rating: "8.8", views: "165K", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop" },
                { title: "The Last Clue", author: "Sherlock Modern", rating: "9.1", views: "276K", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop" },
                { title: "Hidden Secrets", author: "Emma Sleuth", rating: "8.7", views: "192K", img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adventure Genre */}
           <div id="adventure-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Adventure</h2>
              <Link href="/stories?category=adventure" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "Treasure Island Quest", author: "Captain Jack", rating: "9.1", views: "189K", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop" },
                { title: "Mountain Expedition", author: "Bear Grylls Jr", rating: "8.9", views: "156K", img: "https://images.unsplash.com/photo-1464822759844-d150baec0494?w=200&h=280&fit=crop" },
                { title: "Jungle Survival", author: "Indiana Smith", rating: "9.3", views: "278K", img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=280&fit=crop" },
                { title: "Ocean Explorer", author: "Marina Deep", rating: "8.8", views: "167K", img: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=200&h=280&fit=crop" },
                { title: "Desert Nomad", author: "Sahara Wind", rating: "9.0", views: "234K", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=280&fit=crop" },
                { title: "Arctic Journey", author: "Frost Walker", rating: "8.7", views: "145K", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horror Genre */}
           <div id="horror-section" className="mb-8">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-medium text-gray-900">Horror</h2>
              <Link href="/stories?category=horror" className="text-gray-600 hover:text-gray-900 text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: "The Haunted Manor", author: "Edgar Darkwood", rating: "9.2", views: "198K", img: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=200&h=280&fit=crop" },
                { title: "Midnight Shadows", author: "Raven Blackheart", rating: "8.9", views: "167K", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop" },
                { title: "The Cursed Forest", author: "Salem Witch", rating: "9.0", views: "245K", img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=280&fit=crop" },
                { title: "Nightmare Asylum", author: "Dr. Sinister", rating: "8.8", views: "134K", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop" },
                { title: "Blood Moon Rising", author: "Vampire Lord", rating: "9.1", views: "289K", img: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=280&fit=crop" },
                { title: "The Demon's Call", author: "Lucifer Dark", rating: "8.7", views: "156K", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=280&fit=crop" }
              ].map((book, i) => (
                <div key={i} className="group">
                  <div className="relative mb-2">
                    <img
                      src={book.img}
                      alt={book.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>★ {book.rating}</span>
                    <span>{book.views}</span>
                  </div>
                </div>
              ))}
            </div>
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
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">NoManWeb</span>
              </div>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed max-w-md">
                The premier platform for storytellers to share their creativity,
                build communities, and earn from their passion. Join our community of passionate storytellers.
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
            <p className="text-gray-400 text-lg">&copy; 2024 NoManWeb. All rights reserved. Made with ❤️ for book lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
