import React, { useState, useEffect } from "react";
import { axiosUserInstance } from "../../../Apiservice";
import toast from "react-hot-toast";

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

  return (
    <div className="w-full">
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}
            <div className="col-lg-12">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                    <i className="fa-solid fa-bell" />
                  </div>


                  {/* <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                      Notifications
                    </div>
                    <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      View and manage all your notifications
                    </p>
                  </div> */}



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

              {/* Table */}
              <div className="profile-table-wrapper">
                <div className="table-responsive">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentNotifications.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-400 text-[13px]">
                            No notifications found
                          </td>
                        </tr>
                      ) : (
                        currentNotifications.map((nt) => {
                          const isUnread = !nt.read;
                          const status = nt.read ? "Read" : "Unread";
                          const formattedDate = new Date(nt.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <tr key={nt._id} className="hover:bg-[#faf9fe] transition-colors duration-150">
                              <td className="whitespace-nowrap">
                                {formattedDate}
                              </td>
                              <td className={isUnread ? "font-semibold" : "font-medium"}>
                                {nt.title}
                              </td>
                              <td className="max-w-[280px]">
                                {nt.message}
                              </td>
                              <td>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-semibold border ${isUnread
                                    ? "bg-amber-50 text-amber-500 border-amber-200"
                                    : "bg-emerald-50 text-emerald-500 border-emerald-200"
                                    }`}
                                >
                                  <i className="fa-solid fa-circle text-[6px]" />
                                  {status}
                                </span>
                              </td>
                              <td className="text-center">
                                <button
                                  onClick={() => deleteNotification(nt._id)}
                                  className="btn-profile-danger-icon"
                                  title="Delete Notification"
                                >
                                  <i className="fa-solid fa-trash text-[12px] text-red-400" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {filteredNotifications.length > notificationsPerPage && (
                <div className="flex justify-center mt-4">
                  <ul className="flex items-center gap-1 list-none m-0 p-0">
                    <li>
                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#ececf6] text-[#666] text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#faf9fe]"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fa-solid fa-chevron-left" />
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <li key={page}>
                            <button
                              className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-medium ${currentPage === page
                                ? "bg-[#8059ca] text-white"
                                : "border border-[#ececf6] text-[#666] hover:bg-[#faf9fe]"
                                }`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <li key={`dots-${page}`}>
                            <span className="w-9 h-9 flex items-center justify-center text-[#999] text-[13px]">…</span>
                          </li>
                        );
                      }
                      return null;
                    })}

                    <li>
                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#ececf6] text-[#666] text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#faf9fe]"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;