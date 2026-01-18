import React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, MetaFunction } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
//import tailwindUrl from "~/tailwind.css";
import "./tailwind.css";
import "./index.css";
import "~/styles/video-downloader.css";

// export const meta: MetaFunction = () => {
//   return [
//     { title: "New Remix App" },
//     { name: "description", content: "Welcome to Remix!" },
//   ];
// };
export const meta: MetaFunction = () => {
  return [
    { title: "YouTube Playlist Downloader" },
    { name: "description", content: "Ferramenta para baixar videos e audios de playlists do YouTube" },
  ];
};


// Removed MUI and Emotion integration; using Tailwind via link.

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  },
  //{ rel: "stylesheet", href: tailwindUrl }
  
];

//export function Layout({ children }: { children: React.ReactNode }) {
export default function App() {
  return (
    <html lang="pt-BR" className="bg-gray-900 text-black">
      <head>
        <meta charSet="utf-8" />        
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

