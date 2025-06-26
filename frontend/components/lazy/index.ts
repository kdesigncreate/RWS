// Lazy loaded components for code splitting
import { lazy } from 'react';

// Admin components that exist (named exports, wrapped to provide default export)
export const LazyAdminLayout = lazy(() => 
  import('@/components/admin/AdminLayout').then(module => ({ default: module.AdminCardLayout }))
);

export const LazyPostTable = lazy(() => 
  import('@/components/admin/PostTable').then(module => ({ default: module.PostTable }))
);

export const LazyPostForm = lazy(() => 
  import('@/components/admin/PostForm').then(module => ({ default: module.PostForm }))
);

// Search components that exist
export const LazySearchBar = lazy(() => 
  import('@/components/posts/SearchBar').then(module => ({ default: module.SearchBar }))
);

// Note: The following components don't exist yet but are kept for future implementation
// When these components are created, uncomment the appropriate lines

// Chart components (heavy libraries) - NOT YET IMPLEMENTED
// export const LazyChart = createLazyComponent(() => import('@/components/charts/Chart'));

// Rich text editor (heavy component) - NOT YET IMPLEMENTED  
// export const LazyRichTextEditor = createLazyComponent(() => import('@/components/forms/RichTextEditor'));

// Modal components (only loaded when needed) - NOT YET IMPLEMENTED
// export const LazyConfirmModal = createLazyComponent(() => import('@/components/common/ConfirmModal'));

// Analytics components (not critical) - NOT YET IMPLEMENTED
// export const LazyAnalyticsDashboard = createLazyComponent(() => import('@/components/analytics/Dashboard'));

// Comments system (can be loaded after main content) - NOT YET IMPLEMENTED
// export const LazyCommentSystem = createLazyComponent(() => import('@/components/comments/CommentSystem'));

// Social sharing (not critical for initial load) - NOT YET IMPLEMENTED
// export const LazySocialShare = createLazyComponent(() => import('@/components/social/SocialShare'));

// File upload components (heavy with drag & drop libraries) - NOT YET IMPLEMENTED
// export const LazyFileUpload = createLazyComponent(() => import('@/components/forms/FileUpload'));

// Advanced filters (complex UI, not needed immediately) - NOT YET IMPLEMENTED
// export const LazyAdvancedFilters = createLazyComponent(() => import('@/components/filters/AdvancedFilters'));

// Calendar components (heavy libraries) - NOT YET IMPLEMENTED
// export const LazyCalendar = createLazyComponent(() => import('@/components/calendar/Calendar'));

// Settings panels (not needed on initial load) - NOT YET IMPLEMENTED
// export const LazySettingsPanel = createLazyComponent(() => import('@/components/settings/SettingsPanel'));

// Help/Documentation (can be loaded on demand) - NOT YET IMPLEMENTED
// export const LazyHelpCenter = createLazyComponent(() => import('@/components/help/HelpCenter'));

// Newsletter signup (can be loaded after main content) - NOT YET IMPLEMENTED
// export const LazyNewsletterSignup = createLazyComponent(() => import('@/components/newsletter/NewsletterSignup'));

// Video player (heavy component) - NOT YET IMPLEMENTED
// export const LazyVideoPlayer = createLazyComponent(() => import('@/components/media/VideoPlayer'));

// Map components (heavy libraries like Google Maps) - NOT YET IMPLEMENTED
// export const LazyMap = createLazyComponent(() => import('@/components/map/Map'));

// Code editor (very heavy component) - NOT YET IMPLEMENTED
// export const LazyCodeEditor = createLazyComponent(() => import('@/components/editor/CodeEditor'));

// Export all lazy components
export * from '@/components/common/LazyLoadWrapper';