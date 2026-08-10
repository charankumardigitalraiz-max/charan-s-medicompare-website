import React, { useState, useEffect } from "react";
import { axiosUserInstance } from "../../Apiservice";
import toast from "react-hot-toast";
import { Table, Pagination } from "../../components/ui";

const Notifications = ({ HomeNavigate, BackButton }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [allNotifications, setAllNotifications] = useState([]);
  const notificationsPerPage = 12;

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("medicomparestoken");
      try {
        const response = await axiosUserInstance.get("notifications/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setAllNotifications(response.data.data.notifications);
        }
      } catch (error) {
        toast.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    markAllNotificationsAsRead();
  }, []);

  const filteredNotifications = allNotifications.filter((nt) =>
    nt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nt.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nt._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("medicomparestoken");
    try {
      const response = await axiosUserInstance.post("notifications/mark-all-read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setAllNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            read: true
          }))
        );
        const updatedCount = response.data.data?.updatedCount || 0;
        window.dispatchEvent(new CustomEvent('updateUnreadCount', {
          detail: { unreadCount: updatedCount }
        }));

      }
    } catch (error) {
      toast.error("Error marking notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    const token = localStorage.getItem("medicomparestoken");
    try {
      const response = await axiosUserInstance.delete(`notifications/delete/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success(response.data.message || "Notification deleted successfully");
        setAllNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification._id !== notificationId)
        );
        const deletedNotification = allNotifications.find(nt => nt._id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          window.dispatchEvent(new CustomEvent('updateUnreadCount', {
            detail: { unreadCount: Math.max(0, (allNotifications.filter(nt => !nt.read).length - 1)) }
          }));
        }
      } else {
        toast.error(response.data.message || "Failed to delete notification");
      }
    } catch (error) {
      toast.error("Error deleting notification:", error);
    }
  };
  const headers = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      className: "whitespace-nowrap"
    },
    {
      key: "title",
      label: "Title",
      render: (value, row) => (
        <span className={!row.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}>
          {value}
        </span>
      )
    },
    {
      key: "message",
      label: "Message",
      className: "max-w-[280px] break-words"
    },
    {
      key: "read",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-semibold border ${!value
              ? "bg-amber-50 text-amber-500 border-amber-200"
              : "bg-emerald-50 text-emerald-500 border-emerald-200"
            }`}
        >
          <i className="fa-solid fa-circle text-[6px]" />
          {!value ? "Unread" : "Read"}
        </span>
      )
    },
    {
      key: "_id",
      label: "Actions",
      className: "text-center",
      render: (value) => (
        <button
          onClick={() => deleteNotification(value)}
          className="!w-8 !h-8 !rounded-full !bg-slate-100 !inline-flex !items-center !justify-center !cursor-pointer hover:!bg-red-50 hover:!text-red-500 !transition-colors !duration-150 !border-0"
          title="Delete Notification"
        >
          <i className="fa-solid fa-trash text-[12px] text-red-400" />
        </button>
      )
    }
  ];

  return (
    <div className="w-full px-4 md:px-6 py-4">
      {BackButton && (
        <div className="mb-3">
          <BackButton />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-4 border-b border-slate-100 mt-2">
        <div className="flex items-center gap-3.5">
          {HomeNavigate && <HomeNavigate />}
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#321961] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
            <i className="fa-solid fa-bell" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
              Notifications
            </div>
            <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              View and manage all your notifications
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Table Component */}
      <Table
        headers={headers}
        data={currentNotifications}
        emptyMessage="No notifications found"
      />

      {/* Pagination */}
      {filteredNotifications.length > notificationsPerPage && (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Notifications;