export default function TestPage() {
  return (
    <div style={{ padding: '50px', backgroundColor: 'white' }}>
      <h1 style={{ fontSize: '24px', color: 'black' }}>SPAC OS Test Page</h1>
      <p style={{ color: 'gray' }}>If you can see this, Next.js is working correctly!</p>
      <a href="/sign-in" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go to Sign In
      </a>
    </div>
  );
}
