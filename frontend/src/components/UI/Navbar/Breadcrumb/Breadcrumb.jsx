import React from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const formatName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");
  };

  // Мапа іконок для першого елемента
  const getIcon = (name) => {
    const icons = {
      dashboard: ChartBarIcon,
      applications: DocumentTextIcon,
      dormitories: UserGroupIcon,
      services: ClipboardDocumentListIcon,
      settlement: CalendarIcon,
      settings: Cog6ToothIcon,
    };
    const IconComponent = icons[name.toLowerCase()] || ChartBarIcon;
    return <IconComponent className={styles.breadcrumbIcon} />;
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className={styles.breadcrumb}>
      <ul className={styles.breadcrumbList}>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const displayName = formatName(value);

          return (
            <li key={to} className={styles.breadcrumbItem}>
              {index === 0 && getIcon(value)} {/* Іконка тільки для першого елемента */}
              {isLast ? (
                <span className={styles.breadcrumbCurrent}>{displayName}</span>
              ) : (
                <Link to={to} className={styles.breadcrumbLink}>
                  {displayName}
                </Link>
              )}
              {!isLast && (
                <ChevronRightIcon className={styles.breadcrumbSeparator} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;