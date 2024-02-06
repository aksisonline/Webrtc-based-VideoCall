# Next.js WebRTC Video Calling Application

This project is a video calling application built using Next.js 14 with server components and WebRTC technology. The application leverages Supabase Realtime and Prisma ORM to manage connections and provide real-time communication features.

## Features

- **Real-Time Video and Audio Calls:** Initiate and receive high-quality video and audio calls with ease.
- **Effortless Connection Setup:** Utilizes the latest WebRTC standards for seamless peer-to-peer connection establishment.
- **Robust Backend with Next.js 14:** Leveraging the power of Next.js 14 to handle server-side operations, providing a fast and secure calling experience.
- **Live Data Synchronization:** Powered by Supabase Realtime to ensure live updates during calls, without any delays.
- **Efficient Database Management:** Implements Prisma for straightforward schema management and database operations, keeping the focus on performance and stability.

## Folder Structure

- `src/` - Contains the Next.js pages and components for the application interface.
  - `app/` - Contains the Next.js pages and components for the application interface.
  - `assets/` - Static files like images and global styles.
  - `components/` - Reusable UI components.
  - `context/` - React contexts for global state management.
  - `interface/` - TypeScript interfaces and types.
  - `lib/` - Library code and utilities.
  - `utils/` - Utility functions and helpers.
- `prisma/` - Prisma schema files for database modeling.

## Getting Started

### Prerequisites

- Node.js 14.x or later
- Supabase account and project setup

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/nextjs-webrtc.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your `.env` file with the required Supabase and Database keys:

   ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    DATABASE_URL=postgres://postgres:Password@0.0.0.0:5432/room
    SUPABASE_SERVICE_KEY=
   ```

### Running the application

1. Run the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- To initiate a call, create a room and share the room ID with another user.
- Join an existing room by entering the room ID.

## Database Configuration

Prisma is used to define the application's data model. Update your schema in `prisma/schema.prisma` and push the changes to your database:

```bash
npx prisma db push
```
