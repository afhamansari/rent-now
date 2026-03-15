# 🏠 Rent Now — Rental Marketplace

A full-stack rental marketplace built with **React + Vite** and **Supabase**.

---

## Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite (JavaScript)  |
| Routing   | React Router v6               |
| Backend   | Supabase (Auth + Postgres + Storage) |
| Styling   | Vanilla CSS (no UI framework) |

---

## Features

- 🔑 Email/password auth with role selection (landlord / tenant)
- 🏡 Landlords can list properties with photos, view and delete them
- 📷 Image upload stored in Supabase Storage (property-images bucket)
- 🔍 Tenants can browse, search by city, sort by price
- 💬 Direct tenant → landlord messaging per property
- 📊 Role-aware dashboard
- 🔒 Row Level Security on all tables

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase (run once)

1. Open your Supabase project dashboard
2. Go to **SQL Editor → New query**
3. Paste the entire contents of `supabase_schema.sql` and click **Run**

> **Upgrading from the old schema?** Uncomment the `RESET SCRIPT` block at the
> bottom of `supabase_schema.sql`, run it first to drop old tables, then run
> the full file.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
src/
├── lib/supabase.js              Supabase client
├── context/AuthContext.jsx      Global auth + profile state
├── components/
│   ├── Navbar.jsx               Top nav, role-aware
│   ├── PropertyCard.jsx         Card in browse grid (shows real image)
│   ├── PropertyForm.jsx         Create property form + image upload
│   └── MessageBox.jsx           Tenant ↔ landlord thread
├── pages/
│   ├── Home.jsx                 Browse + search + sort
│   ├── Login.jsx                Login
│   ├── Signup.jsx               Signup with role picker
│   ├── Dashboard.jsx            Landlord listings / tenant messages
│   ├── PropertyDetails.jsx      Full listing + contact
│   └── CreateProperty.jsx       Landlord listing form
├── App.jsx
└── index.css
```

---

## Bug fixes vs previous version

| Bug | Fix |
|-----|-----|
| `messages_sender_id_fkey` FK violation | Changed `sender_id`/`receiver_id` to reference `auth.users(id)` instead of `profiles(id)` |
| Tenant dashboard stuck on loading | `profileLoaded` flag; dashboard renders even if profile row is null |
| No image upload | Added Supabase Storage + upload in PropertyForm |
| Name | Changed from Nestly → Rent Now |
