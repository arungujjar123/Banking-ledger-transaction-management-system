import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';

// Shared shell for every signed-in page; the page itself renders into <Outlet />
export const AppLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      {/* min-w-0 lets wide tables scroll inside their card instead of stretching the page */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
