import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/DormitoriesPage.module.css";
import { ToastService } from "../../utils/toastConfig";
import DormitoryCard from "./DormitoryCard";
import DormitoryMap from "./DormitoryMap";
import { BuildingOfficeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const KYIV_CENTER = { lat: 50.4501, lng: 30.5234 };

const DormitoriesPage = () => {
  const [dormitories, setDormitories] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDormitory, setSelectedDormitory] = useState(null);
  const [mapCenter, setMapCenter] = useState(KYIV_CENTER);
  const [mapZoom, setMapZoom] = useState(11);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchDormitories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/dormitories");
      setDormitories(response.data || []);
    } catch (error) {
      console.error("Помилка отримання гуртожитків:", error);
      ToastService.error("Не вдалося завантажити гуртожитки");
      setError("Не вдалося завантажити дані. Спробуйте оновити сторінку.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDormitories();
  }, [fetchDormitories]);

  const filteredDormitories = useMemo(() => {
    if (!searchTerm) return dormitories;
    return dormitories.filter(
      (dorm) =>
        dorm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dorm.address && dorm.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [dormitories, searchTerm]);

  const getDormitoryCoords = useCallback((dormitory) => {
    if (!dormitory || !dormitory.address) return null;
    const address = dormitory.address.toLowerCase();
    if (address.includes("студентська, 1")) return { lat: 50.4510, lng: 30.4700 };
    if (address.includes("перемоги, 37")) return { lat: 50.4505, lng: 30.4590 };
    if (address.includes("горіхуватський шлях, 7a")) return { lat: 50.3838, lng: 30.4930 };
    const latLngMatch = address.match(/(\d{2}\.\d+),\s*(\d{2}\.\d+)/);
    if (latLngMatch) return { lat: parseFloat(latLngMatch[1]), lng: parseFloat(latLngMatch[2]) };
    return null;
  }, []);


  const handleViewOnMap = useCallback((dormitory) => {
    const coords = getDormitoryCoords(dormitory);
    if (coords) {
      setMapCenter(coords);
      setMapZoom(15);
      setSelectedDormitory(dormitory); // To potentially open popup programmatically if map supports it
    } else {
      ToastService.info("Координати для цього гуртожитку не знайдено.");
    }
  }, [getDormitoryCoords]);

  const handleMarkerClick = useCallback((dormitory) => {
    setSelectedDormitory(dormitory);
    const coords = getDormitoryCoords(dormitory);
    if (coords) {
      setMapCenter(coords);
      // map zoom level can be preserved or set to a detail level
    }
  }, [getDormitoryCoords]);


  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              <BuildingOfficeIcon className={styles.titleIcon} />
              Наші Гуртожитки
            </h1>
            <div className={styles.searchBar}>
              <MagnifyingGlassIcon className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Пошук за назвою або адресою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {isLoading && <div className={styles.loading}>Завантаження гуртожитків...</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {!isLoading && !error && (
            <div className={styles.contentGrid}>
              <div className={styles.listColumn}>
                {filteredDormitories.length > 0 ? (
                  filteredDormitories.map((dorm) => (
                    <DormitoryCard
                      key={dorm.id}
                      dormitory={dorm}
                      onViewOnMap={handleViewOnMap}
                      // onShowDetails={() => { /* TODO: Implement modal or detail view */ }}
                    />
                  ))
                ) : (
                  <p className={styles.emptyMessage}>Гуртожитків за вашим запитом не знайдено.</p>
                )}
              </div>
              <div className={styles.mapColumn}>
                <DormitoryMap
                  dormitories={filteredDormitories.filter(d => getDormitoryCoords(d))} // Only pass dorms with coords
                  selectedDormitory={selectedDormitory}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DormitoriesPage;