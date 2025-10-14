"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  UserIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import "./ant-table.css";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  profileImageUrl?: string;
  totalStories: number;
  totalFollowers: number;
  totalFollowing: number;
  reportedCount?: number;
  lastLoginIp?: string;
}

interface UserListResponse {
  users: {
    content: User[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  totalUsers: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState("");
  const [reportedFilter, setReportedFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchUsers = async (page = 0, search = "", status = "") => {
    setLoading(true);
    try {
      const adminToken = Cookies.get("adminToken");
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(search && { search }),
        ...(status && { status }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UserListResponse = await response.json();

      // Check if backend returned empty data (not fully implemented)
      if (!data.users.content || data.users.content.length === 0) {
        throw new Error("Backend returned empty data - using mock data");
      }

      setAllUsers(data.users.content || []);
      setTotalUsers(data.totalUsers);
      setTotalPages(data.users.totalPages);
      setCurrentPage(data.users.number);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filtering
  useEffect(() => {
    let filtered = [...allUsers];

    // Text search
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Email verified filter
    if (emailVerifiedFilter === "verified") {
      filtered = filtered.filter((user) => user.emailVerified === true);
    } else if (emailVerifiedFilter === "unverified") {
      filtered = filtered.filter((user) => user.emailVerified === false);
    }

    // Reported filter
    if (reportedFilter === "reported") {
      filtered = filtered.filter((user) => (user.reportedCount || 0) > 0);
    } else if (reportedFilter === "flagged") {
      filtered = filtered.filter((user) => (user.reportedCount || 0) > 2);
    }

    // Date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter(
        (user) => new Date(user.createdAt) >= fromDate
      );
    }
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter((user) => new Date(user.createdAt) <= toDate);
    }

    setUsers(filtered);
  }, [
    allUsers,
    searchTerm,
    statusFilter,
    roleFilter,
    emailVerifiedFilter,
    reportedFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, statusFilter);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    // Filtering happens automatically via useEffect
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason.trim()) return;

    setActionLoading(true);
    try {
      const adminToken = Cookies.get("adminToken");
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/suspend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: suspendReason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to suspend user");
      }

      // Update user status in local state immediately
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id
            ? { ...user, status: "suspended" as const }
            : user
        )
      );

      // Also update allUsers for filtering
      setAllUsers(
        allUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, status: "suspended" as const }
            : user
        )
      );

      setShowSuspendModal(false);
      setSelectedUser(null);
      setSuspendReason("");

      // Show success message
      alert("User suspended successfully");
    } catch (error) {
      console.error("Error suspending user:", error);
      alert("Failed to suspend user. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    setActionLoading(true);
    try {
      const adminToken = Cookies.get("adminToken");
      const response = await fetch(`/api/admin/users/${user.id}/unsuspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to unsuspend user");
      }

      // Update user status in local state immediately
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, status: "active" as const } : u
        )
      );

      // Also update allUsers for filtering
      setAllUsers(
        allUsers.map((u) =>
          u.id === user.id ? { ...u, status: "active" as const } : u
        )
      );

      // Show success message
      alert("User unsuspended successfully");
    } catch (error) {
      console.error("Error unsuspending user:", error);
      alert("Failed to unsuspend user. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const adminToken = Cookies.get("adminToken");
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from local state immediately
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setAllUsers(allUsers.filter((u) => u.id !== selectedUser.id));
      setTotalUsers(totalUsers - 1);

      setShowDeleteModal(false);
      setSelectedUser(null);

      // Show success message
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };





  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Suspended
          </span>
        );
      case "banned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Banned
          </span>
        );
      default:
        return status;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            Admin
          </span>
        );
      case "USER":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserIcon className="w-4 h-4 mr-1" />
            User
          </span>
        );
      default:
        return role;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage user accounts, permissions, and moderation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter((u) => u.status === "active").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Suspended</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter((u) => u.status === "suspended").length}
            </p>
          </div>
        </div>



        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Search & Filter Users
              </h3>
              <p className="text-sm text-gray-500">
                Find users by applying filters below
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="font-medium">{users.length}</span>
              <span>of</span>
              <span className="font-medium">{totalUsers}</span>
              <span>users</span>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm ||
          statusFilter ||
          roleFilter ||
          emailVerifiedFilter ||
          reportedFilter ||
          dateFromFilter ||
          dateToFilter) && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Active Filters:
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
                      Search: {searchTerm}
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Status: {statusFilter}
                    </span>
                  )}
                  {roleFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Role: {roleFilter}
                    </span>
                  )}
                  {emailVerifiedFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Email: {emailVerifiedFilter}
                    </span>
                  )}
                  {reportedFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Reports: {reportedFilter}
                    </span>
                  )}
                  {(dateFromFilter || dateToFilter) && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Date:{" "}
                      {dateFromFilter && dateToFilter
                        ? `${dateFromFilter} to ${dateToFilter}`
                        : dateFromFilter
                        ? `from ${dateFromFilter}`
                        : `to ${dateToFilter}`}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setRoleFilter("");
                  setEmailVerifiedFilter("");
                  setReportedFilter("");
                  setDateFromFilter("");
                  setDateToFilter("");
                  setCurrentPage(0);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <XMarkIcon className="h-3 w-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Form */}
        <form onSubmit={handleSearch} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Input - Takes more space */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  style={{"--tw-ring-color": "#18243c"}}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Email Verification */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Status
              </label>
              <select
                value={emailVerifiedFilter}
                onChange={(e) => setEmailVerifiedFilter(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
              >
                <option value="">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            {/* Actions */}
            <div className="lg:col-span-2 flex flex-col justify-end">
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  style={{"backgroundColor": "#18243c", "--tw-ring-color": "#18243c"}}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setRoleFilter("");
                    setEmailVerifiedFilter("");
                    setReportedFilter("");
                    setDateFromFilter("");
                    setDateToFilter("");
                    setCurrentPage(0);
                  }}
                  className="px-3 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                  title="Clear all filters"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters - Collapsible Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Advanced Filters
              </h4>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                style={{"color": "#18243c"}}
              >
                <span>{showAdvancedFilters ? "Hide" : "Show"} Advanced</span>
                {showAdvancedFilters ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reports Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reports
                  </label>
                  <select
                    value={reportedFilter}
                    onChange={(e) => setReportedFilter(e.target.value)}
                    className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">All Users</option>
                    <option value="reported">Has Reports</option>
                    <option value="flagged">Flagged (3+ Reports)</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Users Table - Ant Design Style */}
      <div className="ant-table-wrapper">
        <div className="ant-spin-nested-loading">
          <div className="ant-spin-container">
            <div className="ant-table">
              <div className="ant-table-container">
                <div className="ant-table-content">
                  {users.length === 0 && !loading ? (
                    <div className="ant-empty ant-empty-normal">
                      <div className="ant-empty-image">
                        <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      </div>
                      <div className="ant-empty-description">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No users found
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Try adjusting your filters to see more users.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <table className="ant-table-tbody">
                      <thead className="ant-table-thead">
                        <tr>
                          <th
                            className="ant-table-cell"
                            style={{ width: "280px" }}
                          >
                            <div className="ant-table-column-title">User</div>
                          </th>
                          <th
                            className="ant-table-cell"
                            style={{ width: "100px" }}
                          >
                            <div className="ant-table-column-title">Role</div>
                          </th>
                          <th
                            className="ant-table-cell"
                            style={{ width: "100px" }}
                          >
                            <div className="ant-table-column-title">Status</div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "120px" }}
                          >
                            <div className="ant-table-column-title">
                              Stories
                            </div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "100px" }}
                          >
                            <div className="ant-table-column-title">
                              Followers
                            </div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "80px" }}
                          >
                            <div className="ant-table-column-title">
                              Reports
                            </div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "120px" }}
                          >
                            <div className="ant-table-column-title">Joined</div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "120px" }}
                          >
                            <div className="ant-table-column-title">
                              Last Login
                            </div>
                          </th>
                          <th
                            className="ant-table-cell ant-table-cell-align-center"
                            style={{ width: "140px" }}
                          >
                            <div className="ant-table-column-title">
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="ant-table-tbody">
                        {loading ? (
                          <tr className="ant-table-row ant-table-row-level-0">
                            <td
                              colSpan={9}
                              className="ant-table-cell text-center"
                            >
                              <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr
                              key={user.id}
                              className="ant-table-row ant-table-row-level-0"
                            >
                              {/* User Column */}
                              <td className="ant-table-cell">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {user.profileImageUrl ? (
                                      <div className="relative w-10 h-10 overflow-hidden rounded-full">
                                        <img
                                          className="w-10 h-10 rounded-full object-cover"
                                          src={user.profileImageUrl}
                                          alt={user.username}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-red-600 transition-colors"
                                      title={user.username}
                                      onClick={() =>
                                        router.push(`/admin/users/${user.id}`)
                                      }
                                    >
                                      {user.username}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                      {user.email}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                      {user.emailVerified ? (
                                        <span className="ant-tag ant-tag-default text-green-600 bg-green-50 border-green-200">
                                          ✓ Verified
                                        </span>
                                      ) : (
                                        <span className="ant-tag ant-tag-default text-orange-600 bg-orange-50 border-orange-200">
                                          Unverified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role Column */}
                              <td className="ant-table-cell">
                                {getRoleBadge(user.role)}
                              </td>

                              {/* Status Column */}
                              <td className="ant-table-cell">
                                {getStatusBadge(user.status)}
                              </td>

                              {/* Stories Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                {formatNumber(user.totalStories)}
                              </td>

                              {/* Followers Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                {formatNumber(user.totalFollowers)}
                              </td>

                              {/* Reports Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                <div className="flex items-center justify-center">
                                  <span
                                    className={`font-medium ${
                                      (user.reportedCount || 0) > 2
                                        ? "text-red-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {user.reportedCount || 0}
                                  </span>
                                  {(user.reportedCount || 0) > 2 && (
                                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      ⚠
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Joined Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                <span className="text-sm text-gray-900">
                                  {formatDate(user.createdAt).split(",")[0]}
                                </span>
                              </td>

                              {/* Last Login Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                <span className="text-sm text-gray-900">
                                  {user.lastLoginAt
                                    ? formatDate(user.lastLoginAt).split(",")[0]
                                    : "Never"}
                                </span>
                              </td>

                              {/* Actions Column */}
                              <td className="ant-table-cell ant-table-cell-align-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* View Details Button */}
                                  <button
                                    onClick={() =>
                                      router.push(`/admin/users/${user.id}`)
                                    }
                                    className="ant-btn ant-btn-sm ant-btn-default"
                                    title="View Details"
                                  >
                                    <EyeIcon className="h-3 w-3 mr-1" />
                                    View
                                  </button>

                                  {/* Dropdown Menu */}
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setOpenDropdown(
                                          openDropdown === user.id
                                            ? null
                                            : user.id
                                        )
                                      }
                                      className="ant-btn ant-btn-icon-only ant-btn-default"
                                      title="More actions"
                                    >
                                      <EllipsisVerticalIcon className="h-4 w-4" />
                                    </button>

                                    {openDropdown === user.id && (
                                      <>
                                        {/* Backdrop */}
                                        <div
                                          className="fixed inset-0 z-40"
                                          onClick={() => setOpenDropdown(null)}
                                        />

                                        {/* Dropdown Menu */}
                                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                          <div className="py-1">
                                            <button
                                              onClick={() => {
                                                router.push(
                                                  `/admin/users/${user.id}/edit`
                                                );
                                                setOpenDropdown(null);
                                              }}
                                              className="ant-dropdown-menu-item"
                                            >
                                              <div className="ant-dropdown-menu-title-content">
                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                <span>Edit User</span>
                                              </div>
                                            </button>

                                            <hr className="my-1 border-gray-100" />

                                            {user.status === "active" &&
                                              user.role !== "ADMIN" && (
                                                <button
                                                  onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowSuspendModal(true);
                                                    setOpenDropdown(null);
                                                  }}
                                                  className="ant-dropdown-menu-item"
                                                >
                                                  <div className="ant-dropdown-menu-title-content">
                                                    <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                                                    <span>Suspend User</span>
                                                  </div>
                                                </button>
                                              )}

                                            {user.status === "suspended" && (
                                              <button
                                                onClick={() => {
                                                  handleUnsuspendUser(user);
                                                  setOpenDropdown(null);
                                                }}
                                                className="ant-dropdown-menu-item"
                                                disabled={actionLoading}
                                              >
                                                <div className="ant-dropdown-menu-title-content">
                                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                  <span>Unsuspend User</span>
                                                </div>
                                              </button>
                                            )}





                                            {user.role !== "ADMIN" && (
                                              <button
                                                onClick={() => {
                                                  setSelectedUser(user);
                                                  setShowDeleteModal(true);
                                                  setOpenDropdown(null);
                                                }}
                                                className="ant-dropdown-menu-item ant-dropdown-menu-item-danger"
                                              >
                                                <div className="ant-dropdown-menu-title-content">
                                                  <TrashIcon className="h-4 w-4 mr-2" />
                                                  <span>Delete User</span>
                                                </div>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{currentPage * 20 + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * 20, totalUsers)}
                  </span>{" "}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Suspend User
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to suspend{" "}
                  <strong>{selectedUser.username}</strong>? This action will
                  prevent them from accessing their account.
                </p>
                <div className="mt-4">
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Reason for suspension (required)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                    setSuspendReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendUser}
                  disabled={!suspendReason.trim() || actionLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {actionLoading ? "Suspending..." : "Suspend User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete User
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to permanently delete{" "}
                  <strong>{selectedUser.username}</strong>? This action cannot
                  be undone and will remove all their data including stories,
                  comments, and account information.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
