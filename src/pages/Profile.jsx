"use client"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Profile() {
  // ---------- State ----------
  const [profileImage, setProfileImage] = useState(null)
  const [name, setName] = useState("John Doe")
  const [email, setEmail] = useState("john.doe@example.com")
  const [isEditing, setIsEditing] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [message, setMessage] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // ---------- Effects ----------
  useEffect(() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      const parsedData = JSON.parse(userData)
      setName(parsedData.fullName || parsedData.name || "John Doe")
      setEmail(parsedData.email || "john.doe@example.com")
    }
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3500)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ---------- Handlers ----------
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfileImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    setMessage("You have been logged out.")
    setTimeout(() => navigate("/login"), 3500)
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAccount = () => {
    setShowDeleteConfirm(false)
    setMessage("Account deleted successfully.")
    setTimeout(() => navigate("/signup"), 3500)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.")
      return
    }
    setMessage("Password changed successfully.")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowPasswordForm(false)
  }

  const handleSaveProfile = () => {
    const userData = { name, email }
    localStorage.setItem("userData", JSON.stringify(userData))
    setIsEditing(false)
    setMessage("Profile information updated successfully.")
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#F4F4F4] relative">
      {/* Success/Error Banner */}
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#34D399] text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#142D4C] p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Are you sure?</h2>
            <p className="text-gray-300 mb-6">
              Do you really want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDeleteAccount}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-12">Profile Settings</h1>

        {/* -------- Profile Photo -------- */}
        <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Profile Photo</h2>
          <div className="flex items-center gap-8">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-[#34D399] shadow-lg shadow-[#34D399]/30 overflow-hidden bg-[#0D1B2A] flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg
                  className="h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Option */}
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">Update your profile photo</h3>
              <p className="text-gray-400 text-sm mb-4">
                Upload from your device. Recommended size: 400x400px
              </p>
              <div className="flex gap-3">
                <label className="inline-block rounded-lg bg-[#34D399] px-6 py-2 text-sm font-semibold text-white hover:bg-[#2bb380] transition-all shadow-lg shadow-[#34D399]/30 cursor-pointer">
                  Choose from Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Personal Information -------- */}
        <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Personal Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-lg border border-[#34D399] px-4 py-2 text-sm font-medium text-[#34D399] hover:bg-[#34D399]/10 transition-all"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg bg-[#0D1B2A] border border-[#1F3B5A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg bg-[#0D1B2A] border border-[#1F3B5A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {isEditing && (
              <button
                onClick={handleSaveProfile}
                className="rounded-lg bg-[#34D399] px-6 py-3 font-semibold text-white hover:bg-[#2bb380] transition-all shadow-lg shadow-[#34D399]/30"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* -------- Account Statistics -------- */}
        <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Account Statistics</h2>
          <div className="grid grid-cols-3 gap-6">
            <StatCard value="24" label="Total Scans" />
            <StatCard value="12" label="Recent Sessions" />
            <StatCard value="3" label="Devices Connected" />
          </div>
        </div>

        {/* -------- Security Settings -------- */}
        <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-8">
          <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
          <div className="space-y-4">
            <SecurityButton
              title="Change Password"
              subtitle="Update your account password"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            />
            {showPasswordForm && (
              <form
                onSubmit={handleChangePassword}
                className="space-y-4 p-4 bg-[#0D1B2A] rounded-lg border border-[#1F3B5A]"
              >
                <input
                  type="password"
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2 bg-[#142D4C] border border-[#1F3B5A] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2 bg-[#142D4C] border border-[#1F3B5A] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2 bg-[#142D4C] border border-[#1F3B5A] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#34D399] px-6 py-2 text-white font-semibold hover:bg-[#2bb380] transition-all"
                >
                  Save Changes
                </button>
              </form>
            )}

            <SecurityButton
              title="Log Out"
              subtitle="End your session and log out"
              onClick={handleLogout}
              color="red"
            />
            <SecurityButton
              title="Delete Account"
              subtitle="Permanently remove your account"
              onClick={handleDeleteAccount}
              color="red"
              danger
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Reusable Subcomponents ---------------- */
function StatCard({ value, label }) {
  return (
    <div className="text-center p-6 rounded-lg bg-[#0D1B2A] border border-[#1F3B5A]">
      <div className="text-3xl font-bold text-[#34D399] mb-2">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function SecurityButton({ title, subtitle, onClick, color = "green", danger }) {
  const colorClasses =
    color === "red"
      ? danger
        ? "text-red-500 group-hover:text-red-400 hover:border-red-500"
        : "text-red-400 group-hover:text-red-300 hover:border-red-400"
      : "group-hover:text-[#34D399] hover:border-[#34D399]"

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg bg-[#0D1B2A] border border-[#1F3B5A] 
                 px-6 py-4 transition-all group ${colorClasses}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium transition-colors">{title}</div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
      </div>
    </button>
  )
}
