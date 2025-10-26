import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-center">
          <div className="text-20lg text-slate-600">
            © {year} <span className="font-semibold text-slate-800">Tajamal Hussain</span>. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 