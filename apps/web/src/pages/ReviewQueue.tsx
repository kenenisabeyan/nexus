import { useEffect, useState } from "react";
import { api } from "../api";
import type { KnowledgeItem, Severity } from "@nexus/types";

export function ReviewQueue() {
  const [pendingItems, setPendingItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states per item
  const [rejectionReason, setRejectionReason] = useState<Record<number, string>>({});
  const [severityMap, setSeverityMap] = useState<Record<number, Severity>>({});
  const [confidenceMap, setConfidenceMap] = useState<Record<number, number>>({});
  const [rankMap, setRankMap] = useState<Record<number, number>>({});
  const [actionMap, setActionMap] = useState<Record<number, string>>({});
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.pendingIngestion();
      setPendingItems(res.pending);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load pending queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleVerify = async (item: KnowledgeItem) => {
    try {
      setActionSuccess(null);
      const severity = severityMap[item.id] || "notable";
      const confidence = confidenceMap[item.id] ?? 0.85;
      const importance_rank = rankMap[item.id] ?? 5;
      const recommended_action = actionMap[item.id] || "Verified intelligence update.";

      await api.verifyIngestion(item.id, {
        status: "verified",
        severity,
        confidence,
      });

      setActionSuccess(`Item #${item.id} approved and published to Knowledge Base.`);
      setPendingItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to verify item");
    }
  };

  const handleReject = async (item: KnowledgeItem) => {
    const reason = rejectionReason[item.id];
    if (!reason || !reason.trim()) {
      alert("Please provide a reason for rejecting this item.");
      return;
    }

    try {
      setActionSuccess(null);
      await api.verifyIngestion(item.id, {
        status: "rejected",
        rejection_reason: reason,
      });

      setActionSuccess(`Item #${item.id} rejected and archived.`);
      setPendingItems((prev) => prev.filter((i) => i.id !== item.id));
      setRejectingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject item");
    }
  };

  if (loading) return <div className="page-container"><p>Loading ingestion review queue...</p></div>;

  return (
    <div className="page-container">
      <div className="header-row">
        <h2>Human Review & Ingestion Queue</h2>
        <button onClick={loadPending} className="btn btn-secondary">Refresh Queue</button>
      </div>
      <p className="subtitle">
        Review unverified items ingested from external adapters. Approved items enter the living knowledge graph.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {actionSuccess && <div className="success-banner">{actionSuccess}</div>}

      {pendingItems.length === 0 ? (
        <div className="empty-state">
          <h3>🎉 Queue is clear!</h3>
          <p>No unverified items currently awaiting human review.</p>
        </div>
      ) : (
        <div className="review-list">
          {pendingItems.map((item) => (
            <div key={item.id} className="review-card">
              <div className="review-card-header">
                <span className="badge category-badge">{item.category}</span>
                <span className="badge status-unverified">Unverified</span>
                {item.origin_url && (
                  <a href={item.origin_url} target="_blank" rel="noopener noreferrer" className="source-link">
                    Source Link ↗
                  </a>
                )}
                <span className="date-tag">{new Date(item.published_at).toLocaleDateString()}</span>
              </div>

              <h3 className="review-card-title">{item.title}</h3>
              <p className="review-card-summary">{item.summary}</p>

              <div className="review-controls">
                <div className="control-group">
                  <label>Severity:</label>
                  <select
                    value={severityMap[item.id] || "notable"}
                    onChange={(e) => setSeverityMap({ ...severityMap, [item.id]: e.target.value as Severity })}
                  >
                    <option value="routine">Routine</option>
                    <option value="notable">Notable</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Confidence (0.0 - 1.0):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={confidenceMap[item.id] ?? 0.85}
                    onChange={(e) => setConfidenceMap({ ...confidenceMap, [item.id]: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="control-group">
                  <label>Rank (1 - 10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rankMap[item.id] ?? 5}
                    onChange={(e) => setRankMap({ ...rankMap, [item.id]: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className="control-group action-input-group">
                <label>Recommended Action:</label>
                <input
                  type="text"
                  placeholder="e.g. Upgrade dependencies to patch security vulnerability"
                  value={actionMap[item.id] || ""}
                  onChange={(e) => setActionMap({ ...actionMap, [item.id]: e.target.value })}
                />
              </div>

              {rejectingId === item.id ? (
                <div className="rejection-box">
                  <textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason[item.id] || ""}
                    onChange={(e) => setRejectionReason({ ...rejectionReason, [item.id]: e.target.value })}
                  />
                  <div className="btn-group">
                    <button onClick={() => handleReject(item)} className="btn btn-danger">Confirm Rejection</button>
                    <button onClick={() => setRejectingId(null)} className="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="btn-group">
                  <button onClick={() => handleVerify(item)} className="btn btn-primary">Approve & Publish</button>
                  <button onClick={() => setRejectingId(item.id)} className="btn btn-danger-outline">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
