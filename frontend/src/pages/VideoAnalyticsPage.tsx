import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Location, VideoAnalysisResult } from '../types';
import {
  Upload,
  Video,
  Car,
  Bus,
  Truck,
  Activity,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoAnalyticsPageProps {
  configuredLocations: Location[];
}

export const VideoAnalyticsPage: React.FC<VideoAnalyticsPageProps> = ({ configuredLocations }) => {
  const navigate = useNavigate();

  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    configuredLocations[0]?.id || 'hyd-hitech-city'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<VideoAnalysisResult[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Load existing jobs
  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.getVideoJobs();
      setJobs(data);
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].job_id);
      }
    } catch (err: any) {
      console.error('Failed to load video jobs', err);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Periodic polling for pending or processing jobs
  useEffect(() => {
    const hasActiveJob = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
    if (!hasActiveJob) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.getVideoJobs();
        setJobs(data);
      } catch (err) {
        // quiet error on poll
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [jobs]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Upload and trigger analysis
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await api.uploadTrafficVideo(selectedFile, selectedLocationId);
      setSelectedJobId(response.job_id);
      setSelectedFile(null);
      await fetchJobs();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video.');
    } finally {
      setIsUploading(false);
    }
  };

  const activeJob = jobs.find((j) => j.job_id === selectedJobId) || jobs[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            CCTV & Traffic Video Analytics Workspace
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            YOLOv8 deep learning vehicle detection and ByteTrack tracking across recorded video feeds
          </p>
        </div>
      </div>

      {/* Methodological Transparency Disclaimer */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          fontSize: '0.78rem',
          color: '#1e40af',
          lineHeight: 1.45,
        }}
      >
        <Info size={17} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>Operational Context:</strong> This module performs automated computer vision analysis on recorded traffic video files. It is <em>not</em> an unverified live streaming CCTV feed. Raw vehicle count alone is insufficient to establish congestion; the pipeline calculates vehicle flow rate over the observed duration and defines density relative to camera field-of-view capacity.
        </div>
      </div>

      {/* Main Grid: Upload & Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: '1.25rem' }}>
        {/* Left Column: Video Upload & Job History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Upload Form Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.85rem' }}>
              <Upload size={17} color="#2563eb" />
              <span>Upload Traffic Video</span>
            </div>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Location Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Associated Hyderabad Corridor:
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                >
                  {configuredLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.area_type || 'Corridor'})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Video File (MP4, AVI, MOV, WebM - Max 100MB):
                </label>
                <input
                  type="file"
                  accept=".mp4,.avi,.mov,.mkv,.webm"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                    fontSize: '0.78rem',
                    background: '#f8fafc',
                  }}
                />
                {selectedFile && (
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 500 }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                )}
              </div>

              {uploadError && (
                <div style={{ color: '#dc2626', fontSize: '0.75rem', background: '#fef2f2', padding: '0.45rem', borderRadius: '4px' }}>
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                style={{
                  background: isUploading ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.55rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.2rem',
                }}
              >
                <Video size={15} />
                <span>{isUploading ? 'Uploading & Processing...' : 'Start YOLO Analysis'}</span>
              </button>
            </form>
          </div>

          {/* Video Analysis Jobs History */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1.1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              maxHeight: '420px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                Video Archive ({jobs.length})
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Select to inspect</span>
            </div>

            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', padding: '1.5rem 0' }}>
                No video analyses uploaded yet. Upload a video clip above to begin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {jobs.map((job) => {
                  const isSelected = job.job_id === activeJob?.job_id;
                  return (
                    <div
                      key={job.job_id}
                      onClick={() => setSelectedJobId(job.job_id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                          {job.location_name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background:
                              job.status === 'completed'
                                ? '#dcfce7'
                                : job.status === 'failed'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              job.status === 'completed'
                                ? '#166534'
                                : job.status === 'failed'
                                ? '#991b1b'
                                : '#92400e',
                          }}
                        >
                          {job.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.filename}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        <span>{job.counts?.total_unique || 0} unique veh</span>
                        <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Analysis Workspace */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {activeJob ? (
            <>
              {/* Job Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
                      Active Analysis
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Job ID: {activeJob.job_id}</span>
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0 0' }}>
                    {activeJob.location_name} Corridor
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Uploaded {new Date(activeJob.created_at).toLocaleString()} • {activeJob.filename} ({(activeJob.file_size_bytes / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {activeJob.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/risk-analysis?location=${activeJob.location_id}&video=${activeJob.job_id}`)}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <ShieldAlert size={14} />
                      <span>Evaluate Risk With This Video</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar if processing */}
              {(activeJob.status === 'processing' || activeJob.status === 'pending') && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
                    <span>Running YOLOv8 vehicle detection & ByteTrack tracking...</span>
                    <span>{activeJob.progress_pct}%</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${activeJob.progress_pct}%`,
                        background: '#2563eb',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Failure Error Alert */}
              {activeJob.status === 'failed' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <AlertCircle size={16} />
                    <span>Analysis Error</span>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>{activeJob.error_message}</div>
                </div>
              )}

              {/* Video Player & Annotated Preview Keyframe */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                {/* 1. Stored Video Stream */}
                <div style={{ background: '#090d16', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0.4rem 0.75rem', background: '#1e293b', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600 }}>
                    Source Video Stream
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', minHeight: '220px' }}>
                    <video
                      controls
                      src={`/api/v1/videos/${activeJob.job_id}/stream`}
                      style={{ maxWidth: '100%', maxHeight: '260px' }}
                    />
                  </div>
                </div>

                {/* 2. Annotated Peak Traffic Keyframe Snapshot */}
                <div style={{ background: '#090d16', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0.4rem 0.75rem', background: '#1e293b', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Annotated Keyframe (YOLO Bounding Boxes)</span>
                    <span style={{ color: '#4ade80' }}>Active Tracks</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', minHeight: '220px' }}>
                    {activeJob.preview_image_path ? (
                      <img
                        src={activeJob.preview_image_path}
                        alt="Peak traffic detection bounding boxes"
                        style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Annotated preview snapshot generating...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Metrics Breakdown */}
              {activeJob.status === 'completed' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {/* Total Unique Vehicles */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Unique Vehicles</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                        {activeJob.counts.total_unique}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Distinct ByteTrack IDs</div>
                    </div>

                    {/* Flow Rate */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Vehicle Flow Rate</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.1rem' }}>
                        {activeJob.vehicle_flow_rate_per_min || 0}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>vehicles / minute</div>
                    </div>

                    {/* Peak Concurrent */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Peak Concurrent</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                        {activeJob.peak_concurrent_vehicles || 0}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Vehicles in single frame</div>
                    </div>

                    {/* Observed Density */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Estimated Density</div>
                      <div
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color:
                            activeJob.density_estimate === 'severe'
                              ? '#dc2626'
                              : activeJob.density_estimate === 'high'
                              ? '#ea580c'
                              : activeJob.density_estimate === 'moderate'
                              ? '#d97706'
                              : '#16a34a',
                          marginTop: '0.2rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeJob.density_estimate || 'UNKNOWN'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Occupancy: {Math.round((activeJob.density_score || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Class Distribution Breakdown */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>
                      Vehicle Class Breakdown (COCO Vehicle Classes)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Car size={18} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cars</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{activeJob.counts.car}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Bus size={18} color="#059669" />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Buses</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{activeJob.counts.bus}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Truck size={18} color="#d97706" />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Trucks</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{activeJob.counts.truck}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Activity size={18} color="#7c3aed" />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Motorcycles</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{activeJob.counts.motorcycle}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Technical Properties */}
                  <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    <span><strong>Duration:</strong> {activeJob.video_duration_sec}s</span>
                    <span><strong>FPS:</strong> {activeJob.fps}</span>
                    <span><strong>Frames Analyzed:</strong> {activeJob.total_frames_analyzed}</span>
                    <span><strong>Model:</strong> Ultralytics YOLOv8n + ByteTrack</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Video size={40} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginTop: '0.5rem' }}>
                No Video Job Selected
              </div>
              <div style={{ fontSize: '0.75rem', maxWidth: '280px', textAlign: 'center', marginTop: '0.2rem' }}>
                Select an existing job from the left or upload a recorded traffic video to run detection.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
