// src/pages/user/UserDashboard.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, LogOut } from "lucide-react";

export default function UserDashboard() {
  useEffect(() => {
    document.title = "My Library";
  }, []);

  // demo data (replace with API later)
  const myLoans = [
    { id: "LO-2311", title: "Core Java", due: "2025-08-20", status: "Borrowed" },
    { id: "LO-2310", title: "SQL in 10 Minutes", due: "2025-08-10", status: "Overdue" },
  ];
  const counts = {
    borrowed: myLoans.filter((x) => x.status === "Borrowed").length,
    overdue: myLoans.filter((x) => x.status === "Overdue").length,
    returned: 3,
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Slimmer sidebar for users */}
      <aside className="w-60 bg-white shadow-md px-4 py-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">My Library</h2>
          <ul className="space-y-3">
            <li>
              <Link to="/app" className="flex items-center gap-2 text-sky-600 font-medium">
                <BookOpen size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/app/loans" className="flex items-center gap-2 text-gray-700 hover:text-sky-500">
                <Clock size={18} /> My Loans
              </Link>
            </li>
            <li>
              <Link to="/app/history" className="flex items-center gap-2 text-gray-700 hover:text-sky-500">
                <CheckCircle size={18} /> History
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <Link to="/logout" className="flex items-center gap-2 text-red-600 font-medium hover:underline underline-offset-4">
            <LogOut size={18} /> Logout
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome back!</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-sm text-gray-500">Borrowed</p>
            <p className="text-xl font-bold text-gray-800">{counts.borrowed}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-xl font-bold text-red-600">{counts.overdue}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-sm text-gray-500">Returned</p>
            <p className="text-xl font-bold text-gray-800">{counts.returned}</p>
          </div>
        </div>

        {/* My Loans */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">My current loans</h3>
            <Link to="/app/loans" className="text-xs text-green-600 hover:underline">
              View All
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Loan #</th><th>Title</th><th>Due</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myLoans.map((l) => (
                <tr key={l.id} className="border-b">
                  <td>{l.id}</td>
                  <td className="font-medium">{l.title}</td>
                  <td>{l.due}</td>
                  <td className={l.status === "Overdue" ? "text-red-600" : "text-gray-700"}>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick search placeholder */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Find a book</h3>
          <input
            placeholder="Search by title, author, ISBN…"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </main>
    </div>
  );
}