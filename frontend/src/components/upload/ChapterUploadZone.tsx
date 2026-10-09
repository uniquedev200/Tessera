'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle,
  Zap,
  X,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useGraphStore } from '@/store/useGraphStore';
import { useRotatingMessages } from '@/lib/useRotatingMessages';

export const ChapterUploadZone: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chapterNumber?: number;
}> = ({ isOpen, onClose, chapterNumber = 1 }) => {
  const { userProfile, loadUserGraph, setLatestArtifact } = useGraphStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const uploadRotatingText = useRotatingMessages(
    React.useMemo(
      () => [
        'Parsing syllabus text and extracting structure...',
        'Extracting atomic concepts & causal laws...',
        'Building multi-branching causal DAG topology...',
        'Indexing semantic embeddings into vector store...',
        `Formulating distinct analogies in ${userProfile?.hobby_anchor || 'domain'}...`,
        'Discovering cross-chapter isomorphism bridges...',
        'Synthesizing Bayesian Knowledge Tracing priors...',
        'Finalizing pedagogical graph nodes...',
      ],
      [userProfile?.hobby_anchor]
    ),
    1300,
    isProcessing
  );

  if (!isOpen) return null;

  const handleFileUpload = async () => {
    if (!selectedFile || !userProfile?.id) return;
    setIsProcessing(true);
    setError(null);
    try {
      setExtractionStep('Parsing syllabus text and extracting structure...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', userProfile.id);
      formData.append('hobby_anchor', userProfile.hobby_anchor);
      if (title) formData.append('title', title);
      if (subject) formData.append('subject', subject);

      setExtractionStep('Synthesizing atomic concept skill tree...');
      const res = await api.uploadChapter(formData);

      setExtractionStep('Weaving cross-chapter isomorphism bridges...');
      await loadUserGraph(userProfile.id);

      if (res.data?.isomorphism_bridges && res.data.isomorphism_bridges.length > 0) {
        const b = res.data.isomorphism_bridges[0];
        setLatestArtifact({
          bridge_label: b.relationship_label,
          real_world_artifact:
            b.real_world_artifact ||
            'Cross-Chapter Isomorphism: Discovered structural mathematical duality between both chapters.',
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Chapter upload and extraction failed');
    } finally {
      setIsProcessing(false);
      setExtractionStep('');
    }
  };

  const handleSeedSample = async (sampleId: number) => {
    if (!userProfile?.id) return;
    setIsProcessing(true);
    setError(null);
    try {
      setExtractionStep(`Synthesizing textbook Chapter ${sampleId} grounded in ${userProfile.hobby_anchor}...`);
      const res = await api.seedSampleChapter(userProfile.id, sampleId, userProfile.hobby_anchor);

      setExtractionStep('Loading concept hulls and epistemic nodes...');
      await loadUserGraph(userProfile.id);

      if (res.data?.isomorphism_bridges && res.data.isomorphism_bridges.length > 0) {
        const b = res.data.isomorphism_bridges[0];
        setLatestArtifact({
          bridge_label: b.relationship_label,
          real_world_artifact:
            b.real_world_artifact ||
            'Cross-Chapter Isomorphism: Discovered structural mathematical duality between both chapters.',
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Sample generation failed');
    } finally {
      setIsProcessing(false);
      setExtractionStep('');
    }
  };

  const handleLoadSamplePdf = async (filename: string, sampleTitle: string, sampleSubject: string) => {
    try {
      const res = await fetch(`/sample_pdfs/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch sample file');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'application/pdf' });
      setSelectedFile(file);
      setTitle(sampleTitle);
      setSubject(sampleSubject);
    } catch (err: any) {
      console.error('Error loading sample pdf:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-bauhaus-ink bg-white/95 backdrop-blur-md p-6 shadow-[8px_8px_0px_#171A21]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-bauhaus-muted hover:text-bauhaus-ink transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-bauhaus-blue text-white flex items-center justify-center border-2 border-bauhaus-ink shadow-[2px_2px_0px_#171A21]">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-bauhaus-blue font-bold px-2 py-0.5 rounded-full bg-bauhaus-blue/10 border border-bauhaus-blue">
              {chapterNumber === 1 ? 'Phase 2: Cold-Start Ingestion' : 'Phase 3: Multi-Chapter Ingestion'}
            </span>
            <h2 className="text-lg font-black text-bauhaus-ink mt-0.5 font-mono">
              {chapterNumber === 1 ? 'Upload Chapter 1 Syllabus PDF' : 'Add Next Chapter or Subject'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-bauhaus-muted mb-4 font-sans leading-relaxed">
          Upload any textbook chapter PDF. Tessera analyzes core causal invariants and builds an interactive skill tree grounded in your interests.
        </p>

        {/* Dropzone */}
        <div className="mb-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-bauhaus-ink rounded-xl cursor-pointer bg-white hover:bg-blue-50/40 hover:border-bauhaus-blue transition-all">
            <div className="flex flex-col items-center justify-center pt-4 pb-5">
              {selectedFile ? (
                <>
                  <FileText className="w-8 h-8 text-bauhaus-blue mb-1.5" />
                  <p className="text-xs font-bold text-bauhaus-ink font-mono">{selectedFile.name}</p>
                  <p className="text-[10px] text-bauhaus-muted font-mono mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-bauhaus-muted mb-1.5" />
                  <p className="text-xs font-bold text-bauhaus-ink font-mono">
                    Click to select or drag and drop PDF
                  </p>
                  <p className="text-[10px] text-bauhaus-muted font-mono mt-0.5">PDF syllabus up to 50MB</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
            />
          </label>
          {/* Sample PDF quick-loaders */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 px-1">
            <span className="text-[10px] text-bauhaus-muted font-mono font-medium">Sample PDFs for testing:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  handleLoadSamplePdf(
                    'Chapter_1_Electric_Potential_and_Drift_Dynamics.pdf',
                    'Electric Potential & Drift Dynamics',
                    'Physics: Electromagnetism'
                  )
                }
                className="text-[10px] text-bauhaus-blue hover:underline font-mono font-bold flex items-center gap-1"
                title="Load into dropzone"
              >
                <span>Ch 1 PDF</span>
              </button>
              <a
                href="/sample_pdfs/Chapter_1_Electric_Potential_and_Drift_Dynamics.pdf"
                download
                className="text-bauhaus-muted hover:text-bauhaus-ink"
                title="Download Chapter 1 PDF"
              >
                <Download className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-bauhaus-muted/40">|</span>
              <button
                type="button"
                onClick={() =>
                  handleLoadSamplePdf(
                    'Chapter_2_Resistive_Circuits_and_Thermal_Dissipation.pdf',
                    'Resistive Circuits & Thermal Dissipation',
                    'Physics: Circuit Dynamics'
                  )
                }
                className="text-[10px] text-bauhaus-blue hover:underline font-mono font-bold flex items-center gap-1"
                title="Load into dropzone"
              >
                <span>Ch 2 PDF</span>
              </button>
              <a
                href="/sample_pdfs/Chapter_2_Resistive_Circuits_and_Thermal_Dissipation.pdf"
                download
                className="text-bauhaus-muted hover:text-bauhaus-ink"
                title="Download Chapter 2 PDF"
              >
                <Download className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-bauhaus-muted/40">|</span>
              <button
                type="button"
                onClick={() =>
                  handleLoadSamplePdf(
                    'Chapter_3_Capacitance_and_Electrostatic_Energy.pdf',
                    'Capacitance & Electrostatic Energy',
                    'Physics: Electrostatics'
                  )
                }
                className="text-[10px] text-bauhaus-blue hover:underline font-mono font-bold flex items-center gap-1"
                title="Load into dropzone"
              >
                <span>Ch 3 PDF</span>
              </button>
              <a
                href="/sample_pdfs/Chapter_3_Capacitance_and_Electrostatic_Energy.pdf"
                download
                className="text-bauhaus-muted hover:text-bauhaus-ink"
                title="Download Chapter 3 PDF"
              >
                <Download className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-bold text-bauhaus-ink block mb-1 font-mono">Chapter Title</label>
            <input
              type="text"
              placeholder="e.g. Electric Potential & Work"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-bauhaus-ink bg-white px-3.5 py-2 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-bauhaus-ink block mb-1 font-mono">Subject</label>
            <input
              type="text"
              placeholder="e.g. Physics / Circuit Theory"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border-2 border-bauhaus-ink bg-white px-3.5 py-2 text-xs font-mono text-bauhaus-ink placeholder-bauhaus-muted focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
            />
          </div>
        </div>

        {/* Quick Demo Pre-seed Buttons */}
        <div className="mb-4 p-3.5 rounded-xl bg-white border-2 border-bauhaus-ink shadow-[3px_3px_0px_#171A21]">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-bauhaus-ink font-mono mb-2">
            <Zap className="w-3.5 h-3.5 text-bauhaus-amber" />
            <span>Instant Sample Curriculum:</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSeedSample(1)}
              disabled={isProcessing}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-bauhaus-ink text-[11px] font-mono font-bold text-bauhaus-ink text-left transition-all shadow-[1px_1px_0px_#171A21] flex items-center justify-between"
            >
              <span>Seed Ch 1: Electric Potential</span>
              <Sparkles className="w-3.5 h-3.5 text-bauhaus-amber" />
            </button>
            <button
              onClick={() => handleSeedSample(2)}
              disabled={isProcessing}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-bauhaus-ink text-[11px] font-mono font-bold text-bauhaus-ink text-left transition-all shadow-[1px_1px_0px_#171A21] flex items-center justify-between"
            >
              <span>Seed Ch 2: Resistive Circuits</span>
              <Sparkles className="w-3.5 h-3.5 text-bauhaus-amber" />
            </button>
          </div>
        </div>

        {/* Progress & Error */}
        {isProcessing && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50/70 border-2 border-bauhaus-blue flex items-center space-x-2.5 text-xs font-mono text-bauhaus-blue animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-bauhaus-blue shrink-0" />
            <span className="truncate">{uploadRotatingText}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50/70 border-2 border-bauhaus-red text-xs font-mono text-bauhaus-red font-bold">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-bauhaus-ink">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-bauhaus-muted hover:text-bauhaus-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || isProcessing}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-bauhaus-ink hover:bg-bauhaus-blue text-white font-mono font-bold text-xs border-2 border-bauhaus-ink shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                <span className="truncate">Processing Pipeline...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span>Upload & Extract Graph</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
