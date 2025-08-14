import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home/Home';
import Navbar from './components/Navbar/Navbar';
import BookDetails from './pages/BookDetails/BookDetails';
import Layout from './components/Layout/Layout';
import Borrowed from './pages/Borrowed/Borrowed';
import FillUpForm from './components/FillUpForm/FillUpForm';
import Dashboard from './pages/Dashboad/Dashboad';
import UploadBookPage from './components/Upload/UploadBookPage';
import AllGenres from './pages/AllGenres/AllGenres';
import ManageBooks from './pages/ManageBooks/ManageBooks';
import ManageCategory from './pages/ManageCategory/ManageCategory';
import AuthCallback from './pages/auth/AuthCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import DashRouter from './routes/DashRouter';
import UserDashboard from './pages/user/UserDashboard';

function App() {
  return (
    <BrowserRouter>
      < Navbar />
      <main className="flex-grow">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/book/:id" element={<BookDetails />} /> {/* <-- ADD THE NEW ROUTE */}
            <Route path="/borrowed" element={<Borrowed />} />
            <Route path="/fill-up-form/:id" element={<FillUpForm />} />
            <Route path="/upload" element={<UploadBookPage />} />
            <Route path="/all-genres" element={<AllGenres />} />
            <Route path="/manage-books" element={<ManageBooks />} />
            <Route path="/manage-category" element={<ManageCategory />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <DashRouter />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/app" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
