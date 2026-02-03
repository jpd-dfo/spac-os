import { NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, sessionId } = await auth();
  const user = await currentUser();

  return NextResponse.json({
    userId,
    sessionId,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    userName: user?.firstName,
    timestamp: new Date().toISOString(),
  });
}
