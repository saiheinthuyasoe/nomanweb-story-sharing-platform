# NoManWeb - Advanced Story Sharing & Monetization Platform

A comprehensive full-stack story sharing platform with advanced monetization, social features, and content management capabilities. Users can write, share, and monetize their stories through an innovative coin economy with virtual gifts, reading progress tracking, and community engagement features.

## 🚀 **Current Status: Phase 2 Development Ready** 🎯

✅ **Phase 1 Complete**: Full authentication system with multi-provider OAuth  
🔄 **Phase 2 Active**: Content Management System implementation starting

## 🚀 **Core Features**

### **📚 Content Management**
- **Story Creation**: Multi-chapter stories with rich text editing
- **Chapter Management**: Individual chapter pricing and access control
- **Category System**: Genre-based organization and discovery
- **Content Moderation**: AI-powered content review and admin approval
- **Media Support**: Cover images and profile pictures via Cloudinary
- **Draft/Publish Workflow**: Complete content lifecycle management

### **💰 Advanced Monetization System**
- **Coin Economy**: Platform virtual currency for all transactions
- **Chapter Pricing**: Individual chapter monetization with free/paid options
- **Gift System**: Virtual gifts (Heart, Star, Crown, Diamond, Trophy) as tips
- **Coin Packages**: Multiple purchase tiers with bonus coins
- **Revenue Sharing**: Service fees and author earnings tracking
- **Withdrawal System**: Coin-to-THB conversion with PromptPay integration
- **Payment Processing**: Manual verification via LINE messaging

### **👥 Social & Community Features**
- **User Following**: Follow favorite authors with notifications
- **Comment System**: Hierarchical comments on stories and chapters
- **Reaction System**: Like stories, chapters, and comments
- **Reading Lists**: Personal libraries (Reading, Completed, Favorites, Want to Read)
- **Reading Progress**: Automatic bookmark and progress tracking
- **User Profiles**: Comprehensive author and reader profiles

### **🔍 Advanced Search & Discovery**
- **Typesense Integration**: Lightning-fast full-text search
- **Smart Recommendations**: AI-powered content suggestions
- **Category Browsing**: Genre-based content discovery
- **Trending Content**: Popular stories based on engagement metrics
- **Search Analytics**: Track popular queries and content discovery

### **🔔 Real-time Notifications**
- **LINE Integration**: Push notifications via LINE messaging
- **Multi-channel Alerts**: New chapters, gifts, comments, follows
- **Notification Center**: In-app notification management
- **Email Notifications**: Important updates and security alerts

### **🛡️ Security & Moderation**
- **Content Moderation**: AI-powered offensive content detection
- **User Reporting**: Report inappropriate content or users
- **Admin Dashboard**: Comprehensive moderation and user management
- **Security Tracking**: Password reset attempts and login monitoring
- **Role-based Access**: User and Admin permission levels

### **📊 Analytics & Insights**
- **User Analytics**: Reading habits and engagement tracking
- **Story Analytics**: Views, engagement, and revenue metrics
- **Platform Statistics**: Comprehensive dashboard for admins
- **Revenue Tracking**: Detailed financial analytics and reporting

## 🛠 **Technology Stack**

### **Backend Architecture**
- **Java 17** with **Spring Boot 3.5.0**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with **PostgreSQL** database
- **Redis** for caching and session management
- **Typesense** for advanced search capabilities
- **Cloudinary** for media storage and optimization
- **LINE Messaging API** for notifications
- **Maven** for dependency management

### **Frontend Architecture**
- **Next.js 15** with **React 19** and **TypeScript**
- **Tailwind CSS** for modern responsive design
- **@tanstack/react-query v5** for state management
- **React Hook Form v8** for form handling
- **Shiki** for syntax highlighting
- **Axios** with interceptors for API communication
- **Progressive Web App** capabilities

### **Database Schema (20+ Tables)**
- **Users**: Complete user management with OAuth integration
- **Stories & Chapters**: Content management with monetization
- **Categories**: Genre organization system
- **Comments & Reactions**: Social interaction features
- **Coin System**: Transactions, packages, and gifts
- **Reading Progress**: User engagement tracking
- **Notifications**: Multi-channel messaging system
- **Moderation**: Content review and safety features
- **Analytics**: Comprehensive metrics and insights
- **System Settings**: Platform configuration management

## 📋 **Prerequisites**

- **Java 17** or higher
- **Node.js 18** or higher
- **PostgreSQL 13** or higher
- **Redis** (for caching and sessions)
- **Typesense Server** (for search functionality)
- **Maven 3.6** or higher
- **LINE Developer Account** (for notifications)
- **Cloudinary Account** (for media storage)

## 🔧 **Installation & Setup**

### **✅ Phase 1 Complete - Authentication System Ready**

The authentication system is fully functional with:
- Multi-provider OAuth (Email/Password, Google, LINE)
- JWT token management with refresh tokens
- Email verification and password reset
- User profile management
- Secure password hashing and validation

### **🚀 Phase 2 Ready - Next Steps**

With Phase 1 complete, you're ready to begin Phase 2 development. The foundation is solid:
- Database schema complete (20+ tables)
- Authentication system working
- Frontend/backend communication established
- Development environment configured

### **📋 Phase 2 Implementation Plan**

**Immediate Next Steps:**
1. **Story Management API** - CRUD operations for stories
2. **Rich Text Editor** - Story writing interface
3. **Chapter System** - Multi-chapter story support
4. **Category Management** - Genre organization
5. **File Upload** - Cover images and media

### **1. Clone the Repository**

```bash
git clone <repository-url>
cd Nomanweb
```

### **2. Database Setup**

#### **PostgreSQL Configuration**
```sql
CREATE DATABASE nomanweb;
CREATE USER nomanweb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nomanweb TO nomanweb_user;
```

#### **Apply Database Schema**
```bash
# Import the complete schema
psql -U nomanweb_user -d nomanweb -f story_platform_db_schema.sql
```

### **3. Backend Configuration**

Update `nomanweb_backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/nomanweb
spring.datasource.username=nomanweb_user
spring.datasource.password=your_password

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=your-256-bit-secret-key
jwt.expiration=86400000

# Cloudinary Configuration
cloudinary.cloud-name=your-cloud-name
cloudinary.api-key=your-api-key
cloudinary.api-secret=your-api-secret

# Typesense Configuration
typesense.host=localhost
typesense.port=8108
typesense.api-key=your-typesense-api-key

# LINE Messaging Configuration
line.channel-access-token=your-line-channel-token
line.channel-secret=your-line-channel-secret

# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# Redis Configuration
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=your-redis-password
```

### **4. External Services Setup**

#### **Typesense Server**
```bash
# Using Docker
docker run -p 8108:8108 -v/tmp/typesense-data:/data typesense/typesense:0.25.1 \
  --data-dir /data --api-key=your-typesense-api-key --enable-cors
```

#### **Redis Server**
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:alpine
```

### **5. Start the Backend**
```bash
cd nomanweb_backend
mvn clean install
mvn spring-boot:run
```

### **6. Frontend Setup**

```bash
cd nomanweb_frontend
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

# Start development server
npm run dev
```

## 📚 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - User login with JWT token
- `GET /api/auth/profile` - Get authenticated user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### **Story Management Endpoints**
- `GET /api/stories` - Get paginated stories
- `POST /api/stories` - Create new story
- `GET /api/stories/{id}` - Get story details
- `PUT /api/stories/{id}` - Update story
- `DELETE /api/stories/{id}` - Delete story
- `POST /api/stories/{id}/publish` - Publish story

### **Chapter Management Endpoints**
- `GET /api/stories/{storyId}/chapters` - Get story chapters
- `POST /api/stories/{storyId}/chapters` - Create new chapter
- `GET /api/chapters/{id}` - Get chapter content
- `PUT /api/chapters/{id}` - Update chapter
- `DELETE /api/chapters/{id}` - Delete chapter

### **Monetization Endpoints**
- `GET /api/coins/packages` - Get coin packages
- `POST /api/coins/purchase` - Purchase coin package
- `GET /api/coins/transactions` - Get transaction history
- `POST /api/chapters/{id}/purchase` - Purchase chapter access
- `GET /api/gifts` - Get available gifts
- `POST /api/gifts/send` - Send gift to author

### **Social Features Endpoints**
- `POST /api/users/{id}/follow` - Follow user
- `DELETE /api/users/{id}/follow` - Unfollow user
- `GET /api/stories/{id}/comments` - Get story comments
- `POST /api/stories/{id}/comments` - Add comment
- `POST /api/reactions` - Add reaction (like)
- `DELETE /api/reactions/{id}` - Remove reaction

### **Search & Discovery Endpoints**
- `GET /api/search/stories` - Search stories with filters
- `GET /api/search/users` - Search users
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/categories` - Get all categories
- `GET /api/stories/featured` - Get featured stories
- `GET /api/stories/trending` - Get trending stories

## 🗄 **Database Architecture**

### **Core Entities (20+ Tables)**

#### **User Management**
- `users` - User accounts with OAuth integration
- `user_follows` - User relationship management
- `password_reset_attempts` - Security tracking
- `email_verification_tokens` - Email verification system

#### **Content Management**
- `stories` - Main story content with metadata
- `chapters` - Individual story chapters
- `categories` - Story categorization system
- `reading_progress` - User reading tracking
- `reading_lists` - User's personal libraries

#### **Social Features**
- `comments` - Hierarchical comment system
- `reactions` - Like system for content
- `notifications` - Multi-channel notification system

#### **Monetization System**
- `coin_packages` - Available coin purchase options
- `coin_transactions` - All financial transactions
- `gifts` - Virtual gift catalog
- `gift_transactions` - Gift sending history
- `chapter_purchases` - Paid content access tracking

#### **Moderation & Safety**
- `moderation_logs` - Content review history
- `user_reports` - User-generated reports
- `system_settings` - Platform configuration

#### **Analytics & Insights**
- `user_analytics` - User behavior tracking
- `story_analytics` - Content performance metrics
- `recommendation_history` - AI recommendation tracking
- `user_preferences` - Personalization data

## 🔐 **Security Features**

### **Authentication & Authorization**
- JWT token-based authentication with refresh mechanism
- Multi-provider OAuth (Google, LINE, Email/Password)
- Role-based access control (User, Admin)
- Password strength requirements and change tracking
- Email verification and password reset with token expiration

### **Data Protection**
- BCrypt password hashing
- SQL injection prevention with JPA
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Rate limiting for API endpoints

### **Security Monitoring**
- Password reset attempt tracking
- Login activity monitoring
- User report system for inappropriate content
- Content moderation with AI-powered detection

## 🎨 **User Interface Features**

### **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Progressive Web App capabilities
- Dark/light theme support
- Accessibility compliance (WCAG 2.1 AA)

### **Rich Content Creation**
- Advanced rich text editor for story writing
- Drag & drop image upload with Cloudinary
- Real-time word count and reading time estimation
- Chapter organization and management tools

### **Social Interaction**
- Real-time comment system with threading
- Like/reaction system with animations
- User following with notification preferences
- Reading progress visualization

### **Monetization Interface**
- Coin balance and transaction history
- Gift sending interface with animations
- Chapter purchase flow with preview
- Revenue dashboard for authors

## 🚀 **Development Phases**

### **Phase 1: Core Infrastructure ✅ COMPLETED**
- [x] Project setup and dependencies
- [x] PostgreSQL database with complete schema (20+ tables)
- [x] Complete JWT authentication system
- [x] Email/password authentication with validation
- [x] Email verification system (fully functional)
- [x] Google OAuth integration (ready for Firebase setup)
- [x] LINE OAuth integration
- [x] Multi-provider authentication (all providers working)
- [x] Password reset with email service
- [x] Basic UI components and routing
- [x] Modern state management with @tanstack/react-query v5
- [x] Syntax highlighting with Shiki
- [x] Comprehensive testing framework
- [x] Security implementation (JWT, CORS, validation)
- [ ] User profile management
- [x] Authentication context and state management

**🎉 Phase 1 Results:**
- **Authentication System**: 100% functional
- **Database Schema**: Complete with all 20+ tables
- **Security Features**: JWT tokens, password hashing, email verification
- **OAuth Providers**: Email/Password ✅, Google OAuth ✅, LINE OAuth ✅
- **User Management**: Registration, login, profile updates, password reset

### **Phase 2: Content Management System ✅ COMPLETED**
- [x] **Story CRUD Operations** - Create, read, update, delete stories
- [x] **Rich Text Editor** - Advanced story writing interface with Lexical
- [x] **Chapter Management** - Multi-chapter story support with navigation
- [x] **Category System** - Genre-based organization with 10+ categories
- [x] **File Upload System** - Cover images and media with Cloudinary
- [x] **Content Moderation** - Review and approval workflow with admin dashboard
- [x] **Advanced Search** - Story discovery and filtering using Typesense
- [x] **Draft/Publish Workflow** - Content lifecycle management
- [x] **BONUS**: Admin dashboard, search indexing automation, reading progress

**🎯 Phase 2 Goals:**
- Complete story creation and management system
- Implement rich text editing with media support
- Build category-based content organization
- Create basic search and discovery features
- Establish content moderation framework

### **Phase 3: Monetization System 📋 PLANNED**
- [ ] Coin economy implementation
- [ ] Gift system with virtual items
- [ ] Chapter purchase and access control
- [ ] Payment processing with LINE integration
- [ ] Revenue tracking and analytics
- [ ] Withdrawal system with PromptPay

### **Phase 4: Social Features 📋 PLANNED**
- [ ] User following and notification system
- [ ] Comment system with moderation
- [ ] Reading lists and progress tracking
- [ ] Reaction system (likes, favorites)
- [ ] User profiles and social interactions

### **Phase 5: Advanced Features 📋 PLANNED**
- [ ] AI-powered content recommendations
- [ ] Advanced analytics dashboard
- [ ] LINE bot integration for notifications
- [ ] Mobile app development
- [ ] Performance optimization and scaling

## 🧪 **Testing & Quality Assurance**

### **Backend Testing**
```bash
cd nomanweb_backend
mvn test

# Run specific test suites
mvn test -Dtest=AuthenticationTests
mvn test -Dtest=StoryManagementTests
mvn test -Dtest=MonetizationTests
```

### **Frontend Testing**
```bash
cd nomanweb_frontend
npm test

# Run E2E tests
npm run test:e2e

# Run component tests
npm run test:components
```

### **API Testing**
```bash
# Use provided testing tools
./test_backend.sh
./check_database.sh

# Import Postman collection
# NoManWeb_API_Tests.postman_collection.json
```

## 📊 **Performance & Scalability**

### **Performance Targets**
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Search Response**: < 100ms with Typesense
- **Concurrent Users**: 10,000+
- **Database Queries**: Optimized with proper indexing

### **Scalability Features**
- Redis caching for frequently accessed data
- CDN integration for media delivery
- Database connection pooling
- Horizontal scaling capabilities
- Load balancing ready architecture

## 🌍 **Internationalization**

### **Supported Languages**
- **Thai** (Primary) - Complete localization
- **English** (Secondary) - Full feature support

### **Localization Features**
- Currency display in THB
- Date/time formatting for Thai locale
- Cultural considerations for content and UI
- LINE integration for Thai market

## 📄 **Documentation**

- **[Phase 2 Implementation Plan](PHASE_2_PLAN.md)** - Detailed development roadmap
- **[Phase 2 Getting Started](PHASE_2_GETTING_STARTED.md)** - Immediate next steps
- **[Migration Guide](MIGRATION_GUIDE.md)** - Technology upgrade documentation
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[Database Troubleshooting](DATABASE_TROUBLESHOOTING.md)** - Setup and issue resolution

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request with detailed description

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support & Community**

- **Email**: support@nomanweb.com
- **Discord**: [Join our community](https://discord.gg/nomanweb)
- **Documentation**: [docs.nomanweb.com](https://docs.nomanweb.com)
- **Bug Reports**: [GitHub Issues](https://github.com/nomanweb/issues)

## 🔮 **Roadmap & Future Features**

### **Short-term (3-6 months)**
- [ ] Complete Phase 2-4 implementation
- [ ] Mobile-responsive optimization
- [ ] Advanced search with filters
- [ ] Real-time notifications via WebSocket
- [ ] Performance optimization

### **Medium-term (6-12 months)**
- [ ] Mobile application (React Native)
- [ ] AI-powered content recommendations
- [ ] Advanced analytics with machine learning
- [ ] Multi-language support expansion
- [ ] API rate limiting and premium tiers

### **Long-term (12+ months)**
- [ ] Blockchain integration for NFT stories
- [ ] Advanced AI writing assistance
- [ ] Virtual reality reading experience
- [ ] Global marketplace expansion
- [ ] Enterprise features for publishers

---

**🎉 Welcome to NoManWeb - Where Stories Come to Life and Authors Thrive!**

*Building the future of digital storytelling with advanced monetization, community engagement, and cutting-edge technology.* 

# How auto save content works

1. User applies Bold formatting
   ↓
2. Editor detects HTML change (1s delay)
   ↓ 
3. Content change handler triggers (2s delay)
   ↓
4. Auto-save executes as draft
   ↓
5. User refreshes page
   ↓
6. Before unload auto-save (instant)
   ↓
7. Content preserved! ✅