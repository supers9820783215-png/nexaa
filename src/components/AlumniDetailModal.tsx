import React, { useState } from 'react';
import { AlumniDirectoryItem, Opportunity } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { connectionsApi, mentorshipApi } from '../services/api.ts';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  HeartHandshake
import { UserAvatar } from './common/UserAvatar.tsx';

interface AlumniDetailModalProps {
  alumni: (AlumniDirectoryItem & { postedOpportunities?: Opportunity[] }) | null;
  onClose: () => void;
  onConnectionUpdated?: () => void;
  onOpenAuth: () => void;
}

export const AlumniDetailModal: React.FC<AlumniDetailModalProps> = ({
  alumni,
  onClose,
  onConnectionUpdated,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [connStatus, setConnStatus] = useState<string | null>(alumni?.connection?.status || null);

  // Mentorship request sub-form state
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorTopic, setMentorTopic] = useState('Career Guidance & Portfolio Review');
  const [mentorMessage, setMentorMessage] = useState('');
  const [mentorSending, setMentorSending] = useState(false);
  const [mentorSuccess, setMentorSuccess] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  if (!alumni) return null;

  const handleConnect = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setConnecting(true);
    try {
      await connectionsApi.request(alumni.id);
      setConnStatus('PENDING');
      if (onConnectionUpdated) onConnectionUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSendMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setMentorSending(true);
    setMentorError(null);
    try {
      await mentorshipApi.sendRequest(alumni.id, mentorTopic, mentorMessage);
      setMentorSuccess(true);
      setShowMentorForm(false);
    } catch (err: any) {
      setMentorError(err.message || 'Failed to send mentorship request.');
    } finally {
      setMentorSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#494D5F]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="alumni-detail-modal"
        className="bg-white rounded-3xl shadow-2xl border border-[#E5EAF5] w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95"
      >
        {/* Banner with Accent */}
        <div className="h-28 bg-gradient-to-r from-[#8458B3] via-[#71489d] to-[#494D5F] relative p-4 flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Head */}
        <div className="px-6 pb-6 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <UserAvatar
                name={alumni.name}
                size="xl"
                className="w-24 h-24 text-3xl border-4 border-white shadow-md"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-[#494D5F] font-heading">{alumni.name}</h3>
                  {alumni.verification_status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A0D2EB]/30 text-[#255b7c] border border-[#A0D2EB]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#255b7c]" />
                      Verified Alumnus
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[#494D5F]/80">
                  {alumni.designation} at <span className="font-bold text-[#8458B3]">{alumni.company}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-[#494D5F]/60 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8458B3]" />
                    {alumni.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#8458B3]" />
                    {alumni.experience} yrs exp
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {user?.id !== alumni.id && (
                <>
                  {connStatus === 'ACCEPTED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#A0D2EB]/20 text-[#255b7c] border border-[#A0D2EB]">
                      <CheckCircle2 className="w-4 h-4 text-[#255b7c]" />
                      Connected
                    </span>
                  ) : connStatus === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#D0BDF4]/30 text-[#8458B3] border border-[#D0BDF4]">
                      <Clock className="w-4 h-4 text-[#8458B3]" />
                      Request Sent
                    </span>
                  ) : (
                    <button
                      id="modal-connect-btn"
                      onClick={handleConnect}
                      disabled={connecting}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8458B3] to-[#71489d] hover:from-[#71489d] hover:to-[#5d3b82] text-white text-xs font-bold shadow-md shadow-[#8458B3]/25 transition-all disabled:opacity-50"
                    >
                      {connecting ? 'Sending...' : '+ Connect'}
                    </button>
                  )}

                  {alumni.mentoring_available && (
                    <button
                      id="modal-request-mentor-btn"
                      onClick={() => {
                        if (!user) onOpenAuth();
                        else setShowMentorForm(!showMentorForm);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#E5EAF5] hover:bg-[#D0BDF4]/40 text-[#8458B3] border border-[#D0BDF4] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <HeartHandshake className="w-4 h-4 text-[#8458B3]" />
                      <span>{showMentorForm ? 'Cancel Form' : 'Request Mentorship'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {mentorSuccess && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mentorship request sent to {alumni.name}! You will receive an update once reviewed.</span>
            </div>
          )}

          {/* Inline Mentorship Request Form */}
          {showMentorForm && !mentorSuccess && (
            <form
              onSubmit={handleSendMentorship}
              className="mb-4 p-4 rounded-2xl bg-[#E5EAF5]/50 border border-[#D0BDF4] space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#8458B3] uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8458B3]" />
                  Request 1-on-1 Mentorship
                </h4>
                <span className="text-[11px] font-bold text-[#8458B3]">Accepting Mentees</span>
              </div>

              {mentorError && (
                <p className="text-xs text-rose-600 font-medium">{mentorError}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#494D5F] mb-1">Focus Topic / Subject</label>
                <select
                  value={mentorTopic}
                  onChange={(e) => setMentorTopic(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D0BDF4]/60 bg-white text-[#494D5F] focus:outline-none focus:border-[#8458B3]"
                >
                  <option value="Career Guidance & Portfolio Review">Career Guidance & Portfolio Review</option>
                  <option value="Interview Preparation & Mock Coding">Interview Preparation & Mock Coding</option>
                  <option value="Transitioning into Big Tech / AI">Transitioning into Big Tech / AI</option>
                  <option value="Higher Studies & MS Abroad Application">Higher Studies & MS Abroad Application</option>
                  <option value="Startup & Entrepreneurship Mentoring">Startup & Entrepreneurship Mentoring</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#494D5F] mb-1">
                  Introduce yourself and what you'd like guidance on:
                </label>
                <textarea
                  required
                  rows={3}
                  value={mentorMessage}
                  onChange={(e) => setMentorMessage(e.target.value)}
                  placeholder="Hi, I'm currently studying CS and interested in software systems. I would love to learn more about how you navigated..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D0BDF4]/60 bg-white text-[#494D5F] focus:outline-none focus:ring-2 focus:ring-[#8458B3]/20 focus:border-[#8458B3]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMentorForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#494D5F] hover:text-[#8458B3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mentorSending}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#8458B3] to-[#71489d] hover:from-[#71489d] hover:to-[#5d3b82] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8458B3]/25 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{mentorSending ? 'Submitting...' : 'Send Mentorship Request'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Academic Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 px-4 bg-[#E5EAF5]/40 rounded-2xl border border-[#D0BDF4]/40 mb-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5EAF5] flex items-center justify-center text-[#8458B3] border border-[#D0BDF4]/50">
                <GraduationCap className="w-4 h-4 text-[#8458B3]" />
              </div>
              <div>
                <span className="text-[#494D5F]/60 block text-[10px] font-medium">Academic Degree</span>
                <span className="font-bold text-[#494D5F]">{alumni.course}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5EAF5] flex items-center justify-center text-[#8458B3] border border-[#D0BDF4]/50">
                <Building2 className="w-4 h-4 text-[#8458B3]" />
              </div>
              <div>
                <span className="text-[#494D5F]/60 block text-[10px] font-medium">Department</span>
                <span className="font-bold text-[#494D5F]">{alumni.department}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5EAF5] flex items-center justify-center text-[#8458B3] border border-[#D0BDF4]/50">
                <Calendar className="w-4 h-4 text-[#8458B3]" />
              </div>
              <div>
                <span className="text-[#494D5F]/60 block text-[10px] font-medium">Graduation Batch</span>
                <span className="font-bold text-[#494D5F]">Class of {alumni.graduation_year}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5EAF5] flex items-center justify-center text-[#8458B3] border border-[#D0BDF4]/50">
                <Briefcase className="w-4 h-4 text-[#8458B3]" />
              </div>
              <div>
                <span className="text-[#494D5F]/60 block text-[10px] font-medium">Industry Focus</span>
                <span className="font-bold text-[#494D5F]">{alumni.industry}</span>
              </div>
            </div>
          </div>

          {/* Professional Profiles & Portfolio Links */}
          {(alumni.linkedin || alumni.portfolio || alumni.resumeUrl) && (
            <div className="mb-4 p-3 rounded-2xl bg-[#E5EAF5]/30 border border-[#D0BDF4]/40 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-[#494D5F]/70 uppercase tracking-wider block w-full mb-0.5">
                Verified Context & Portfolio Links:
              </span>
              {alumni.linkedin && (
                <a
                  href={alumni.linkedin.startsWith('http') ? alumni.linkedin : `https://${alumni.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/30 hover:bg-[#0A66C2]/20 transition-colors"
                >
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}
              {(alumni.resumeUrl || alumni.portfolio) && (
                <a
                  href={(alumni.resumeUrl || alumni.portfolio)!.startsWith('http') ? (alumni.resumeUrl || alumni.portfolio)! : `https://${alumni.resumeUrl || alumni.portfolio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#8458B3]/10 text-[#8458B3] border border-[#D0BDF4] hover:bg-[#8458B3]/20 transition-colors"
                >
                  <span>Resume / Portfolio Link</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-[#494D5F] uppercase tracking-wider mb-1.5">About</h4>
            <p className="text-xs text-[#494D5F]/80 leading-relaxed">
              {alumni.bio || 'Proud alumnus supporting the next generation of students and innovators.'}
            </p>
          </div>

          {/* Skills tags */}
          {alumni.skills && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-[#494D5F] uppercase tracking-wider mb-2">Technical Skills & Expertise</h4>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(alumni.skills) ? alumni.skills : String(alumni.skills).split(',')).map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]/60"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posted Opportunities */}
          {alumni.postedOpportunities && alumni.postedOpportunities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E5EAF5]">
              <h4 className="text-xs font-bold text-[#494D5F] uppercase tracking-wider mb-2">
                Open Roles Posted by {alumni.name}
              </h4>
              <div className="space-y-2">
                {alumni.postedOpportunities.map((opp: any) => (
                  <div
                    key={opp.id}
                    className="p-3 rounded-2xl border border-[#E5EAF5] bg-[#E5EAF5]/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          opp.type === 'JOB' ? 'bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]' : 'bg-[#A0D2EB]/30 text-[#255b7c] border border-[#A0D2EB]'
                        }`}>
                          {opp.type}
                        </span>
                        <span className="text-xs font-bold text-[#494D5F]">{opp.title}</span>
                      </div>
                      <p className="text-[11px] text-[#494D5F]/70 mt-0.5">
                        {opp.company} • {opp.location} • Deadline: {opp.deadline}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#8458B3] hover:underline flex items-center gap-1 cursor-pointer">
                      View Role <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
