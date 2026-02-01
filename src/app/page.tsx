import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    // If authenticated, redirect to dashboard
    redirect('/dashboard');
  } else {
    // If not authenticated, redirect to sign-in
    redirect('/sign-in');
  }
}
