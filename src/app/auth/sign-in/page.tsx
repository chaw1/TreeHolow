import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            card: "bg-white shadow-lg",
            headerTitle: "text-2xl font-bold text-gray-800",
          }
        }}
      />
    </div>
  );
}