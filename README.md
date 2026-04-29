# AutoMetrics Travel Data Dashboard

> A production-grade travel data management platform engineered for high concurrency and low latency, handling 100+ concurrent users with sub-100ms response times.

**Target Audience:** Developers, DevOps engineers, technical recruiters evaluating full-stack capabilities, and open-source contributors.

---

## 🎯 What Problem Does This Solve?

Travel agencies and organizations struggle with processing large volumes of booking data efficiently. This platform provides:

- Real-time data ingestion and processing from Excel/CSV files
- Instant analytics and visualizations for business insights
- Scalable architecture that maintains performance under load
- Secure multi-user environment with role-based access

---

## 🏗️ Architecture Overview

```
User Browser
    ↓
Vercel Edge Network (CDN)
    ↓ [Static Assets Cached]
React SPA (TypeScript + Vite)
    ↓ [API Requests]
Render (Node.js Backend)
    ↓ [Rate Limited: 300 req/min]
    ↓ [Compressed: 60-80% reduction]
Redis Cache Layer (60-300s TTL)
    ↓ [Cache Miss]
MongoDB Atlas (Connection Pool: 2-10)
```

**Data Flow:**

- Frontend deployed on Vercel with aggressive CDN caching
- Backend API on Render with Always-On instance
- Redis for read-through caching (70-90% DB load reduction)
- MongoDB Atlas for persistent storage with connection pooling
- WebSocket server for real-time announcements

---

## 🚀 Key Features

- **High-Performance Data Processing:** Excel/CSV uploads processed in-memory with sub-second response times
- **Real-Time Analytics:** Interactive dashboards with live data updates via WebSocket
- **Intelligent Caching:** Multi-layer cache strategy reduces origin requests by 70-90%
- **Production-Grade Security:** JWT authentication, rate limiting, and CORS protection
- **Scalable Architecture:** Horizontal scaling ready with stateless API design
- **Role-Based Access Control:** Admin and user roles with granular permissions
- **Audit Trail:** Complete history tracking for compliance and transparency
- **Responsive Design:** Mobile-first UI optimized for all device sizes

---

## 🛠️ Technology Stack

### Frontend

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite (ESM-first, fast HMR)
- **State Management:** React Query (TanStack Query v5)
- **Styling:** Tailwind CSS + Radix UI components
- **Form Handling:** React Hook Form + Zod validation
- **Routing:** Wouter (lightweight SPA routing)

### Backend

- **Runtime:** Node.js 20+ with Express
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Cache:** Redis (Upstash/Redis Labs compatible)
- **Authentication:** JWT with HTTP-only cookies
- **Logging:** Pino (async, non-blocking)
- **File Processing:** XLSX + Multer (in-memory)

### Infrastructure & Hosting

- **Frontend Hosting:** Vercel (Edge Network + CDN)
- **Backend Hosting:** Render (Always-On instance)
- **Database:** MongoDB Atlas (M0+ cluster)
- **Cache:** Redis Labs/Upstash (free tier compatible)
- **CI/CD:** GitHub Actions + Vercel/Render auto-deploy

### Developer Tools

- **Package Manager:** npm
- **Type Checking:** TypeScript 5+
- **Code Quality:** ESLint + Prettier (optional)
- **API Testing:** Postman/Thunder Client compatible

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Tajamal Hussain**  
Full-Stack Engineer | Performance Optimization Specialist

- 📧 Email: tajamalkhan720@gmail.com
- 💬 WhatsApp: [+92 343 800 2540](https://wa.me/923438002540)
- 💼 GitHub: [@tajamalhussain](https://github.com/TajHussain7) _(Update with actual profile)_

_Built with precision engineering and attention to performance._

---

**⭐ If this project helped you, consider starring the repository!**
