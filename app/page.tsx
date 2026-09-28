import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Real-Time Chat App
        </h1>

        <p className="mt-4 text-gray-600">
          Connect and chat with people in real time.
        </p>

        <Link
          href="/login"
          className="inline-block mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}