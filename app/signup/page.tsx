"use client";

import { useState,type SyntheticEvent  } from "react";
import { account, tablesDB } from "@/lib/appwrite";
import { ID } from "appwrite";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      // Create Appwrite account
      const user = await account.create({
        userId: ID.unique(),
        email,
        password,
        name,
      });

      // Login immediately after signup
      await account.createEmailPasswordSession({
        email,
        password,
      });

      // Save user information in Profiles table
      await tablesDB.createRow({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILES_TABLE_ID!,
        rowId: user.$id,
        data: {
          userId: user.$id,
          name: name,
          email: email,
        },
      });

      // Go to chat
      window.location.href = "/chat";
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Create Account
        </h1>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Sign Up
          </button>
        </form>
      </div>
    </main>
  );
}