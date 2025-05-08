import React from 'react';

const ApplicationsTable = ({ category, applications, sortBy, sortOrder, onSortChange, onViewDetails }) => {
  // Define columns based on category
  const columns = category === 'accommodation' ? [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'dorm_number', label: 'Dorm Number' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ] : [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'surname', label: 'Surname' },
    { key: 'email', label: 'Email' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'course', label: 'Course' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Format status
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.key !== 'actions' ? (
                  <button
                    onClick={() => onSortChange(column.key)}
                    className="flex items-center space-x-1"
                  >
                    <span>{column.label}</span>
                    {sortBy === column.key && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map((app) => (
            <tr key={app.id}>
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {column.key === 'created_at' ? (
                    formatDate(app[column.key])
                  ) : column.key === 'status' ? (
                    formatStatus(app[column.key])
                  ) : column.key === 'actions' ? (
                    category === 'accommodation' ? (
                      <button
                        onClick={() => onViewDetails(app)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    ) : (
                      '-' // No details for general applications
                    )
                  ) : (
                    app[column.key] || '-'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsTable;