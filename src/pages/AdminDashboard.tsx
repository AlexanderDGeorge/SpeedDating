
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "../types";

export default function AdminDashboard() {
  const [registrants, setRegistrants] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "registrants"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      setRegistrants(data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 font-body bg-cream min-h-screen">
      <h1 className="text-3xl font-heading mb-4">Admin Dashboard</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Age</th>
            <th className="p-2 border">Gender</th>
            <th className="p-2 border">Group</th>
            <th className="p-2 border">Matched</th>
          </tr>
        </thead>
        <tbody>
          {registrants.map((r) => (
            <tr key={r.id} className="bg-cream text-navy">
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.age}</td>
              <td className="p-2 border">{r.gender}</td>
              <td className="p-2 border">{r.group}</td>
              <td className="p-2 border">
                <input type="checkbox" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}