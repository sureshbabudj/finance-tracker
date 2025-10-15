import { Bell, Menu, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

import UserProfile from './UserProfile';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className='flex h-16 items-center justify-between border-b px-4'>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={toggleSidebar}
        >
          <Menu className='h-5 w-5' />
        </Button>
        <h1 className='text-xl font-semibold'>Financial Dashboard</h1>
      </div>

      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon'>
          <Bell className='h-5 w-5' />
        </Button>
        <Button variant='ghost' size='icon'>
          <Settings className='h-5 w-5' />
        </Button>
        <UserProfile />
      </div>
    </header>
  );
}
