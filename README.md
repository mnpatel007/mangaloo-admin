# Mangaloo Admin Portal 🚀

**The Command Center for the Mangaloo Platform**

The Mangaloo Admin Portal is a robust, modular administrative interface designed to empower platform managers with complete control over the delivery ecosystem. From real-time order tracking to comprehensive vendor management, this application serves as the central nervous system for operations.

## ✨ Key Features

- **📊 Interactive Dashboard**
  - Real-time overview of platform health.
  - Key metrics: Active Orders, Revenue, Active Shoppers, and more.
  - Visual data representation for quick decision-making.

- **📦 Advanced Order Management**
  - Full lifecycle tracking: Pending -> Shopping -> Delivery -> Completed.
  - Detailed order views with item-level specifics.
  - Ability to intervene and update order statuses manually.

- **🛍️ Shop & Vendor Management**
  - Onboard new shops and manage existing profiles.
  - Configure operating hours, locations, and delivery zones.
  - Toggle shop availability instantly.

- **🛒 Product Catalog System**
  - Centralized management of the global product database.
  - Bulk import/export capabilities using Excel (XLSX).
  - Category and sub-category organization.

- **🏃 Personal Shopper Coordination**
  - Manage shopper profiles and verification status.
  - Track shopper performance and ratings.
  - Approve or reject shopper applications.

- **👥 Customer Management**
  - View customer profiles and order history.
  - Manage account statuses and support inquiries.

- **💬 Communication Hub**
  - Integrated messaging for platform-wide announcements.
  - Direct communication channels with shoppers and vendors.

- **⚙️ System Configuration**
  - Global settings for delivery fees, taxes, and commissions.
  - Role-based access control (RBAC) for secure administration.

## 🛠️ Technology Stack

Built with modern web technologies for performance and scalability:

- **Frontend Framework**: [React 19](https://react.dev/) - The latest in component-based UI development.
- **Routing**: [React Router v7](https://reactrouter.com/) - Robust client-side routing.
- **State Management**: React Context API & Hooks.
- **HTTP Client**: [Axios](https://axios-http.com/) - For efficient API communication.
- **Data Processing**: [SheetJS (xlsx)](https://sheetjs.com/) - For handling spreadsheet data.
- **Styling**: Modular CSS - Scoped styling for component isolation.
- **Architecture**: Feature-based Modular Architecture.

## 📂 Project Structure

The codebase follows a strictly modular architecture, ensuring that features are encapsulated and easy to maintain.

```
mangaloo-admin/
├── .env.development            # Committed, non-secret dev config (see backend README)
├── env.example                 # Template for a real .env (production)
├── package.json
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── mangaloo-logo.jpg
│   └── robots.txt
└── src/
    ├── App.js / App.css        # Root component and route definitions
    ├── index.js / index.css    # App entry point and global styles
    └── modules/                 # Feature modules
        ├── auth/                 # LoginPage
        ├── communication/        # NoticesPage — platform-wide announcements
        ├── core/                 # Shared building blocks
        │   ├── components/        # ErrorBoundary, Logo
        │   ├── context/           # AuthContext
        │   ├── services/          # api.js, socket.js
        │   └── utils/             # axios.js
        ├── dashboard/             # Dashboard — platform overview & metrics
        ├── orders/                # OrdersPage + OrderMonitoring component
        ├── products/              # ProductsPage + BulkProductUpload (XLSX)
        ├── settings/              # Commissions, Delivery Discounts, Terms & Conditions
        ├── shoppers/               # ShoppersPage, ShopperPerformancePage
        ├── shops/                  # ShopsPage — vendor management
        └── users/                  # UsersPage — customer management
```

## 🔐 Security

- **Authentication**: JWT-based session management.
- **Authorization**: Protected routes ensure only authorized admins can access sensitive modules.

---

## Getting Started

For the complete local development setup — installing WSL, Docker, Node, cloning
all five Mangaloo repos, seeding the database, and running everything
together — see the
[`backend` repo's README](https://github.com/mnpatel007/mangaloo-backend#readme).
That's the single source of truth for setup; once it's done, come back here and
run `npm start` in this repo (`http://localhost:3001`).

_© 2025 Mangaloo. All rights reserved._
