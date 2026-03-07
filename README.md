# NexPrint 2.0

A full-stack cloud printing platform that allows users to upload documents from their mobile device and print them at nearby print shops or get them delivered.

## Project Structure

```
nexprint-2.0/
├── apps/
│   ├── mobile/              # User mobile app (React Native + Expo)
│   ├── delivery-partner/     # Delivery partner app (React Native)
│   ├── print-shop-admin/     # Print shop admin panel (Next.js)
│   └── admin-dashboard/      # System admin dashboard (Next.js)
├── packages/
│   ├── database/             # Supabase schema & migrations
│   └── shared/               # Shared types & utilities
└── package.json
```

## Technology Stack

- **Mobile**: React Native (Expo), NativeWind, React Navigation, React Native Paper
- **Web**: React.js, Next.js, Tailwind CSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Integrations**: Cloudinary, Razorpay, Google Maps, Firebase FCM

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (for mobile apps)
- Supabase account

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment files:

   ```bash
   copy .env.example .env.local
   copy apps\user-web\.env.example apps\user-web\.env.local
   copy apps\print-shop-admin\.env.example apps\print-shop-admin\.env.local
   copy apps\admin-dashboard\.env.example apps\admin-dashboard\.env.local
   copy apps\mobile\.env.example apps\mobile\.env
   copy apps\delivery-partner\.env.example apps\delivery-partner\.env
   ```

3. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Run `packages/database/schema.sql` in the SQL Editor
   - Fill all Supabase keys in each app env file

4. Add app assets (mobile apps):
   - Add `icon.png` (1024×1024 PNG) to `apps/mobile/assets/` - used for icon, splash, and adaptive icon

5. Run apps:
   ```bash
   npm run mobile         # User mobile app (Expo)
   npm run delivery       # Delivery partner app (Expo)
   npm run admin:shop     # Print shop admin (http://localhost:3001)
   npm run admin:system   # System admin dashboard (http://localhost:3002)
   npm run user:web       # User web app (http://localhost:3003)
   ```

## Design System

- **Primary**: #2563EB (Blue)
- **Secondary**: #22C55E (Green)
- **Background**: #F8FAFC (Light gray)
- **Card**: 16px rounded, soft shadows
