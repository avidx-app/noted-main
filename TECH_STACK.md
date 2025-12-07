# Tech Stack Documentation

This document explains each technology used in the Noted project and how we're using them to build a modern, collaborative note-taking application.

---

## Next.js

### What is Next.js?

Next.js is a React framework that makes building web applications easier and faster. Think of it as a supercharged version of React that handles many complex tasks automatically, like routing (moving between pages), server-side rendering (making pages load faster), and optimizing your code.

### How We're Using It

In this project, Next.js serves as the foundation of our entire application:

- **App Router Structure**: We use Next.js's file-based routing system. The folder structure in `app/` automatically creates routes:
  - `app/(landing)/page.tsx` → The landing page (`/`)
  - `app/(main)/documents/[documentId]/page.tsx` → Individual document pages (`/documents/123`)
  - `app/(public)/preview/[documentId]/page.tsx` → Public preview pages (`/preview/123`)

- **Layout Components**: We use Next.js layouts to wrap pages with shared components:
  - `app/layout.tsx` - Root layout that wraps the entire app with providers (Convex, EdgeStore, Theme)
  - `app/(main)/layout.tsx` - Main app layout that includes navigation and authentication checks

- **Server Components**: Next.js allows us to use React Server Components, which can fetch data on the server before sending it to the browser, making pages load faster.

- **API Routes**: We use Next.js API routes for EdgeStore integration:
  - `app/api/edgestore/[...edgestore]/route.ts` - Handles file uploads and storage

**Key Files:**
- `app/layout.tsx` - Root layout with all providers
- `app/(main)/layout.tsx` - Main application layout
- `next.config.mjs` - Next.js configuration

---

## TypeScript

### What is TypeScript?

TypeScript is JavaScript with added type safety. It's like having a spell-checker for your code that catches errors before you run the program. It helps prevent bugs by ensuring data types match what's expected.

### How We're Using It

TypeScript is used throughout the entire project to ensure code reliability:

- **Type Safety**: All components, functions, and data structures have type definitions. For example:
  ```typescript
  interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
  }
  ```

- **Convex Integration**: Convex generates TypeScript types automatically from our database schema, ensuring our database queries and mutations are type-safe.

- **Component Props**: Every React component has typed props, preventing errors when passing data between components.

- **API Types**: EdgeStore provides TypeScript types for file uploads, ensuring we handle file operations correctly.

**Key Files:**
- `tsconfig.json` - TypeScript configuration
- All `.tsx` and `.ts` files use TypeScript

---

## Tailwind CSS

### What is Tailwind CSS?

Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS files, you apply pre-built classes directly to your HTML elements. It's like having a toolbox of ready-made styles you can combine to create any design.

### How We're Using It

Tailwind CSS is our primary styling solution:

- **Utility Classes**: We use Tailwind classes throughout components for styling:
  - `className="flex h-full items-center justify-center"` - Creates a flex container
  - `className="dark:bg-[#1F1F1F]"` - Dark mode background color
  - `className="hover:bg-accent"` - Hover effects

- **Dark Mode**: Tailwind's dark mode is integrated with our theme provider, allowing users to switch between light and dark themes.

- **Responsive Design**: Tailwind's responsive utilities (`sm:`, `md:`, `lg:`) help make the app work on all screen sizes.

- **Custom Configuration**: We've customized Tailwind in `tailwind.config.ts` to match our design system.

**Key Files:**
- `tailwind.config.ts` - Tailwind configuration
- `app/globals.css` - Global styles and Tailwind directives
- All component files use Tailwind classes

---

## Shadcn UI

### What is Shadcn UI?

Shadcn UI is a collection of high-quality, accessible React components built on top of Radix UI and styled with Tailwind CSS. Unlike traditional component libraries, Shadcn components are copied directly into your project, giving you full control to customize them.

### How We're Using It

Shadcn UI provides our reusable UI components:

- **Dialog Components**: Used for modals like settings, confirmations, and cover image uploads:
  - `components/modals/SettingsModal.tsx`
  - `components/modals/ConfirmModal.tsx`
  - `components/modals/CoverImageModal.tsx`

- **Command Palette**: The search command component (`components/search-command.tsx`) uses Shadcn's Command component for the search interface.

- **Dropdown Menus**: Navigation menus and action menus use Shadcn's DropdownMenu component.

- **Popover**: Used for icon picker and other overlay components.

- **Alert Dialog**: Used for confirmation dialogs when deleting documents.

**Key Files:**
- `components.json` - Shadcn configuration
- `components/ui/` - All Shadcn UI components
- Components are built on Radix UI primitives for accessibility

---

## Clerk

### What is Clerk?

Clerk is an authentication and user management service. It handles all the complex parts of user authentication (sign up, sign in, password reset, etc.) so we don't have to build it ourselves.

### How We're Using It

Clerk handles all user authentication in our application:

- **Authentication Provider**: We wrap our app with ClerkProvider in `components/providers/convex-provider.tsx`:
  ```typescript
  <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
    {/* App content */}
  </ClerkProvider>
  ```

- **Convex Integration**: Clerk is integrated with Convex using `ConvexProviderWithClerk`, which automatically passes authentication tokens to Convex so our backend knows who the user is.

- **User Identity**: In Convex mutations and queries, we use `ctx.auth.getUserIdentity()` to get the current user's ID and verify they're authenticated.

- **Protected Routes**: The main layout (`app/(main)/layout.tsx`) checks authentication status and redirects unauthenticated users to the landing page.

**Key Files:**
- `components/providers/convex-provider.tsx` - Clerk and Convex integration
- `convex/auth.config.js` - Clerk configuration for Convex
- `convex/documents.ts` - Uses Clerk authentication in all queries/mutations

---

## Convex

### What is Convex?

Convex is a backend-as-a-service platform that provides a real-time database and serverless functions. It automatically syncs data between the database and your frontend, so changes appear instantly without manual refresh.

### How We're Using It

Convex is our backend and database:

- **Database Schema**: We define our data structure in `convex/schema.ts`:
  ```typescript
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    // ... more fields
  })
  ```

- **Queries**: We use Convex queries to fetch data reactively:
  - `getSidebar` - Gets documents for the sidebar
  - `getById` - Gets a specific document
  - `getSearch` - Gets all documents for search
  - `getTrash` - Gets archived documents

- **Mutations**: We use Convex mutations to modify data:
  - `create` - Creates a new document
  - `update` - Updates document content, title, cover image, etc.
  - `archive` - Archives a document (and its children)
  - `restore` - Restores an archived document
  - `remove` - Permanently deletes a document

- **Real-time Updates**: When data changes in Convex, all connected clients automatically receive updates, making collaboration seamless.

- **Authentication**: Convex uses Clerk to verify user identity, ensuring users can only access their own documents.

**Key Files:**
- `convex/schema.ts` - Database schema definition
- `convex/documents.ts` - All document-related queries and mutations
- `components/providers/convex-provider.tsx` - Convex client setup

---

## EdgeStore

### What is EdgeStore?

EdgeStore is a file storage service designed to work seamlessly with Next.js. It handles file uploads, storage, and delivery, making it easy to add images and files to your application.

### How We're Using It

EdgeStore handles all file uploads in our application:

- **File Upload Configuration**: We set up EdgeStore in `app/api/edgestore/[...edgestore]/route.ts`:
  ```typescript
  const edgeStoreRouter = es.router({
    publicFiles: es.fileBucket().beforeDelete(() => {
      return true;
    }),
  });
  ```

- **Provider Setup**: EdgeStoreProvider wraps our app in `app/layout.tsx` to make file uploads available throughout the application.

- **Image Uploads**: The editor component (`components/editor.tsx`) uses EdgeStore to upload images:
  ```typescript
  const handleUpload = async (file: File) => {
    const res = await edgestore.publicFiles.upload({
      file,
    });
    return res.url;
  };
  ```

- **Cover Images**: Users can upload cover images for documents, which are stored in EdgeStore and the URL is saved in the Convex database.

**Key Files:**
- `app/api/edgestore/[...edgestore]/route.ts` - EdgeStore API route
- `lib/edgestore.ts` - EdgeStore provider setup
- `components/editor.tsx` - Uses EdgeStore for image uploads
- `components/modals/CoverImageModal.tsx` - Uploads cover images via EdgeStore

---

## Blocknote

### What is Blocknote?

Blocknote is a block-based rich text editor (similar to Notion's editor). Instead of traditional text editing, content is organized into "blocks" (paragraphs, headings, lists, etc.) that can be easily rearranged and styled.

### How We're Using It

Blocknote powers our document editor:

- **Editor Component**: The main editor (`components/editor.tsx`) uses Blocknote:
  ```typescript
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });
  ```

- **Block-Based Editing**: Documents are stored as JSON arrays of blocks, allowing for rich formatting, nested structures, and easy manipulation.

- **File Uploads**: Blocknote integrates with EdgeStore to allow users to upload images directly into documents.

- **Theme Support**: The editor automatically switches between light and dark themes based on user preference.

- **Read-Only Mode**: The editor can be set to read-only mode for published documents, allowing public viewing without editing capabilities.

**Key Files:**
- `components/editor.tsx` - Main Blocknote editor component
- Documents store content as JSON strings of Blocknote blocks
- Used in `app/(main)/(routes)/documents/[documentId]/page.tsx` for editing

---

## How Everything Works Together

Here's how these technologies collaborate in our application:

1. **User Authentication Flow**:
   - User signs in via Clerk → Clerk verifies identity → Convex receives auth token → User can access their documents

2. **Document Creation**:
   - User creates document → Frontend calls Convex mutation → Convex saves to database → Real-time update appears in UI

3. **Content Editing**:
   - User types in Blocknote editor → Editor converts to JSON → Saves to Convex via mutation → Changes sync in real-time

4. **File Uploads**:
   - User uploads image → EdgeStore handles upload → Returns URL → URL saved in Convex database → Image appears in document

5. **Styling**:
   - Tailwind CSS provides utility classes → Shadcn UI components use Tailwind → Components styled consistently → Dark mode supported via Tailwind

6. **Type Safety**:
   - TypeScript ensures all data flows correctly → Convex generates types from schema → Components have typed props → Fewer bugs, better developer experience

---

## Summary

This tech stack provides:

- **Fast Development**: Next.js and TypeScript speed up development
- **Beautiful UI**: Tailwind CSS and Shadcn UI create a polished interface
- **Secure Authentication**: Clerk handles user management securely
- **Real-time Collaboration**: Convex enables instant data synchronization
- **File Management**: EdgeStore handles all file uploads seamlessly
- **Rich Editing**: Blocknote provides a modern, block-based editing experience

Together, these technologies create a modern, scalable, and user-friendly note-taking application.

