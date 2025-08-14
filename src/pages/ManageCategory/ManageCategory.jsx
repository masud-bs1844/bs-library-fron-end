import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Upload,
  Users,
  BookOpen,
  HelpCircle,
  LogOut,
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle, // NEW: for delete confirm
} from "lucide-react";
import sectionedBooks from "../../data/sampleBooks";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import api from "../../api";
// seed (only used if no categories found) — status removed
const seedCategories = [
  { id: 1, name: "Web Design", slug: "web-design" },
  { id: 2, name: "Web Development", slug: "web-development" },
  { id: 3, name: "Programming", slug: "programming" },
  { id: 4, name: "Commerce", slug: "commerce" },
];

// helper: slugify category names
const slugify = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function ManageCategory() {
  useEffect(() => {
    document.title = "Manage Category";
  }, []);

  // Load books.json (public)
  const [booksJson, setBooksJson] = useState([]);
  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}books.json`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBooksJson(Array.isArray(data) ? data : []))
      .catch(() => setBooksJson([]));
  }, []);

  // Build unique category list from sampleBooks + books.json
  const computedCategories = useMemo(() => {
    const set = new Set();

    if (sectionedBooks && typeof sectionedBooks === "object") {
      Object.values(sectionedBooks).forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((item) => {
            if (item && item.category) set.add(String(item.category).trim());
          });
        }
      });
    }

    booksJson.forEach((b) => {
      if (b && b.category) set.add(String(b.category).trim());
    });

    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (list.length === 0) return seedCategories;

    return list.map((name, i) => ({
      id: i + 1,
      name,
      slug: slugify(name),
    }));
  }, [booksJson]);

  // Local rows (so add/edit/delete reflect immediately)
  const [categories, setCategories] = useState(seedCategories);
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/category/list");
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Modal state (Add / Edit)
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'edit'
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState({ name: "" }); // status removed

  const onOpenCreate = () => {
    setMode("create");
    setEditingIndex(-1);
    setForm({ name: "" });
    setOpen(true);
  };
  const onOpenEdit = (row, index) => {
    setMode("edit");
    setEditingIndex(index);
    setForm({ name: row.category_name || "" });
    setOpen(true);
  };
  const onClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Saved toast (2s)
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Please enter a category name.");
      return;
    }

    const newCategory = {
      category_name: form.name.trim(),
      slug: slugify(form.name),
    };

    if (mode === "edit" && editingIndex > -1) {
      try {
        const id = categories[editingIndex].id;
        await api.put(`/category/update/${id}`, {
          category_name: newCategory.category_name,
        });

        // Update local state
        setCategories((prev) => {
          const next = [...prev];
          next[editingIndex] = { ...prev[editingIndex], ...newCategory };
          return next;
        });

        setOpen(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);

      } catch (error) {
        console.error("Error updating category:", error);
        alert(
          error.response?.data?.message ||
          "Failed to update category. Please try again."
        );
      }
    } else {
      // CREATE mode: call API to create
      try {
        const response = await api.post("/category/create", newCategory);
        const createdCategory = response.data.category; // adjust if your API returns differently

        // Add to local state
        setCategories((prev) => [...prev, createdCategory]);

        setOpen(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);

      } catch (error) {
        console.error("Error creating category:", error);
        alert(
          error.response?.data?.message ||
          "Failed to create category. Please try again."
        );
      }
    }
  };

  // Delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(-1);

  const requestDelete = (index) => {
    setPendingDeleteIndex(index);
    setConfirmOpen(true);
  };
  const onCloseConfirm = () => {
    setPendingDeleteIndex(-1);
    setConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (pendingDeleteIndex < 0) return;

    const categoryToDelete = categories[pendingDeleteIndex];

    try {
      // Call API to delete
      await api.delete(`/category/delete/${categoryToDelete.id}`);

      // Remove from local state only if API succeeds
      setCategories((prev) =>
        prev.filter((_, i) => i !== pendingDeleteIndex)
      );

      setPendingDeleteIndex(-1);
      setConfirmOpen(false);

    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        error.response?.data?.message ||
        "Failed to delete category. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar — identical styling */}
      <AdminDashboardSidebar />

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Manage Category
          </h1>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div className="bg-white rounded shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3 px-4 min-w-[80px]">#</th>
                  <th className="py-3 px-4 min-w-[220px]">Category</th>
                  <th className="py-3 px-4 min-w-[160px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  console.log(c),
                  <tr key={`${c.slug}__${idx}`} className="border-b last:border-0 even:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{c.category_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(c, idx)}  // EDIT FORM
                          className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(idx)}  // DELETE POPUP
                          className="inline-flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-xs text-gray-500 md:hidden">
            Tip: swipe horizontally to see all columns.
          </div>
        </div>
      </main>

      {/* -------- Modal: Add/Edit Category (matches your screenshot) -------- */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          {/* Panel */}
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <div className="w-full max-w-2xl mx-4 rounded-lg bg-white shadow-lg border border-gray-200 opacity-0 translate-y-2 animate-[popIn_.22s_ease-out_forwards]">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                {/* Screenshot shows plus icon even on Edit, so we keep Plus */}
                <Plus size={20} className="text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {mode === "edit" ? "Edit category" : "Add category"}
                </h3>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Type category name"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
                {/* Order per screenshot: Save first, then Close */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Delete Confirmation Modal (wired up) -------- */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseConfirm();
          }}
        >
          <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg opacity-0 translate-y-2 animate-[popIn_.2s_ease-out_forwards]">
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Are you sure you want to delete this record?
                    </h3>
                    {pendingDeleteIndex > -1 && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">
                          {categories[pendingDeleteIndex]?.name || "This category"}
                        </span>{" "}
                        will be permanently removed from the list.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseConfirm}
                  className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Saved Toast (2s) -------- */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]">
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white shadow-lg ring-1 ring-black/5 px-4 py-3">
            <div className="mt-0.5">
              <CheckCircle2 className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Saved</p>
              <p className="text-xs text-gray-600">Category has been updated.</p>
            </div>
          </div>
        </div>
      )}

      {/* animations */}
      <style>{`
        @keyframes fadeIn { to { opacity: 1 } }
        @keyframes popIn { to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}