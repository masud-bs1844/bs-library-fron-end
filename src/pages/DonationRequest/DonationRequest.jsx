// src/pages/ManageBooks/ManageBooks.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    Pencil,
    Trash2,
    AlertTriangle,
    Loader2,
    FileText,
    FileAudio2,
    CheckCircle2, // NEW
} from "lucide-react";

import api from "../../api";
import AdminDashboardSidebar from "../../components/AdminDashboardSidebar/AdminDashboardSidebar";
import UserSidebar from "../../components/UserSidebar/UserSidebar";

const PLACEHOLDER_IMG = "https://dummyimage.com/80x80/e5e7eb/9ca3af&text=📘";

// ---------- helpers ----------
function toYMD(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function normalizeBookData(item) {
    return {
        id: item.id,
        title: item.book_title ?? "—",
        author: item.author_name ?? "—",
        status: item.status ?? "—", // Keep actual ID here
        copies: item.number_of_copies,
        location: item.location,
        contact_number: item.contact_number,
        user_name: item.name ?? "—"
    };
}


export default function DonationRequest() {
    useEffect(() => {
        document.title = "Donation Requests";
    }, []);

    // --------- load books.json from PUBLIC ----------
    const [booksJson, setBooksJson] = useState([]);
    const fetchBooks = async () => {
        try {
            const response = await api.get("/donation/list");
            const normalizedBooks = response.data.map(normalizeBookData);
            setBooksJson(normalizedBooks);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };
    useEffect(() => {
        fetchBooks();
    }, []);

    // build table data (normalized)
    const baseBooks = useMemo(() => {
        return booksJson;
    }, [booksJson]);

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/category/list");
                // Assuming API returns: { data: [ { id, category_name }, ... ] }
                setCategories(res.data.categories || []);
                console.log("Fetched categories:", res.data.categories);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setCategories([]); // fallback
            }
        };
        fetchCategories();
    }, []);

    // displayed list (allows local add/edit/delete)
    const [displayed, setDisplayed] = useState([]);
    useEffect(() => setDisplayed(baseBooks), [baseBooks]);

    // --------- Add/Edit modal state ----------
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState("create"); // 'create' | 'edit'
    const [editingIndex, setEditingIndex] = useState(-1);

    // --------- Delete confirmation modal state ----------
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(-1);

    const options = useMemo(() => {
        const authors = new Set();
        const categories = new Set();
        baseBooks.forEach((b) => {
            if (b.author && b.author !== "—") authors.add(b.author);
            if (b.category && b.category !== "—") categories.add(b.category);
        });
        return {
            authors: Array.from(authors).sort(),
            categories: Array.from(categories).sort(),
        };
    }, [baseBooks]);

    // ------------ FORM (ordered fields) ------------
    const emptyForm = {
        book_title: "",
        author_name: "",
        number_of_copies: "",
        location: "",
        contact_number: "",
    };
    const [form, setForm] = useState(emptyForm);

    const rowToForm = (row) => ({
        book_title: row.title || "",
        author_name: row.author || "",
        number_of_copies: row.copies || "",
        location: row.location || "",
        contact_number: row.contact_number || "",
    });

    const onOpenCreate = () => {
        setMode("create");
        setEditingIndex(-1);
        setForm(emptyForm);
        setOpen(true);
    };

    const onOpenEdit = (row, index) => {
        setMode("edit");
        setEditingIndex(index);
        setForm(rowToForm(row));
        setOpen(true);
    };

    const onClose = useCallback(() => setOpen(false), []);
    const onCloseConfirm = useCallback(() => setConfirmOpen(false), []);

    // lock page scroll when any modal open
    useEffect(() => {
        const anyOpen = open || confirmOpen;
        document.body.style.overflow = anyOpen ? "hidden" : "";
    }, [open, confirmOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    // file inputs + 3s loader for image/pdf/audio
    const handleFile = (e, kind) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (kind === "image") {
            setForm((f) => ({ ...f, imageLoading: true }));
            const url = URL.createObjectURL(file);
            setTimeout(() => {
                setForm((f) => ({
                    ...f,
                    coverFile: file,
                    coverUrl: url,
                    imageLoading: false,
                }));
            }, 3000);
        } else if (kind === "pdf") {
            setForm((f) => ({ ...f, pdfLoading: true }));
            const url = URL.createObjectURL(file);
            setTimeout(() => {
                setForm((f) => ({
                    ...f,
                    pdfFile: file,
                    pdfUrl: url,
                    pdfLoading: false,
                }));
            }, 3000);
        } else if (kind === "audio") {
            setForm((f) => ({ ...f, audioLoading: true }));
            const url = URL.createObjectURL(file);
            setTimeout(() => {
                setForm((f) => ({
                    ...f,
                    audioFile: file,
                    audioUrl: url,
                    audioLoading: false,
                }));
            }, 3000);
        }
    };

    // NEW: Upload popup
    const [uploadOpen, setUploadOpen] = useState(false);

    // NEW: 2s "Saved" toast
    const [savedToast, setSavedToast] = useState(false);

    const handleSave = async () => {
        if (!form.book_title?.trim()) {
            alert("Please enter a book name.");
            return;
        }
        setSaving(true);

        try {
            if (mode === "edit" && editingIndex >= 0 && displayed[editingIndex]) {
                const bookId = displayed[editingIndex].id;
                if (!bookId) {
                    alert("Book ID not found for editing");
                    setSaving(false);
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append("book_title", form.book_title);
                    formData.append("author_name", form.author_name);
                    formData.append("category_id", Number(form.category));
                    formData.append("number_of_copies", Number(form.number_of_copies));
                    formData.append("location", form.location);
                    formData.append("contact_number", form.contact_number);
                    formData.append("short_description", form.description);
                    console.log("Submitting formData:", formData);
                    const response = await api.put(`/donation/edit/${bookId}`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    // Update local state with API response

                    const updatedRow = normalizeBookData(response.data.data);
                    setDisplayed((prev) => {
                        const next = [...prev];
                        next[editingIndex] = updatedRow;
                        return next;
                    });
                    await fetchBooks();
                    setOpen(false);
                    setSavedToast(true);
                    setTimeout(() => setSavedToast(false), 2000);

                } catch (error) {
                    console.error("Error updating book:", error);

                    const errorMsg = error.response?.data?.errors
                        ? Object.values(error.response.data.errors).flat().join("\n")
                        : error.response?.data?.message || error.message;
                    alert(errorMsg);
                } finally {
                    setSaving(false); // always reset saving state
                }
            } else {
                // ---------- CREATE NEW BOOK (API CALL) ----------
                const formData = new FormData();
                formData.append("book_title", form.book_title);
                formData.append("author_name", form.author_name);
                formData.append("category_id", Number(form.category));
                formData.append("number_of_copies", Number(form.number_of_copies));
                formData.append("location", form.location);
                formData.append("contact_number", form.contact_number);
                formData.append("short_description", form.description);
                const response = await api.post("/donation/create", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });


                // On success, add to local state
                await fetchBooks();
                const newRow = normalizeBookData(response.data.data);
                setDisplayed((prev) => [newRow, ...prev]);
            }

            setSaving(false);
            setOpen(false);

            // Show toast for 2s
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 2000);
        } catch (error) {
            console.error("Error saving book:", error);
            const errorMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join("\n")
                : error.response?.data?.message || error.message;
            alert(errorMsg);
        }
    };

    const requestDelete = (index) => {
        setPendingDeleteIndex(index);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingDeleteIndex < 0) return;

        const bookId = displayed[pendingDeleteIndex]?.id;
        if (!bookId) {
            console.error("No book ID found for deletion.");
            return;
        }

        try {
            // Call delete API
            await api.delete(`/book/delete/${bookId}`);

            // Remove from local state
            setDisplayed((prev) => prev.filter((_, i) => i !== pendingDeleteIndex));

            // Reset state
            setPendingDeleteIndex(-1);
            setConfirmOpen(false);
        } catch (error) {
            console.error("Error deleting book:", error);
            alert(
                error.response?.data?.message || "An error occurred while deleting the book."
            );
        }
    };

    const navItem =
        "flex items-center gap-2 px-3 py-3 text-gray-700 hover:text-sky-500 transition-colors";
    const navItemActive =
        "flex items-center gap-2 px-3 py-3 text-sky-600 font-medium";

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <UserSidebar active="upload" />

            {/* Main */}
            <main className="flex-1 p-6 space-y-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manage Donation Request</h1>

                {/* Card – soft shadow (no black border) */}
                <section className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">Books List</span>
                        {/* RIGHT BUTTONS */}
                        <div className="flex items-center gap-2">
                            {/* <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <Upload size={16} /> Upload
              </button> */}
                            <button
                                type="button"
                                onClick={onOpenCreate}
                                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                                <Plus size={16} /> Add Book
                            </button>
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-gray-50">
                                    <tr className="text-left">
                                        <th className="py-3 px-4">Book</th>
                                        <th className="py-3 px-4">Author</th>
                                        <th className="py-3 px-4 whitespace-nowrap">No of copy</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.map((b, i) => (
                                        <tr
                                            key={`${(b.title || "").toLowerCase()}__${(b.author || "")
                                                .toLowerCase()}__${i}`}
                                            className={`border-b last:border-0 ${i % 2 ? "bg-white" : "bg-gray-50"
                                                }`}
                                        >
                                            <td className="py-3 px-4 text-gray-700">{b.title}</td>
                                            <td className="py-3 px-4 text-gray-700">{b.author}</td>
                                            <td className="py-3 px-4 text-gray-700">{b.copies ?? "—"}</td>
                                            <td className="py-3 px-4 text-gray-700">{b.contact_number ?? "—"}</td>
                                            <td className="py-3 px-4 text-gray-700">{b.status ?? "—"}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenEdit(b, i)}
                                                        className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                                    >
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => requestDelete(i)}
                                                        className="inline-flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {displayed.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
                                                No books found in your data sources.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            {/* ---------- Add/Edit Book Modal (ordered fields) ---------- */}
            {open && (
                <div
                    className="fixed inset-0 z-50"
                    aria-modal="true"
                    role="dialog"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
                    <div className="absolute inset-0 flex items-start justify-center pt-8 md:pt-12">
                        <div
                            className="w-full max-w-3xl mx-4 rounded-lg bg-white shadow-lg
        opacity-0 translate-y-3 scale-[0.98] animate-[popIn_.22s_ease-out_forwards]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 flex items-center gap-2">
                                {mode === "edit" ? (
                                    <Pencil size={20} className="text-gray-700" />
                                ) : (
                                    <Plus size={20} className="text-gray-700" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {mode === "edit" ? "Edit Donation Request" : "Create Donation Request"}
                                </h3>
                            </div>

                            {/* Form */}
                            <div className="px-6 pb-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Book Title */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Book Title</label>
                                        <input
                                            name="book_title"
                                            value={form.book_title}
                                            onChange={handleChange}
                                            placeholder="Enter book title"
                                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    {/* Author Name */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Author Name</label>
                                        <input
                                            name="author_name"
                                            value={form.author_name}
                                            onChange={handleChange}
                                            placeholder="Enter author name"
                                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    {/* Number of Copies */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Number of Copies</label>
                                        <input
                                            name="number_of_copies"
                                            type="number"
                                            value={form.number_of_copies}
                                            onChange={handleChange}
                                            placeholder="Enter number of copies"
                                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Location</label>
                                        <input
                                            name="location"
                                            value={form.location}
                                            onChange={handleChange}
                                            placeholder="Enter library or drop-off location"
                                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    {/* Contact Number */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            name="contact_number"
                                            value={form.contact_number}
                                            onChange={handleChange}
                                            placeholder="+8801XXXXXXXXX"
                                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-6 py-4 flex justify-end gap-3 bg-white">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-md px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-70"
                                >
                                    {mode === "edit" ? (saving ? "Updating…" : "Update") : saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* ---------- Upload Popup ---------- */}
            {uploadOpen && (
                <div
                    className="fixed inset-0 z-50"
                    aria-modal="true"
                    role="dialog"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setUploadOpen(false);
                    }}
                >
                    <div className="absolute inset-0 bg-black/50 opacity-0 animate-[fadeIn_.2s_ease-out_forwards]" />
                    <div className="absolute inset-0 flex items-center justify-center px-4">
                        <div className="w-full max-w-md rounded-lg bg-white shadow-lg opacity-0 translate-y-2 animate-[popIn_.2s_ease-out_forwards]">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-800">Upload</h3>
                            </div>
                            <div className="px-6 py-5 space-y-3">
                                <p className="text-sm text-gray-600">
                                    Use the form inside <span className="font-medium">Add / Edit book</span> to attach the
                                    cover image, PDF, and audio clip. This popup is just a quick note for users.
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-white flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setUploadOpen(false)}
                                    className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------- Delete Confirmation Modal ---------- */}
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
                                                    {displayed[pendingDeleteIndex]?.title || "This book"}
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

            {/* NEW: Saved toast (2s) */}
            {savedToast && (
                <div
                    className="fixed bottom-6 right-6 z-[60] pointer-events-none animate-[toastIn_.25s_ease-out]"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <div className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white shadow-lg ring-1 ring-black/5 px-4 py-3">
                        <div className="mt-0.5">
                            <CheckCircle2 className="text-green-600" size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Saved</p>
                            <p className="text-xs text-gray-600">Your changes have been updated.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* animations */}
            <style>{`
        @keyframes fadeIn { to { opacity: 1 } }
        @keyframes popIn { to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
        </div>
    );
}
