import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLang } from "../context/LanguageContext";
import { useApiCache } from "../context/ApiCacheContext";
import api from "../utils/api";
import { toast } from "react-toastify";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmModal from "../components/common/ConfirmModal";
import CRUDModal from "../components/common/CRUDModal";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Globe,
  FileImage,
  Upload,
  Eye,
  X,
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const libraries = ["places"];

// Helper to generate a custom map pin with an image inside
const generatePinIcon = (imgUrl) => {
  return new Promise((resolve) => {
    if (!window.google) return resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    // Draw pin shape
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.beginPath();
    ctx.arc(30, 30, 30, Math.PI, 0, false);
    ctx.lineTo(60, 30);
    ctx.bezierCurveTo(60, 45, 30, 80, 30, 80);
    ctx.bezierCurveTo(30, 80, 0, 45, 0, 30);
    ctx.fill();

    // Draw white circle inside
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(30, 30, 24, 0, Math.PI * 2);
    ctx.fill();

    if (!imgUrl) {
      return resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53)
      });
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(30, 30, 22, 0, Math.PI * 2);
      ctx.clip();
      
      const scale = Math.max(44 / img.width, 44 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = 30 - w / 2;
      const y = 30 - h / 2;
      
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
      
      resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53)
      });
    };
    img.onerror = () => {
      resolve({
        url: canvas.toDataURL(),
        scaledSize: new window.google.maps.Size(40, 53),
        anchor: new window.google.maps.Point(20, 53)
      });
    };
    img.src = imgUrl;
  });
};

export default function CollectionPointsPage() {
  const { t } = useLang();
  const { fetchWithCache, invalidateCache } = useApiCache();

  const pointFields = [
    { name: "title", label: t.nameLabel || "Name", required: true },
    { name: "address", label: t.address || "Full Address", required: true },
    {
      name: "description",
      label: t.descriptionLabel || "Description",
      type: "textarea",
    },
    { name: "image", label: t.photoLabel || "Photo", type: "file" },
    { name: "latitude", label: t.latitudeLabel || "Latitude", type: "number" },
    {
      name: "longitude",
      label: t.longitudeLabel || "Longitude",
      type: "number",
    },
  ];

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Map variables
  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({ lat: 46.2276, lng: 2.2137 }); // France center
  const [zoom, setZoom] = useState(5);
  const [mapType, setMapType] = useState('roadmap');
  const [markerIcons, setMarkerIcons] = useState({});

  // Modal forms
  const [isCrudOpen, setIsCrudOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // create, edit
  const [modalLoading, setModalLoading] = useState(false);



  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const fetchPoints = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        const res = await api.get("/partner-ads/get-my-partner-ads");
        if (res.data.status === "ok") {
          setPoints(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch partner ads", err);
        toast.error(
          t.toastLoadPointsFailed || "Failed to load collection points.",
        );
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchPoints(true);
  }, [fetchPoints]);

  const handleSearch = (term) => setSearchTerm(term);
  const handleFilterChange = (name, value) => {
    if (name === "status") setStatusFilter(value);
  };

  const handleRowClick = (point) => {
    setSelectedPoint(point);
    setIsViewOpen(true);
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedPoint(null);
    setIsCrudOpen(true);
  };

  const handleOpenEdit = (point) => {
    setModalMode("edit");
    setSelectedPoint(point);
    setIsCrudOpen(true);
  };

  const handleOpenConfirm = (point) => {
    setSelectedPoint(point);
    setIsConfirmOpen(true);
  };

  const handleOpenView = (point) => {
    setSelectedPoint(point);
    setIsViewOpen(true);
  };

  const handleCrudSubmit = async (formDataObject) => {
    setModalLoading(true);
    const formData = new FormData();
    Object.keys(formDataObject).forEach((key) => {
      if (formDataObject[key] !== undefined) formData.append(key, formDataObject[key]);
    });

    try {
      if (modalMode === "create") {
        await api.post("/partner-ads/create-partner-ad", formData);
        toast.success(
          t.toastPointCreated || "Collection point created successfully.",
        );
      } else {
        await api.patch(
          `/partner-ads/update-partner-ad/${selectedPoint._id}`,
          formData,
        );
        toast.success(
          t.toastPointUpdated || "Collection point updated successfully.",
        );
      }
      setIsCrudOpen(false);
      fetchPoints(false);
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to save collection point", err);
      toast.error(
        err.response?.data?.message ||
          t.toastPointSaveFailed ||
          "Failed to save collection point.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePoint = async () => {
    setModalLoading(true);
    try {
      await api.delete(`/partner-ads/delete-partner-ad/${selectedPoint._id}`);
      toast.success(
        t.toastPointDeleted || "Collection point deleted successfully.",
      );
      setIsConfirmOpen(false);
      fetchPoints(false);
      window.dispatchEvent(new Event("refetch-stats"));
    } catch (err) {
      console.error("Failed to delete collection point", err);
      toast.error(
        t.toastPointDeleteFailed || "Failed to delete collection point.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Google Maps setup callbacks
  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Helper to extract coordinates safely
  const getCoordinates = (p) => {
    if (p.location?.coordinates && p.location.coordinates.length >= 2) {
      return {
        lat: Number(p.location.coordinates[1]),
        lng: Number(p.location.coordinates[0])
      };
    }
    if (p.latitude && p.longitude) {
      return {
        lat: Number(p.latitude),
        lng: Number(p.longitude)
      };
    }
    return null;
  };

  // Center maps on first active point when points load
  useEffect(() => {
    const validPoint = points.map(p => ({...p, coords: getCoordinates(p)})).find(p => p.coords);
    if (validPoint) {
      setMapCenter({
        lat: validPoint.coords.lat,
        lng: validPoint.coords.lng,
      });
      setZoom(10);
    }
  }, [points]);

  useEffect(() => {
    if (!isLoaded) return;
    const validPoints = points.map(p => ({...p, coords: getCoordinates(p)})).filter(p => p.coords);
    validPoints.forEach((point) => {
      const imgUrl = point.photo?.secure_url || point.logo?.secure_url;
      const id = point._id;
      if (!markerIcons[id]) {
        generatePinIcon(imgUrl).then(icon => {
          if (icon) {
            setMarkerIcons(prev => ({ ...prev, [id]: icon }));
          }
        });
      }
    });
  }, [points, isLoaded, markerIcons]);

  const filteredPoints = points.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: t.pointName || "Point Name",
      accessor: "title",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] overflow-hidden shrink-0">
            {row.photo?.secure_url ? (
              <img
                src={getOptimizedCloudinaryUrl(row.photo.secure_url, 100, 100)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold uppercase">
                {row.title?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#3a2a1a]">{row.title}</span>
            <span className="text-[10px] text-[#9a8a7a] line-clamp-1 max-w-[200px]">
              {row.address}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t.coordinates || "Coordinates",
      accessor: "coords",
      cell: (row) => {
        const coords = getCoordinates(row);
        return (
          <span className="text-[11px] font-mono text-[#9a8a7a]">
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "N/A"}
          </span>
        );
      },
    },
    {
      header: t.statusLabel || "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status || "active"} />,
    },
    {
      header: t.actionsLabel || "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenView(row);
            }}
            className="p-1.5 rounded-lg border border-[#e8ddd0] hover:bg-[#f5f0e8] text-[#3a2a1a] transition-all"
            title={t.viewDetails || "View Details"}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="p-1.5 rounded-lg border border-[#e8ddd0] hover:bg-orange-50 text-orange-600 hover:border-orange-200 transition-all"
            title={t.edit || "Edit"}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenConfirm(row);
            }}
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
      {/* Search and Filter */}
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
              { value: "inactive", label: t.inactive || "Inactive" },
            ],
          },
        ]}
        placeholder={
          t.searchPlaceholderPoints || "Search by name or address..."
        }
        actionButton={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t.addPoint || "Add Point"}
          </button>
        }
      />

      {/* Map visualization */}
      <div
        id="collection-map-card"
        className="bg-white rounded-2xl border border-[#e8ddd0] p-4 shadow-sm relative overflow-hidden"
      >
        <h3 className="font-bold text-[#3a2a1a] text-sm flex items-center gap-2 border-b border-[#f0e8d8] pb-3 mb-3">
          <MapPin className="w-4.5 h-4.5 text-orange-600" />
          {t.depositMap || "Deposit Locations Map"}
        </h3>

        {loadError && (
          <div className="text-red-500 text-xs">
            Error loading Google Maps API
          </div>
        )}
        {!isLoaded && (
          <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl" />
        )}
        {isLoaded && !loadError && (
          <div className="rounded-xl overflow-hidden border border-[#e8ddd0] z-[0] h-[300px] relative">
            {/* Custom Map Type Toggle */}
            <button
              onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
              className="absolute bottom-6 left-2 z-[10] w-9 h-9 bg-white rounded-lg shadow-md border border-[#e8ddd0] flex flex-col items-center justify-center overflow-hidden hover:border-[#8B6914] transition-all group"
              title={mapType === 'roadmap' ? 'Switch to Satellite' : 'Switch to Map'}
            >
              {mapType === 'roadmap' ? (
                <div className="w-full h-full bg-[#3a2a1a] flex flex-col items-center justify-center">
                  <svg className="w-4 h-4 text-white mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-[7px] font-bold text-white leading-none">SAT</span>
                </div>
              ) : (
                <div className="w-full h-full bg-[#f5f0e8] flex flex-col items-center justify-center">
                  <svg className="w-4 h-4 text-[#8B6914] mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                  <span className="text-[7px] font-bold text-[#8B6914] leading-none">MAP</span>
                </div>
              )}
            </button>

            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={zoom}
              mapTypeId={mapType}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                  position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM
                },
                mapTypeControl: false,
                scrollwheel: true,
                gestureHandling: "greedy",
                streetViewControl: false,
                fullscreenControl: false,
              }}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {filteredPoints
                .map((p) => ({ ...p, coords: getCoordinates(p) }))
                .filter((p) => p.coords)
                .map((point) => (
                  <MarkerF
                    key={point._id}
                    position={{
                      lat: point.coords.lat,
                      lng: point.coords.lng,
                    }}
                    onClick={() => handleRowClick(point)}
                    title={point.title}
                    icon={markerIcons[point._id]}
                  />
                ))}
            </GoogleMap>
          </div>
        )}
      </div>

      {/* Points Table */}
      <div className="bg-white rounded-2xl border border-[#e8ddd0] shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPoints}
          loading={loading}
          onRowClick={handleRowClick}
          emptyMessage={t.noPointsYet || "No collection points configured yet."}
        />
      </div>

      {/* CRUD Modal */}
      <CRUDModal
        isOpen={isCrudOpen}
        onClose={() => setIsCrudOpen(false)}
        title={modalMode === "create" ? t.addPoint || "Add Collection Point" : t.editPoint || "Edit Collection Point"}
        fields={pointFields}
        initialData={selectedPoint}
        onSubmit={handleCrudSubmit}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t.deleteLabel || "Delete Collection Point"}
        message={
          t.confirmDeletePointMsg ||
          "Are you sure you want to delete this point? Users will no longer see it on the map."
        }
        onConfirm={handleDeletePoint}
        onClose={() => setIsConfirmOpen(false)}
        loading={modalLoading}
      />

      {/* View Detail Modal */}
      {isViewOpen && selectedPoint && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[75vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-[#f0e8d8] flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#3a2a1a] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8B6914]" />{" "}
                {t.viewBtn || "View"}: {selectedPoint.title}
              </h2>
              <button
                onClick={() => setIsViewOpen(false)}
                className="text-[#9a8a7a] hover:text-[#3a2a1a] transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-[#3a2a1a] border-b pb-2">
                    {t.generalInfo || "General Information"}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-[#9a8a7a]">
                      {t.titleLabel || "Title"}:
                    </span>
                    <span className="font-medium text-[#3a2a1a]">
                      {selectedPoint.title}
                    </span>
                    <span className="text-[#9a8a7a]">{t.statusLabel || "Status"}:</span>
                    <span className="font-bold uppercase text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full w-fit">
                      {selectedPoint.status || "ACTIVE"}
                    </span>
                    <span className="text-[#9a8a7a]">{t.address || "Address"}:</span>
                    <span
                      className="font-medium text-[#3a2a1a] truncate"
                      title={selectedPoint.address}
                    >
                      {selectedPoint.address}
                    </span>
                    <span className="text-[#9a8a7a]">{t.dateLabel || "Date"}:</span>
                    <span className="font-medium text-[#3a2a1a]">
                      {selectedPoint.createdAt ? new Date(selectedPoint.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-[#3a2a1a] border-b pb-2">
                    {t.partner || "Partner"}
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#8B6914] text-white flex items-center justify-center font-bold overflow-hidden border border-[#e8ddd0]">
                      {(() => {
                        try {
                          const user = JSON.parse(localStorage.getItem("partnerUser") || "{}");
                          const imgUrl = user?.profileImage?.secure_url || user?.logo?.secure_url;
                          if (imgUrl) {
                            return <img src={imgUrl} alt="Logo" className="w-full h-full object-cover" />;
                          }
                          return (user?.company?.[0] || user?.firstName?.[0] || "P").toUpperCase();
                        } catch {
                          return "P";
                        }
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#3a2a1a]">
                        {(() => {
                          try {
                            const user = JSON.parse(localStorage.getItem("partnerUser") || "{}");
                            return user?.company || user?.firstName || "Partner";
                          } catch {
                            return "Partner";
                          }
                        })()}
                      </span>
                      <span className="text-xs text-[#9a8a7a]">
                        {(() => {
                          try {
                            return JSON.parse(localStorage.getItem("partnerUser") || "{}").email || "";
                          } catch {
                            return "";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-[#f5f0e8] p-4 rounded-xl">
                <h3 className="font-bold text-[#3a2a1a] text-sm">
                  {t.descriptionLabel || "Description"}
                </h3>
                <p className="text-sm text-[#5a4a3a] leading-relaxed whitespace-pre-wrap">
                  {selectedPoint.description || t.noDescription || "No description configured."}
                </p>
              </div>

              {selectedPoint.photo?.secure_url && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-bold text-[#3a2a1a] border-b pb-2">
                    {t.photoLabel || "Photo"}
                  </h3>
                  <img
                    src={selectedPoint.photo.secure_url}
                    alt="Point"
                    className="w-full max-h-64 object-cover rounded-lg border border-[#e8ddd0] shadow-sm"
                  />
                </div>
              )}

              {(selectedPoint.latitude || selectedPoint.location?.coordinates) && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-bold text-[#3a2a1a] border-b pb-2">
                    {t.localisationLabel || "Localization"}
                  </h3>
                  <p className="text-sm text-[#5a4a3a] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8B6914]" />{" "}
                    {selectedPoint.address}
                  </p>
                  <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden border border-[#e8ddd0]">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${selectedPoint.latitude || selectedPoint.location?.coordinates?.[1]},${selectedPoint.longitude || selectedPoint.location?.coordinates?.[0]}&hl=fr;z=14&output=embed`}
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
