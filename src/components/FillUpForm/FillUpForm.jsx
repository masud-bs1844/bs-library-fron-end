




// FillUpForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Upload, Users, BookOpen, HelpCircle, LogOut } from "lucide-react";
import api from "../../api"; // your axios instance from api.js
import Sidebar from "../Sidebar/Sidebar";

export default function FillUpForm() {
  const { id } = useParams(); // assume /fillup-form/:id route
  const [book, setBook] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  // Helper: compute whole-day difference from TODAY to return date
  const calcBorrowDays = (returnDateStr) => {
    if (!returnDateStr) return "";
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const rtn = new Date(returnDateStr);
    const end = new Date(rtn.getFullYear(), rtn.getMonth(), rtn.getDate());
    const diffMs = end - start;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/book/retrieve/${id}`);
        setBook(res.data.data);
      } catch (err) {
        console.error("Error fetching book:", err);
      }
    };
    fetchBook();
  }, [id]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "returnDate") {
      const autoDays = calcBorrowDays(value);
      setFormData({
        ...formData,
        returnDate: value,
        days: autoDays,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit borrow request
  const handleSubmit = async () => {
    if (!formData.returnDate) {
      alert("Please select a return date.");
      return;
    }

    try {
      await api.post("/borrow/create", {
        book_id: book.id,
        return_date: formData.returnDate,
      });
      alert("Book borrowed successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error creating borrow request:", err);
      alert("Failed to borrow book.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Fill Up Book Borrow Form</h1>

        {book ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start gap-6">
              <img
                src={book.book_cover_url}
                alt={book.name}
                className="w-28 h-36 object-cover rounded"
              />

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">{book.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                <div className="bg-gray-50 border border-dashed border-gray-300 p-3 rounded mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Available Copies:</span> {book.available_copies}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Borrowing Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Borrowing Days
                    </label>
                    <div className="w-full border rounded px-3 py-2 bg-gray-50">
                      {formData.days ?? "—"}
                    </div>
                  </div>

                  {/* Return Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      className="w-full border rounded px-3 py-2"
                      value={formData.returnDate || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading book details...</p>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={handleSubmit}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-md"
          >
            Booked
          </button>
        </div>
      </main>
    </div>
  );
}
