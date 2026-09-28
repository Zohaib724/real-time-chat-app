"use client";

import { useEffect, useRef,useState } from "react";
import { account, tablesDB, realtime } from "@/lib/appwrite";
import { ID, Query, Channel, type Models } from "appwrite";

interface Profile extends Models.Row {
  userId: string;
  name: string;
  email: string;
}

interface Message extends Models.Row {
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  content: string;
}

export default function Chat() {
  const [currentUser, setCurrentUser] =
    useState<Models.User<Models.Preferences> | null>(null);

  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Load current user and all other users
  useEffect(() => {
    const loadChat = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);

        const response = await tablesDB.listRows<Profile>({
          databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          tableId: process.env.NEXT_PUBLIC_APPWRITE_PROFILES_TABLE_ID!,
          queries: [Query.limit(100)],
        });

        const otherUsers = response.rows.filter(
          (profile) => profile.userId !== user.$id
        );

        setUsers(otherUsers);
      } catch (error: any) {
        console.error(error);

        if (error.code === 401) {
          window.location.href = "/login";
          return;
        }

        setError(error.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, []);

  // Load messages when a user is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser || !selectedUser) {
        return;
      }

      setMessagesLoading(true);
      setError("");

      try {
        const conversationId = [
          currentUser.$id,
          selectedUser.userId,
        ]
          .sort()
          .join("_");

        const response = await tablesDB.listRows<Message>({
          databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          tableId: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_TABLE_ID!,
          queries: [
            Query.equal("conversationId", conversationId),
            Query.limit(100),
          ],
        });

        const sortedMessages = [...response.rows].sort(
          (a, b) =>
            new Date(a.$createdAt).getTime() -
            new Date(b.$createdAt).getTime()
        );

        setMessages(sortedMessages);
      } catch (error: any) {
        console.error(error);
        setError(error.message || "Could not load messages.");
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [currentUser, selectedUser]);

  // Realtime subscription
useEffect(() => {
  if (!currentUser || !selectedUser) {
    return;
  }

  const subscribeToMessages = async () => {
    try {
      const conversationId = [
        currentUser.$id,
        selectedUser.userId,
      ]
        .sort()
        .join("_");

      const subscription = await realtime.subscribe(
        Channel.tablesdb(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
        )
          .table(
            process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_TABLE_ID!
          )
          .row()
          .create(),
        (response) => {
          const newMessage = response.payload as Message;

          if (newMessage.conversationId !== conversationId) {
            return;
          }

          setMessages((prev) => {
            const alreadyExists = prev.some(
              (message) => message.$id === newMessage.$id
            );

            if (alreadyExists) {
              return prev;
            }

            return [...prev, newMessage];
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error("Realtime subscription error:", error);
    }
  };

  let subscription: any;

  subscribeToMessages().then((result) => {
    subscription = result;
  });

  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}, [currentUser, selectedUser]);

// Auto-scroll to the latest message
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

  // Send a message
  const handleSendMessage = async () => {
    if (!currentUser || !selectedUser) {
      return;
    }

    const content = messageText.trim();

    if (!content) {
      return;
    }

    try {
      const conversationId = [
        currentUser.$id,
        selectedUser.userId,
      ]
        .sort()
        .join("_");

      const newMessage = await tablesDB.createRow<Message>({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        tableId: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_TABLE_ID!,
        rowId: ID.unique(),

        

        data: {
          conversationId,
          senderId: currentUser.$id,
          receiverId: selectedUser.userId,
          senderName: currentUser.name || currentUser.email,
          content,
        },
      });

      setMessages((prev) => {
        const alreadyExists = prev.some(
        (message) => message.$id === newMessage.$id
        );

        if (alreadyExists) {
         return prev;
        }

        return [...prev, newMessage];
    });
      setMessageText("");
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Message could not be sent.");
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* USERS SIDEBAR */}
        <aside className="w-80 border-r border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Real-Time Chat
              </h1>

              {currentUser && (
                <p className="mt-1 text-sm text-gray-500">
                  {currentUser.name || currentUser.email}
                </p>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
            >
              Logout
            </button>
          </div>

          <div className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">
              USERS
            </h2>

            {loading && (
              <p className="text-sm text-gray-500">
                Loading users...
              </p>
            )}

            {error && (
              <p className="mb-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full rounded-lg p-3 text-left transition ${
                    selectedUser?.userId === user.userId
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {user.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CHAT AREA */}
        <section className="flex flex-1 flex-col">

          {!selectedUser ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome to Real-Time Chat
                </h2>

                <p className="mt-2 text-gray-500">
                  Select a user to start a conversation.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div className="border-b border-gray-200 bg-white p-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.name}
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedUser.email}
                </p>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-6">

                {messagesLoading && (
                  <p className="text-center text-gray-500">
                    Loading messages...
                  </p>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <p className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                )}

                <div className="space-y-3">
                  {messages.map((message) => {
                    const isMine =
                      message.senderId === currentUser?.$id;

                    return (
                      <div
                        key={message.$id}
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-md rounded-xl px-4 py-3 ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900"
                          }`}
                        >
                          <p className="text-sm font-semibold">
                            {message.senderName}
                          </p>

                          <p className="mt-1">
                            {message.content}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              isMine
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(
                              message.$createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE INPUT */}
              <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={handleSendMessage}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}