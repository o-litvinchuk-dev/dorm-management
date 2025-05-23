import React from "react";
import ApplicationCard from "./ApplicationCard";
import styles from "./ApplicationCardList.module.css";

const ApplicationCardList = ({ applications, onViewDetails }) => {
  return (
    <div className={styles.cardList}>
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default ApplicationCardList;
