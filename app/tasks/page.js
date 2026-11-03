"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function TasksPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasksData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const [jobRes, approvalRes] = await Promise.all([
        supabase
          .from("agent_jobs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("approvals")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      setJobs(jobRes.data || []);
      setApprovals(approvalRes.data || []);
      setLoading(false);
    }

    fetchTasksData();
  }, [router]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading task center...</p>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      <div className="page-header">
        <span className="eyebrow">OPERATIONAL CONTROL</span>
        <h1>Task Center & Approvals</h1>
        <p>Monitor autonomous agent background jobs and pending user approvals.</p>
      </div>

      <div className="section-header">
        <h2>Pending Approvals</h2>
      </div>

      {approvals.length === 0 ? (
        <div className="empty-state">
          <p>No pending approvals. Your automated pipeline is fully cleared.</p>
        </div>
      ) : (
        <div className="list-card">
          {approvals.map((item) => (
            <div key={item.id} className="list-item">
              <div className="list-icon">✦</div>
              <div className="list-copy">
                <strong>{item.action_type}</strong>
                <p>{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-header" style={{ marginTop: "16px" }}>
        <h2>Agent Jobs Activity</h2>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <p>No background agent jobs recorded yet.</p>
        </div>
      ) : (
        <div className="list-card">
          {jobs.map((job) => (
            <div key={job.id} className="list-item">
              <div className="list-icon">⚙</div>
              <div className="list-copy">
                <strong>{job.task_type}</strong>
                <p>{job.error_message || "Agent background execution"}</p>
              </div>
              <span className={`status-pill ${job.status?.toLowerCase()}`}>{job.status}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .page-header {
          margin-bottom: 4px;
        }

        .eyebrow {
          color: #52b5ff;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .page-header h1 {
          font-size: 26px;
          margin: 4px 0;
          letter-spacing: -0.5px;
        }

        .page-header p {
          color: #8da2bb;
          font-size: 12px;
          margin: 0;
        }

        .section-header h2 {
          font-size: 14px;
          margin: 0;
        }

        .list-card {
          padding: 0 14px;
          background: rgba(15, 27, 44, 0.7);
          border: 1px solid rgba(112, 165, 220, 0.16);
          border-radius: 14px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(112, 165, 220, 0.1);
        }

        .list-item:last-child {
          border-bottom: 0;
        }

        .list-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          background: rgba(37, 216, 232, 0.1);
          color: #25d8e8;
          border-radius: 8px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .list-copy {
          flex: 1;
          min-width: 0;
        }

        .list-copy strong {
          display: block;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .list-copy p {
          margin: 0;
          font-size: 9px;
          color: #8da2bb;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          background: rgba(129, 145, 166, 0.1);
          color: #aab7c8;
        }

        .status-pill.completed, .status-pill.approved {
          background: rgba(69, 223, 170, 0.15);
          color: #45dfaa;
        }

        .status-pill.pending, .status-pill.running {
          background: rgba(50, 152, 255, 0.15);
          color: #3298ff;
        }

        .status-pill.failed, .status-pill.rejected {
          background: rgba(255, 117, 139, 0.15);
          color: #ff9aa9;
        }

        .empty-state {
          padding: 20px;
          text-align: center;
          background: rgba(15, 27, 44, 0.4);
          border: 1px dashed rgba(112, 165, 220, 0.2);
          border-radius: 12px;
          color: #8da2bb;
          font-size: 11px;
        }

        .page-loading {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #8da2bb;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(82, 144, 201, 0.22);
          border-top-color: #25d8e8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
