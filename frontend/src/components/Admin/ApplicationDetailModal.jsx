import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ToastService } from "../../utils/toastConfig";

const ApplicationDetailModal = ({ category, application, onClose, onStatusUpdate, onAddComment }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState(application.status || 'pending');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch comments for accommodation applications
  const fetchComments = async () => {
    if (category !== 'accommodation') return;
    setIsLoading(true);
    try {
      const response = await api.get(`/api/v1/admin/accommodation-applications/${application.id}/comments`);
      setComments(response.data);
    } catch (err) {
      ToastService.error('Failed to fetch comments');
      console.error('[ApplicationDetailModal] Fetch comments error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [application.id, category]);

  // Handle status change
  const handleStatusChange = async () => {
    try {
      await onStatusUpdate(application.id, newStatus);
      setComments([]); // Clear comments to force refetch
      fetchComments(); // Refetch comments after status update
    } catch (err) {
      console.error('[ApplicationDetailModal] Status change error:', err);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      ToastService.error('Comment cannot be empty');
      return;
    }
    try {
      await onAddComment(application.id, newComment);
      setNewComment('');
      fetchComments(); // Refetch comments after adding
    } catch (err) {
      console.error('[ApplicationDetailModal] Comment submit error:', err);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          Application Details {category === 'accommodation' ? '(Accommodation)' : '(General)'}
        </h2>

        {/* Application Details */}
        <div className="space-y-4">
          {category === 'accommodation' ? (
            <>
              <p><strong>ID:</strong> {application.id}</p>
              <p><strong>Full Name:</strong> {application.full_name}</p>
              <p><strong>Email:</strong> {application.email}</p>
              <p><strong>Dorm Number:</strong> {application.dorm_number || '-'}</p>
              <p><strong>Status:</strong> {application.status}</p>
              <p><strong>Created At:</strong> {formatDate(application.created_at)}</p>
              <p><strong>Course:</strong> {application.course || '-'}</p>
              <p><strong>Group:</strong> {application.group_name || '-'}</p>
              <p><strong>Faculty:</strong> {application.faculty || '-'}</p>
              <p><strong>Phone:</strong> {application.phone_number || '-'}</p>
              <p><strong>Start Date:</strong> {application.start_date ? formatDate(application.start_date) : '-'}</p>
              <p><strong>End Date:</strong> {application.end_date ? formatDate(application.end_date) : '-'}</p>
            </>
          ) : (
            <>
              <p><strong>ID:</strong> {application.id}</p>
              <p><strong>Name:</strong> {application.name}</p>
              <p><strong>Surname:</strong> {application.surname}</p>
              <p><strong>Email:</strong> {application.email}</p>
              <p><strong>Faculty:</strong> {application.faculty || '-'}</p>
              <p><strong>Course:</strong> {application.course || '-'}</p>
              <p><strong>Created At:</strong> {formatDate(application.created_at)}</p>
            </>
          )}
        </div>

        {/* Status Update (Accommodation Only) */}
        {category === 'accommodation' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Update Status</h3>
            <div className="flex space-x-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={handleStatusChange}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {/* Comments (Accommodation Only) */}
        {category === 'accommodation' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Comments</h3>
            {isLoading ? (
              <p>Loading comments...</p>
            ) : comments.length > 0 ? (
              <ul className="space-y-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-b py-2">
                    <p><strong>{comment.admin_name}</strong> ({formatDate(comment.created_at)})</p>
                    <p>{comment.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No comments yet.</p>
            )}
            <div className="mt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Add a comment..."
              />
              <button
                onClick={handleCommentSubmit}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Comment
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;