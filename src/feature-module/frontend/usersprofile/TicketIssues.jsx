import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { axiosUserInstance, imgUrl } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";
import Modal from "../../../components/ui/Modal";
import { Offcanvas } from "../../../components/ui/Offcanvas";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { Table, Pagination } from "../../../components/ui";

const TicketIssues = ({ HomeNavigate, BackButton }) => {
  const [leadslist, setleadslist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showChat, setShowChat] = useState(false);
  const [selectedTicketForChat, setSelectedTicketForChat] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesRef = useRef(null);
  const { isMobile } = useResponsive();
  const ordersPerPage = 10;

  const socketRef = useRef(null);
  const activeTicketRef = useRef(null);

  useEffect(() => {
    activeTicketRef.current = selectedTicketForChat;
  }, [selectedTicketForChat]);

  useEffect(() => {
    const socketObj = io(imgUrl, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socketObj;

    socketObj.on("connect", () => {
      console.log("Connected to Socket.io server successfully");
    });

    socketObj.on("connect_error", (error) => {
      console.error("Socket.io connection error:", error);
    });

    socketObj.on("ticket:message", (data) => {
      console.log("Received ticket message:", data);
      const activeTicket = activeTicketRef.current;
      const activeId = activeTicket ? (activeTicket._id || activeTicket.id) : null;

      if (activeId && String(activeId).toLowerCase() === String(data.ticketId).toLowerCase()) {
        setChatHistory((prev) => {
          if (prev.some((msg) => msg.id === data._id || (msg.text === data.message && msg.sender === data.sender))) {
            return prev;
          }
          return [
            ...prev,
            {
              id: data._id || Date.now(),
              sender: data.sender,
              text: data.message,
              time: new Date(data.createdAt || Date.now()).toLocaleTimeString()
            }
          ];
        });
        scrollToBottom();
      }
    });

    socketObj.on("ticket:closed", (data) => {
      console.log("Ticket closed via socket:", data);
      const activeTicket = activeTicketRef.current;
      const activeId = activeTicket ? (activeTicket._id || activeTicket.id) : null;
      const targetStatus = data.status || "closed";

      if (activeId && String(activeId).toLowerCase() === String(data.ticketId).toLowerCase()) {
        setSelectedTicketForChat((prev) => prev ? { ...prev, status: targetStatus } : null);
        setTicketDetails((prev) => prev ? { ...prev, status: targetStatus } : null);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `system_${Date.now()}`,
            sender: "system",
            text: targetStatus === "resolved" ? "This ticket has been resolved." : "This ticket has been closed.",
            time: new Date().toLocaleTimeString()
          }
        ]);
        scrollToBottom();
      }

      setleadslist((prev) =>
        prev.map((ticket) =>
          String(ticket._id).toLowerCase() === String(data.ticketId).toLowerCase()
            ? { ...ticket, status: targetStatus }
            : ticket
        )
      );
    });

    return () => {
      socketObj.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      setTimeout(() => {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }, 100);
    }
  };
  const capitalize = (text) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  const getLeadsData = async (page = 1, search = "") => {
    const token = localStorage.getItem("medicomparestoken");
    setLoading(true);

    try {
      const res = await axiosUserInstance.get(
        `raise-ticket/list?page=${page}&limit=${ordersPerPage}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setleadslist(res?.data?.data?.tickets || []);
      setTotalPages(res?.data?.data?.pagination?.totalPages || 1);
      setCurrentPage(res?.data?.data?.pagination?.page || 1);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const getTicketDetails = async (ticketId) => {
    const token = localStorage.getItem("medicomparestoken");
    setChatLoading(true);

    try {
      const res = await axiosUserInstance.get(
        `raise-ticket/detail/${ticketId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setTicketDetails(res?.data?.data);
      return res?.data?.data;
    } catch (err) {
      toast.error(err, "Error fetching ticket details:");
      return null;
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      getLeadsData(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  const filteredOrders = leadslist;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const viewLead = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const openChat = async (ticket) => {
    setSelectedTicketForChat(ticket);
    setShowChat(true);

    if (socketRef.current) {
      socketRef.current.emit("ticket:join", ticket._id);
      console.log("Joined ticket room via socket:", ticket._id);
    }

    const details = await getTicketDetails(ticket._id);
    const chatMessages = [];
    if (details && details.messages && details.messages.length > 0) {
      details.messages.forEach((msg) => {
        chatMessages.push({
          id: msg._id,
          sender: msg.sender,
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString(),
          readByAdmin: msg.readByAdmin,
          readByUser: msg.readByUser
        });
      });
    }

    setChatHistory(chatMessages);
    scrollToBottom();
  };

  const closeChat = () => {
    if (socketRef.current && selectedTicketForChat) {
      socketRef.current.emit("ticket:leave", selectedTicketForChat._id || selectedTicketForChat.id);
      console.log("Left ticket room via socket:", selectedTicketForChat._id || selectedTicketForChat.id);
    }
    setShowChat(false);
    setSelectedTicketForChat(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    if (selectedTicketForChat?.status?.toLowerCase() === "closed" ||
      ticketDetails?.status?.toLowerCase() === "closed" ||
      selectedTicketForChat?.status?.toLowerCase() === "resolved" ||
      ticketDetails?.status?.toLowerCase() === "resolved") {
      toast.error("Cannot send messages to closed or resolved tickets");
      return;
    }

    const token = localStorage.getItem("medicomparestoken");

    try {
      const res = await axiosUserInstance.post(
        `raise-ticket/message/${selectedTicketForChat._id}`,
        {
          message: chatMessage.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newMessage = {
        id: res?.data?.data?._id || Date.now(),
        sender: "user",
        text: chatMessage.trim(),
        time: new Date().toLocaleTimeString()
      };

      setChatHistory([...chatHistory, newMessage]);
      setChatMessage("");
      scrollToBottom();

    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const columnConfig = {
    ticketNo: filteredOrders.some((t) => t.ticketNo),
    subject: filteredOrders.some((t) => t.subject),
    category: filteredOrders.some((t) => t.category),
    priority: filteredOrders.some((t) => t.priority),
    status: filteredOrders.some((t) => t.status),
    date: filteredOrders.some((t) => t.createdAt),
    description: filteredOrders.some((t) => t.description),
  };

  const priorityClasses = (priority) => {
    const p = priority?.toLowerCase();
    if (p === "low") return "bg-sky-100 text-sky-700";
    if (p === "medium") return "bg-amber-100 text-amber-700";
    if (p === "high") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  const statusClasses = (status) => {
    const s = status?.toLowerCase();
    if (s === "open") return "bg-green-100 text-green-700";
    if (s === "closed") return "bg-slate-100 text-slate-600";
    if (s === "resolved") return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-600";
  };

  const headers = [
    columnConfig.ticketNo && {
      key: "ticketNo",
      label: "Ticket No",
      render: (value) => (
        <span className="font-semibold text-[#8059ca]">
          {value}
        </span>
      )
    },
    columnConfig.subject && {
      key: "subject",
      label: "Subject"
    },
    columnConfig.category && {
      key: "category",
      label: "Category",
      className: "capitalize"
    },
    columnConfig.priority && {
      key: "priority",
      label: "Priority",
      render: (value) => (
        <span
          className={`text-[11px] px-2 py-[3px] rounded font-semibold capitalize inline-block ${priorityClasses(value)}`}
        >
          {value}
        </span>
      )
    },
    columnConfig.status && {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`text-[11px] px-2 py-[3px] rounded font-semibold capitalize inline-block ${statusClasses(value)}`}
        >
          {value}
        </span>
      )
    },
    columnConfig.date && {
      key: "createdAt",
      label: "Date",
      render: (value) => value ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) : "-"
    },
    {
      key: "chat",
      label: "Chat",
      className: "text-center",
      render: (_, row) => (
        <button
          className={`rounded-full w-8 h-8 p-0 inline-flex items-center justify-center text-white cursor-pointer border ${row.status === "closed" ? "bg-[#ff6b6b] border-[#ff6b6b]" : "bg-[#8059ca] border-[#8059ca]"}`}
          title={row.status === "closed" ? "View chat history (closed ticket)" : "Chat with Support"}
          onClick={() => openChat(row)}
        >
          <i className="fas fa-comments"></i>
        </button>
      )
    },
    {
      key: "action",
      label: "Action",
      className: "text-center",
      render: (_, row) => (
        <button
          className="btn btn-sm btn-light rounded-full w-8 h-8 p-0 inline-flex items-center justify-center cursor-pointer"
          title="View Ticket"
          onClick={() => viewLead(row)}
        >
          <i className="fas fa-eye"></i>
        </button>
      )
    }
  ].filter(Boolean);

  return (
    <div className="w-full">
      <div className="py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}
            <div className="w-full">
              {/* Header Section — matches MedicineBookings styling */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                    <i className="fa-solid fa-ticket" />
                  </div>




                  {/* <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                      Tickets
                    </div>
                    <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      Manage and track all your support tickets
                    </p>
                  </div> */}


                  <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                      Tickets
                    </div>
                    <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      Manage and track all your support tickets
                    </div>
                  </div>


                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[260px] shrink-0">
                    <input
                      type="text"
                      placeholder="Search by Ticket ID"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-[38px] rounded-sm border border-slate-200 pl-9 pr-3 text-[13px] w-full outline-none bg-slate-50 hover:bg-white hover:border-[#8059ca] focus:bg-white focus:border-[#8059ca] transition-all duration-200"
                    />
                    <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[13px]">
                      <i className="fa-solid fa-search" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Table
                  headers={headers}
                  data={filteredOrders}
                  loading={loading}
                  emptyMessage="No tickets found."
                />
              </div>

              {/* Pagination */}
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Lead Details Modal */}
      <Modal
        show={showModal}
        onHide={closeModal}
        centered
        size="md"
      >
      <Modal.Body>
          {selectedLead && (
            <div className="p-6 bg-white">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#f1f1f1] pb-3 mb-5">
                <h5 className="text-[17px] font-semibold text-slate-800 m-0">Ticket Details</h5>
                <button
                  type="button"
                  className="border-none bg-transparent text-xl cursor-pointer text-slate-400 leading-none p-0 hover:text-slate-800"
                  onClick={closeModal}
                >
                  &times;
                </button>
              </div>

              {/* Ticket Information */}
              <div className="row">
                {selectedLead?.ticketNo && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Ticket No</span>
                    <span className="text-slate-900 font-medium text-[14.5px] block">{selectedLead.ticketNo}</span>
                  </div>
                )}

                {selectedLead?.subject && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Subject</span>
                    <span className="text-slate-900 font-medium text-[14.5px] block">{selectedLead.subject}</span>
                  </div>
                )}

                {selectedLead?.category && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Category</span>
                    <span className="text-slate-900 font-medium text-[14.5px] block">{capitalize(selectedLead.category.replace(/_/g, ' '))}</span>
                  </div>
                )}

                {selectedLead?.priority && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Priority</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${priorityClasses(selectedLead.priority)}`}>
                      {selectedLead.priority}
                    </span>
                  </div>
                )}

                {selectedLead?.status && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${statusClasses(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                )}

                {selectedLead?.createdAt && (
                  <div className="col-md-6 col-12 mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Created Date</span>
                    <span className="text-slate-900 font-medium text-[14.5px] block">
                      {new Date(selectedLead.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedLead?.description && (
                <div>
                  <div className="font-semibold text-slate-800 mt-4 mb-1.5 text-[13.5px]">Description</div>
                  <div className="bg-[#fafafa] border border-[#eee] rounded-md p-3 text-[13px] leading-relaxed text-slate-600">
                    {selectedLead.description}
                  </div>
                </div>
              )}

              {/* Divider */}
              {selectedLead?.userId && <div className="border-t border-[#f1f1f1] my-4"></div>}

              {/* User Details */}
              {selectedLead?.userId && (
                <div className="row">
                  {selectedLead.userId.first_name && (
                    <div className="col-md-4 col-12 mb-4">
                      <span className="text-xs text-slate-500 mb-1 block">User Name</span>
                      <span className="text-slate-900 font-medium text-[14.5px] block">
                        {selectedLead.userId.first_name} {selectedLead.userId.last_name || ""}
                      </span>
                    </div>
                  )}

                  {selectedLead.userId.email && (
                    <div className="col-md-4 col-12 mb-4">
                      <span className="text-xs text-slate-500 mb-1 block">Email</span>
                      <span className="text-slate-900 font-medium text-[14.5px] block break-all">
                        {selectedLead.userId.email}
                      </span>
                    </div>
                  )}

                  {selectedLead.userId.phone && (
                    <div className="col-md-4 col-12 mb-4">
                      <span className="text-xs text-slate-500 mb-1 block">Phone</span>
                      <span className="text-slate-900 font-medium text-[14.5px] block">{selectedLead.userId.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {selectedLead?.attachments && selectedLead.attachments.length > 0 && (
                <div>
                  <div className="border-t border-[#f1f1f1] my-4"></div>
                  <div className="font-semibold text-slate-800 mb-1.5 text-[13.5px] mt-0">Attachments</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.attachments.map((attachment, index) => (
                      <div
                        className="cursor-pointer rounded-md overflow-hidden border border-[#ddd] w-[60px] h-[60px] transition-opacity hover:opacity-80"
                        key={index}
                        onClick={() => window.open(attachment, '_blank')}
                        title="Click to view file"
                      >
                        <img
                          src={attachment}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.fallback-icon');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="fallback-icon hidden w-full h-full items-center justify-center bg-slate-50 text-[#8059ca]">
                          <i className="fas fa-file-alt"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Chat Offcanvas */}
      <Offcanvas
        show={showChat}
        onHide={closeChat}
        placement="end"
        className="w-[400px]"
      >
        <Offcanvas.Header closeButton onHide={closeChat}>
          <Offcanvas.Title>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#8059ca] text-white flex items-center justify-center text-lg">
                <i className="fas fa-headset"></i>
              </div>
              <div>
                <div className="text-base font-semibold text-slate-800">Ticket Support</div>
                <div className="text-xs text-slate-500">#{selectedTicketForChat?.ticketNo}</div>
              </div>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="flex flex-col p-0 bg-white">
          <div
            ref={chatMessagesRef}
            className="flex-grow p-3 overflow-y-auto flex flex-col gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[radial-gradient(#f1f1f1_1px,transparent_0)] bg-[length:20px_20px]"
          >
            {chatLoading ? (
              <>
                <div className="self-start max-w-[85%]">
                  <div className="bg-[#f0f2f5] rounded-[18px_18px_18px_0] h-5 w-[120px] animate-pulse" />
                </div>
                <div className="self-end max-w-[85%]">
                  <div className="bg-[#8059ca]/40 rounded-[18px_18px_0_18px] h-5 w-[150px] animate-pulse" />
                </div>
                <div className="self-start max-w-[85%]">
                  <div className="bg-[#f0f2f5] rounded-[18px_18px_18px_0] h-5 w-[100px] animate-pulse" />
                </div>
              </>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`max-w-[85%] flex flex-col gap-1 ${chat.sender === "user" ? "self-end items-end" : "self-start items-start"}`}
                >
                  {chat.sender === "system" ? (
                    <div className="w-full text-center my-2.5">
                      <span className="text-[11px] bg-white text-slate-400 px-2.5 py-0.5 rounded-full border border-[#eee]">
                        {chat.text}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-end gap-2 ${chat.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${chat.sender === "user" ? "bg-[#8059ca] text-white" : "bg-[#f0f2f5] text-slate-500"
                            }`}
                        >
                          {chat.sender === "user" ? (
                            <i className="fas fa-user"></i>
                          ) : (
                            <i className="fas fa-headset"></i>
                          )}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed max-w-[200px] shadow-[0_2px_5px_rgba(0,0,0,0.05)] ${chat.sender === "user"
                            ? "bg-[#8059ca] text-white rounded-[18px_18px_0_18px]"
                            : "bg-[#f0f2f5] text-slate-800 rounded-[18px_18px_18px_0]"
                            }`}
                        >
                          {chat.text}
                        </div>
                      </div>
                      <div className={`text-[10px] text-slate-400 ${chat.sender === "user" ? "ml-auto mr-10" : "ml-10 mr-auto"}`}>
                        {chat.time}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-3 bg-white border-t border-[#eee]">
            {(selectedTicketForChat?.status?.toLowerCase() === "closed" ||
              ticketDetails?.status?.toLowerCase() === "closed" ||
              selectedTicketForChat?.status?.toLowerCase() === "resolved" ||
              ticketDetails?.status?.toLowerCase() === "resolved") ? (
              <div className="flex items-center justify-center h-[45px] rounded-[22px] border border-[#e0e0e0] bg-slate-50 text-slate-400 text-sm italic">
                <i className="fas fa-lock me-2"></i>
                This ticket is closed/resolved - messaging disabled
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-grow h-[45px] rounded-[22px] border border-[#e0e0e0] px-5 text-sm outline-none focus:border-[#8059ca]"
                />
                <button
                  type="submit"
                  className="w-[45px] h-[45px] rounded-full bg-[#8059ca] text-white border-none flex items-center justify-center cursor-pointer transition-transform shadow-[0_4px_10px_rgba(128,89,202,0.3)] hover:scale-105"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default TicketIssues;