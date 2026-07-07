import React, { useState, useEffect, useCallback } from "react";
import { useLang } from "../context/LanguageContext";
import { Plus, Eye, X, MessageSquare, Reply } from "lucide-react";
import api from "../utils/api";
import DataTable from "../components/common/DataTable";
import FilterBar from "../components/common/FilterBar";
import StatusBadge from "../components/common/StatusBadge";
import CRUDModal from "../components/common/CRUDModal";
import { toast } from "react-toastify";

export default function SupportMessagesPage() {
  const { t } = useLang();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messageFields = [
    { name: "subject", label: t.subject || "Subject", required: true },
    { name: "message", label: t.message || "Message", type: "textarea", required: true },
  ];

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/support-messages/mine`);
      if (res.data.status === "ok") {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch support messages", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenCreate = () => {
    setIsModalOpen(true);
  };

  const handleOpenView = (msg) => {
    setCurrentMessage(msg);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (!formData.subject?.trim() || !formData.message?.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/support-messages`, formData);
      toast.success(t.messageSentSuccess || "Support message sent successfully! We will contact you soon.");
      setIsModalOpen(false);
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error(err?.response?.data?.message || t.messageSentFailed || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      header: t.subject || "SUBJECT", 
      cell: (r) => <span className="text-xs text-[#3a2a1a] font-bold">{r.subject}</span>
    },
    {
      header: t.status || "STATUS",
      cell: (r) => <StatusBadge status={r.status} />
    },
    { 
      header: t.date || "DATE", 
      cell: (r) => <span className="text-[11px] text-[#5a4a3a] font-medium whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</span>
    },
    { 
      header: t.actions || "ACTIONS", 
      align: "right",
      cell: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button 
            onClick={() => handleOpenView(r)} 
            className="px-3 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {t.view || "View"}
          </button>
        </div>
      ) 
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-[#e8ddd0] overflow-hidden flex flex-col shadow-sm">
        <FilterBar 
          onSearch={() => {}}
          filters={[]}
          hideSearch={true}
          actionButton={
            <button 
              onClick={handleOpenCreate}
              className="bg-orange-600 text-white text-[11px] font-bold px-4 py-2.5 rounded-full hover:bg-orange-700 transition-all flex items-center justify-center shadow shadow-orange-600/20 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t.newTicket || "New Support Ticket"}
            </button>
          }
        />

        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={messages}
            loading={loading}
            emptyMessage={t.noMessagesFound || "You haven't sent any support messages yet."}
          />
        </div>
      </div>

      {/* Create Modal */}
      <CRUDModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.newTicket || "New Support Ticket"}
        fields={messageFields}
        onSubmit={handleSubmit}
        loading={isSubmitting}
      />

      {/* View Modal */}
      {isViewModalOpen && currentMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#fcfaf7] px-5 py-4 border-b border-[#e8ddd0] flex justify-between items-center">
              <h3 className="font-bold text-[#3a2a1a] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                {t.ticketDetails || "Ticket Details"}
              </h3>
              <StatusBadge status={currentMessage.status} />
            </div>
            
            <div className="p-6 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
              <div>
                <p className="text-[10px] font-bold text-[#9a8a7a] uppercase mb-1">{t.subject || "Subject"}</p>
                <p className="text-sm font-bold text-[#3a2a1a]">{currentMessage.subject}</p>
                <p className="text-[10px] text-[#9a8a7a] mt-1">{new Date(currentMessage.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#9a8a7a] uppercase mb-1">{t.yourMessage || "Your Message"}</p>
                <div className="bg-[#fcfaf7] p-4 rounded-xl border border-[#e8ddd0] text-sm text-[#3a2a1a] whitespace-pre-wrap">
                  {currentMessage.message}
                </div>
              </div>

              {currentMessage.status === "closed" && currentMessage.adminReply && (
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1 flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    {t.adminReply || "Admin Reply"}
                  </p>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-900 whitespace-pre-wrap">
                    {currentMessage.adminReply}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#fcfaf7] px-5 py-4 border-t border-[#e8ddd0] flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-white border border-[#e8ddd0] hover:bg-gray-50 text-[#3a2a1a] rounded-xl text-xs font-bold transition-colors"
              >
                {t.close || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
