import React from "react";
import styles from "./Navbar.module.css";
import {
  UserCircleIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const SearchResultsDropdown = ({ loading, results, onSelect }) => {
  const hasResults =
    results &&
    (results.users?.length > 0 ||
      results.dormitories?.length > 0 ||
      results.faculties?.length > 0);

  return (
    <div className={styles.searchResultsDropdown}>
      {loading && <div className={styles.searchResultItem}>Завантаження...</div>}
      {!loading && !hasResults && (
        <div className={styles.searchResultItem}>Нічого не знайдено.</div>
      )}

      {!loading &&
        hasResults && (
          <>
            {results.users?.length > 0 && (
              <div className={styles.searchResultGroup}>
                <h4 className={styles.searchResultGroupTitle}>Користувачі</h4>
                {results.users.map((user) => (
                  <div
                    key={`user-${user.id}`}
                    className={styles.searchResultItem}
                    onClick={() => onSelect(`/public-profile/${user.id}`)}
                  >
                    <UserCircleIcon />
                    <div>
                      <p>{user.name}</p>
                      <span>{user.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {results.dormitories?.length > 0 && (
              <div className={styles.searchResultGroup}>
                <h4 className={styles.searchResultGroupTitle}>Гуртожитки</h4>
                {results.dormitories.map((dorm) => (
                  <div
                    key={`dorm-${dorm.id}`}
                    className={styles.searchResultItem}
                    onClick={() => onSelect(`/dormitories`)}
                  >
                    <BuildingOffice2Icon />
                    <div>
                      <p>{dorm.name}</p>
                      <span>{dorm.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {results.faculties?.length > 0 && (
              <div className={styles.searchResultGroup}>
                <h4 className={styles.searchResultGroupTitle}>Факультети</h4>
                {results.faculties.map((faculty) => (
                  <div key={`faculty-${faculty.id}`} className={styles.searchResultItem} onClick={() => onSelect(`/dean/groups`)}>
                    <AcademicCapIcon />
                    <span>{faculty.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default SearchResultsDropdown;