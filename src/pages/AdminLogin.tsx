
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminLogin({ onLogin } : { onLogin: Function }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(); // navigate to dashboard
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-cream font-body">
      <form onSubmit={handleLogin} className="bg-white border-4 border-navy p-8 rounded shadow max-w-md w-full">
        <h2 className="text-2xl font-heading mb-4">Admin Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          className="w-full p-3 my-2 border rounded bg-cream"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-3 my-2 border rounded bg-cream"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-orange text-white w-full p-3 rounded hover:bg-navy mt-2">
          Log In 
        </button>
      </form>
    </div>
  );
}