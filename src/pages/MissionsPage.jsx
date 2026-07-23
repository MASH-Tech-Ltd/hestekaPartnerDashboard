import React, { useState, useEffect, useCallback } from "react";
import { useLang } from "../context/LanguageContext";
import { useLocation } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmModal from "../components/common/ConfirmModal";
import CRUDModal from "../components/common/CRUDModal";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";
import { Target, Plus, Edit2, Trash2, Users, Calendar, Upload, Award, Eye, Check, X } from "lucide-react";

export default function MissionsPage() {
  const { t } = useLang();
  const locationState = useLocation().state;

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Participant list variables
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Modals
  const [isCrudOpen, setIsCrudOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // create, edit
  const [modalLoading, setModalLoading] = useState(false);

  const missionFields = [
    { name: "title", label: t.titleLabel || "Title", required: true },
    {
      name: "description",
      label: t.descriptionLabel || "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "missionDate",
      label: t.missionDateLabel || "Date",
      type: "date",
      required: true,
      allowIndefinite: true,
      indefiniteLabel: t.indefiniteDuration || "No set date",
      indefiniteKey: "isIndefiniteDate",
    },
    { name: "address", label: t.address || "Address", required: true },
    {
      name: "latitude",
      label: t.latitude || "Latitude",
      type: "number",
      required: true,
    },
    {
      name: "longitude",
      label: t.longitude || "Longitude",
      type: "number",
      required: true,
    },
    {
      name: "points",
      label: t.points || "Points Reward",
      type: "number",
      required: true,
    },
    { name: "duration", label: t.durationLabel || "Duration", required: true },
    { name: "image", label: t.missionPhoto || "Mission Photo", type: "file" },
  ];

  const fetchMissions = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get("/local-missions/get-my-local-missions");
      if (res.data.status === "ok") {
        setMissions(res.data.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to fetch local missions", err);
      toast.error(t.toastLoadMissionsFailed || "Failed to load missions.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMissions(true);
    
    // Automatically trigger create modal if navigated from overview with create state
    if (locationState?.openCreate) {
      handleOpenCreate();
    }
  }, [fetchMissions, locationState]);

  const handleSearch = (term) => setSearchTerm(term);
  const handleFilterChange = (name, value) => {
    if (name === "status") setStatusFilter(value);
  };

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMissions.length / PAGE_SIZE));
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedMission(null);
    setIsCrudOpen(true);
  };

  const handleOpenEdit = (mission) => {
    setModalMode("edit");
    setSelectedMission({
      ...mission,
      missionDate: mission.missionDate,
      isIndefiniteDate: !mission.missionDate,
    });
    setIsCrudOpen(true);
  };

  const handleOpenConfirm = (mission) => {
    setSelectedMission(mission);
    setIsConfirmOpen(true);
  };

  const handleOpenParticipants = async (mission) => {
    setSelectedMission(mission);
    setIsParticipantsOpen(true);
    setParticipantsLoading(true);
    try {
      const res = await api.get(`/local-missions/get-local-mission-participants/${mission._id}`);
      if (res.data.status === "ok") {
        setParticipants(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch participants", err);
      toast.error(t.toastLoadParticipantsFailed || "Failed to load participants list.");
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleCrudSubmit = async (formDataObject) => {
    setModalLoading(true);
    const formData = new FormData();
    let hasLoc = false;
    let lat = null,
      lng = null;

    Object.keys(formDataObject).forEach((key) => {
      if (key === "latitude") {
        hasLoc = true;
        lat = formDataObject[key];
      } else if (key === "longitude") {
        hasLoc = true;
        lng = formDataObject[key];
      } else if (key === "isIndefiniteDate") {
        // Do not append to FormData directly
      } else if (key === "missionDate") {
        if (formDataObject.isIndefiniteDate) {
          formData.append("missionDate", "");
        } else if (formDataObject[key]) {
          formData.append(key, new Date(formDataObject[key]).toISOString());
        }
      } else if (formDataObject[key] !== undefined) {
        if (key === "points") {
          formData.append(key, Number(formDataObject[key]));
        } else {
          formData.append(key, formDataObject[key]);
        }
      }
    });

    if (hasLoc && lat && lng) {
      formData.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        }),
      );
    }

    try {
      if (modalMode === "create") {
        await api.post("/local-missions/create-local-mission", formData);
        toast.success(t.toastMissionCreated || "Local mission created successfully.");
      } else {
        await api.patch(`/local-missions/update-local-mission/${selectedMission._id}`, formData);
        toast.success(t.toastMissionUpdated || "Local mission updated successfully.");
      }
      setIsCrudOpen(false);
      fetchMissions(false);
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to save local mission", err);
      toast.error(err.response?.data?.message || t.toastMissionSaveFailed || "Failed to save local mission.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteMission = async () => {
    setModalLoading(true);
    try {
      await api.delete(`/local-missions/delete-local-mission/${selectedMission._id}`);
      toast.success(t.toastMissionDeleted || "Local mission deleted successfully.");
      setIsConfirmOpen(false);
      fetchMissions(false);
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to delete local mission", err);
      toast.error(t.toastMissionDeleteFailed || "Failed to delete local mission.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleApproveParticipant = async (participationId) => {
    try {
      const res = await api.patch(`/local-missions/approve-local-mission/${participationId}`);
      if (res.data.status === "ok") {
        toast.success(t.toastApproveSuccess || "Participant registration approved!");
        // Refresh list
        setParticipants((prev) =>
          prev.map((p) => (p._id === participationId ? { ...p, status: "completed" } : p))
        );
      }
    } catch (err) {
      console.error("Failed to approve participant", err);
      toast.error(err.response?.data?.message || t.toastApproveFailed || "Failed to approve participant.");
    }
  };

  const handleRejectParticipant = async (participationId) => {
    try {
      const res = await api.patch(`/local-missions/reject-local-mission/${participationId}`);
      if (res.data.status === "ok") {
        toast.success(t.toastRejectSuccess || "Participant rejected!");
        // Refresh list
        setParticipants((prev) =>
          prev.map((p) => (p._id === participationId ? { ...p, status: "rejected" } : p))
        );
      }
    } catch (err) {
      console.error("Failed to reject participant", err);
      toast.error(err.response?.data?.message || t.toastRejectFailed || "Failed to reject participant.");
    }
  };

  const columns = [
    {
      header: t.titleLabel || "Title",
      accessor: "title",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] overflow-hidden shrink-0">
            {row.photo?.secure_url ? (
              <img src={row.photo.secure_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold uppercase">
                {row.title?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#3a2a1a]">{row.title}</span>
            <span className="text-[10px] text-[#9a8a7a] font-medium">{row.address || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      header: t.pointsGrantedLabel || "Points",
      accessor: "points",
      cell: (row) => (
        <span className="font-black text-orange-600 flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          {row.points ?? "—"} pts
        </span>
      ),
    },
    {
      header: t.durationLabel || "Duration",
      accessor: "duration",
      cell: (row) => (
        <span className="text-xs text-[#5a4a3a] font-medium">
          {row.duration ? `${row.duration} ${t.hoursUnit || "hours"}` : "—"}
        </span>
      ),
    },
    {
      header: t.missionDateLabel || "Mission Date",
      accessor: "missionDate",
      cell: (row) => (
        <span className="text-xs text-[#5a4a3a] font-medium">
          {row.missionDate ? new Date(row.missionDate).toLocaleDateString() : (t.indefiniteDuration || "No set date")}
        </span>
      ),
    },
    {
      header: t.statusLabel || "Status",
      accessor: "status",
      cell: (row) => {
        const s = row.status || "active";
        const cfg = {
          active:    { label: t.activeLabel    || "Active",    color: "bg-green-100 text-green-700 border-green-200" },
          pending:   { label: t.pendingLabel   || "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
          completed: { label: t.completedLabel || "Completed", color: "bg-gray-100 text-gray-500 border-gray-200" },
          inactive:  { label: t.inactiveLabel  || "Inactive",  color: "bg-red-100 text-red-600 border-red-200" },
        };
        const style = cfg[s] || cfg.active;
        return (
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
            {style.label}
          </span>
        );
      },
    },
    {
      header: t.actionsLabel || "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenParticipants(row); }}
            className="p-1.5 rounded-lg border border-[#e8ddd0] hover:bg-orange-50 text-orange-600 hover:border-orange-200 transition-all flex items-center gap-1 text-[11px] font-bold"
            title={t.registrationsLabel || "Registrations"}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.registrationsLabel || "Registrations"}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
            className="p-1.5 rounded-lg border border-[#e8ddd0] hover:bg-gray-100 text-[#3a2a1a] transition-all"
            title={t.edit || "Edit"}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenConfirm(row); }}
            className="p-1.5 rounded-lg border border-[#e8ddd0] hover:bg-red-50 text-red-600 hover:border-red-200 transition-all"
            title={t.deleteLabel || "Delete"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Action Bar */}
      <FilterBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        filters={[
          {
            name: "status",
            label: t.filterStatusLabel || "Filter Status",
            options: [
              { value: "all", label: t.all || "All" },
              { value: "active", label: t.activeLabel || "Active" },
              { value: "upcoming", label: t.upcomingLabel || "Upcoming" },
              { value: "completed", label: t.completedLabel || "Completed" },
            ],
          },
        ]}
        placeholder={t.searchPlaceholderMissions || "Search by mission name or category..."}
        actionButton={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t.createMissionBtn || "Create Local Mission"}
          </button>
        }
      />

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#e8ddd0] shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedMissions}
          loading={loading}
          emptyMessage={t.emptyMissionsList || "No local missions created yet."}
        />

        {/* Pagination */}
        {!loading && filteredMissions.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0e8d8] bg-[#fcfaf7]">
            <span className="text-[11px] text-[#9a8a7a] font-medium">
              {t.showing || "Showing"} {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredMissions.length)}–{Math.min(currentPage * PAGE_SIZE, filteredMissions.length)} {t.of || "of"} {filteredMissions.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-[#e8ddd0] text-[#3a2a1a] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all ${
                    page === currentPage
                      ? "bg-orange-600 text-white shadow"
                      : "border border-[#e8ddd0] text-[#3a2a1a] hover:bg-white"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-[#e8ddd0] text-[#3a2a1a] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <CRUDModal
        isOpen={isCrudOpen}
        onClose={() => setIsCrudOpen(false)}
        title={modalMode === "create" ? (t.createMissionBtn || "Create Local Mission") : (t.editMissionBtn || "Edit Local Mission")}
        fields={missionFields}
        initialData={selectedMission}
        onSubmit={handleCrudSubmit}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t.deleteMissionBtn || "Delete Local Mission"}
        message={t.confirmDeleteMission || "Are you sure you want to delete this mission?"}
        onConfirm={handleDeleteMission}
        onClose={() => setIsConfirmOpen(false)}
        loading={modalLoading}
      />

      {/* Participants List Modal */}
      {isParticipantsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-[#f0e8d8] flex justify-between items-center bg-[#fcfaf7] shrink-0">
              <h2 className="text-lg font-bold text-[#3a2a1a] flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                {t.registrationsLabel || "Registrations"}
              </h2>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="text-[#9a8a7a] hover:text-[#3a2a1a] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-[250px]">
              {participantsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                </div>
              ) : participants.length > 0 ? (
                <div className="divide-y divide-[#f0e8d8]">
                  {participants.map((p) => (
                    <div key={p._id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#f5f0e8] overflow-hidden shrink-0 flex items-center justify-center font-bold text-orange-600 text-sm">
                          {p.user?.profileImage?.secure_url ? (
                            <img src={getOptimizedCloudinaryUrl(p.user.profileImage.secure_url, 80, 80)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            p.user?.firstName?.charAt(0) || "U"
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#3a2a1a]">{p.user?.firstName} {p.user?.lastName}</h4>
                          <p className="text-[10px] text-[#9a8a7a] mt-0.5">{p.user?.email} · {p.user?.phone || "No phone"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleRejectParticipant(p._id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <X className="w-3 h-3" />
                              {t.rejectBtn || "Reject"}
                            </button>
                            <button
                              onClick={() => handleApproveParticipant(p._id)}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              {t.approveBtn || "Approve"}
                            </button>
                          </>
                        ) : p.status === "rejected" ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 uppercase tracking-wider flex items-center gap-0.5">
                            <X className="w-3 h-3" />
                            {t.rejected || "Rejected"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-200 uppercase tracking-wider flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            {t.approved || "Approved"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#9a8a7a] gap-2 py-10">
                  <Users className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-medium">{t.noRegistrationsYet || "No participants for this mission yet."}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#fcfaf7] border-t border-[#f0e8d8] flex justify-end shrink-0">
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="px-5 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all shadow"
              >
                {t.closeBtn || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
