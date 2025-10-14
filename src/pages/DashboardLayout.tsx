import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

function DashboardLayout() {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className='flex-1 overflow-hidden'>
          <AppHeader />
          <Outlet />
        </main>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

export default DashboardLayout;
