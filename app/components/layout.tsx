// app/components/Layout.tsx
import { Link } from "@remix-run/react";

export default function Layout({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="layout bg-gray-800 min-h-screen text-white">
      <header className="page-header bg-gray-900 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">YouTube Downloader & Jellyfin Manager</h1>
          <nav className="topnav flex gap-4">
            <Link to="/" className="px-3 py-2 rounded hover:bg-gray-700">Home</Link>
            <Link to="/jellyfinn" className="px-3 py-2 rounded hover:bg-gray-700">Biblioteca Jellyfin</Link>
            <Link to="/editar" className="px-3 py-2 rounded hover:bg-gray-700">Editor de Playlist</Link>
          </nav>
        </div>
      </header>

      <main className="page-content container mx-auto p-4">
        {title && <h2 className="text-xl font-bold mb-6">{title}</h2>}
        {children}
      </main>

      <footer className="bg-gray-900 p-4 mt-auto">
        <div className="container mx-auto text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} YouTube Downloader & Jellyfin Manager
        </div>
      </footer>
    </div>
  );
}