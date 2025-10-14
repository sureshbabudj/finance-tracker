import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-6 bg-background'>
      <AlertTriangle className='w-16 h-16 text-destructive' />
      <h1 className='text-3xl font-bold'>404 - Page Not Found</h1>
      <p className='text-muted-foreground'>
        Sorry, the page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link to='/'>
          <Home className='mr-2 h-4 w-4' />
          Go to Home
        </Link>
      </Button>
    </div>
  );
}
