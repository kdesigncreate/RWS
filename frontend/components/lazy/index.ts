// Lazy loaded components for code splitting
import { createLazyComponent } from '@/components/common/LazyLoadWrapper';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Admin components (heavy and not needed on public pages)
export const LazyAdminLayout = createLazyComponent(
  () => import('@/components/admin/AdminLayout'),
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

export const LazyPostTable = createLazyComponent(
  () => import('@/components/admin/PostTable'),
  <div className="p-8 text-center">
    <LoadingSpinner />
  </div>
);

export const LazyPostForm = createLazyComponent(
  () => import('@/components/admin/PostForm'),
  <div className="p-8 text-center">
    <LoadingSpinner />
  </div>
);

// Chart components (heavy libraries)
export const LazyChart = createLazyComponent(
  () => import('@/components/charts/Chart'),
  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Rich text editor (heavy component)
export const LazyRichTextEditor = createLazyComponent(
  () => import('@/components/forms/RichTextEditor'),
  <div className="min-h-40 bg-gray-50 rounded border flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Search components (not critical for initial load)
export const LazySearchBar = createLazyComponent(
  () => import('@/components/posts/SearchBar'),
  <div className="h-10 bg-gray-100 rounded animate-pulse" />
);

// Modal components (only loaded when needed)
export const LazyConfirmModal = createLazyComponent(
  () => import('@/components/common/ConfirmModal'),
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Analytics components (not critical)
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/components/analytics/Dashboard'),
  <div className="p-8 text-center">
    <LoadingSpinner />
  </div>
);

// Comments system (can be loaded after main content)
export const LazyCommentSystem = createLazyComponent(
  () => import('@/components/comments/CommentSystem'),
  <div className="bg-gray-50 rounded-lg p-6 text-center">
    <LoadingSpinner />
  </div>
);

// Social sharing (not critical for initial load)
export const LazySocialShare = createLazyComponent(
  () => import('@/components/social/SocialShare'),
  <div className="flex space-x-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

// File upload components (heavy with drag & drop libraries)
export const LazyFileUpload = createLazyComponent(
  () => import('@/components/forms/FileUpload'),
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
    <LoadingSpinner />
  </div>
);

// Advanced filters (complex UI, not needed immediately)
export const LazyAdvancedFilters = createLazyComponent(
  () => import('@/components/filters/AdvancedFilters'),
  <div className="bg-gray-50 rounded-lg p-4">
    <LoadingSpinner />
  </div>
);

// Calendar components (heavy libraries)
export const LazyCalendar = createLazyComponent(
  () => import('@/components/calendar/Calendar'),
  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Settings panels (not needed on initial load)
export const LazySettingsPanel = createLazyComponent(
  () => import('@/components/settings/SettingsPanel'),
  <div className="p-6 text-center">
    <LoadingSpinner />
  </div>
);

// Help/Documentation (can be loaded on demand)
export const LazyHelpCenter = createLazyComponent(
  () => import('@/components/help/HelpCenter'),
  <div className="p-8 text-center">
    <LoadingSpinner />
  </div>
);

// Newsletter signup (can be loaded after main content)
export const LazyNewsletterSignup = createLazyComponent(
  () => import('@/components/newsletter/NewsletterSignup'),
  <div className="bg-blue-50 rounded-lg p-6 text-center">
    <LoadingSpinner />
  </div>
);

// Video player (heavy component)
export const LazyVideoPlayer = createLazyComponent(
  () => import('@/components/media/VideoPlayer'),
  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Map components (heavy libraries like Google Maps)
export const LazyMap = createLazyComponent(
  () => import('@/components/map/Map'),
  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Code editor (very heavy component)
export const LazyCodeEditor = createLazyComponent(
  () => import('@/components/editor/CodeEditor'),
  <div className="min-h-40 bg-gray-900 rounded border flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Export all lazy components
export * from '@/components/common/LazyLoadWrapper';