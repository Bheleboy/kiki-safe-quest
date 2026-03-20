import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare, ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ParentSurvey } from "./ParentSurvey";
import type { Tables } from "@/integrations/supabase/types";

type ChildSurveyData = Tables<"child_surveys">;

interface ChildSurveyReviewProps {
  userId: string;
  childId: string;
  childName: string;
  onDone: () => void;
}

function BoolIcon({ value }: { value: boolean | null }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (value === false) return <XCircle className="w-4 h-4 text-destructive" />;
  return <span className="text-xs text-muted-foreground">—</span>;
}

export function ChildSurveyReview({ userId, childId, childName, onDone }: ChildSurveyReviewProps) {
  const [surveys, setSurveys] = useState<ChildSurveyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<ChildSurveyData | null>(null);
  const [showParentSurvey, setShowParentSurvey] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("child_surveys")
      .select("*")
      .eq("user_id", userId)
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSurveys(data);
        setLoading(false);
      });
  }, [userId, childId]);

  const handleApprove = async (survey: ChildSurveyData, approved: boolean) => {
    setApproving(survey.id);
    await supabase
      .from("child_surveys")
      .update({
        parent_approved: approved,
        parent_approved_at: new Date().toISOString(),
      })
      .eq("id", survey.id);

    setSurveys((prev) =>
      prev.map((s) =>
        s.id === survey.id ? { ...s, parent_approved: approved, parent_approved_at: new Date().toISOString() } : s
      )
    );
    setApproving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showParentSurvey && selectedSurvey) {
    return (
      <ParentSurvey
        userId={userId}
        childId={selectedSurvey.child_id}
        childName={childName}
        streamId={selectedSurvey.stream_id}
        childSurveyId={selectedSurvey.id}
        onComplete={onDone}
        onSkip={onDone}
      />
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="card-kiki text-center py-6 space-y-2">
        <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-body text-sm text-muted-foreground">
          No surveys from {childName} yet. Surveys become available once the course is completed.
        </p>
      </div>
    );
  }

  const labels: Record<string, string> = {
    was_fun: "Enjoyed it",
    was_easy: "Easy to understand",
    videos_helpful: "Videos helpful",
    learned_something: "Learned something",
    would_recommend: "Would recommend",
  };

  const boolKeys = ["was_fun", "was_easy", "videos_helpful", "learned_something", "would_recommend"] as const;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
        {childName}'s Survey Responses
      </h3>

      {surveys.map((survey) => (
        <motion.div
          key={survey.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-kiki space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
              {survey.age_band === "6-9" ? "Ages 6–9" : "Ages 10–13"} Course
            </span>
            <div className="flex items-center gap-2">
              {survey.parent_approved === true && (
                <span className="inline-flex items-center gap-1 text-xs font-display text-success bg-success/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  <ShieldCheck className="w-3 h-3" /> Approved
                </span>
              )}
              {survey.parent_approved === false && (
                <span className="inline-flex items-center gap-1 text-xs font-display text-destructive bg-destructive/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  <ShieldAlert className="w-3 h-3" /> Declined
                </span>
              )}
              <span className="text-xs text-muted-foreground font-body">
                {new Date(survey.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boolKeys.map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm font-body">
                <BoolIcon value={survey[key]} />
                <span className="text-foreground">{labels[key]}</span>
              </div>
            ))}
          </div>

          {survey.favorite_part && (
            <div className="rounded-lg bg-success/5 p-3">
              <p className="text-xs font-display uppercase tracking-wide text-success font-medium mb-1">Favourite Part</p>
              <p className="text-sm font-body text-foreground">{survey.favorite_part}</p>
            </div>
          )}

          {survey.what_to_improve && (
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-xs font-display uppercase tracking-wide text-primary font-medium mb-1">Suggested Improvement</p>
              <p className="text-sm font-body text-foreground">{survey.what_to_improve}</p>
            </div>
          )}

          {survey.parent_approved === null && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleApprove(survey, true)}
                disabled={approving === survey.id}
                className="flex-1 touch-target flex items-center justify-center gap-2 rounded-lg border-2 border-success/30 bg-success/5 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest text-success hover:bg-success/15 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleApprove(survey, false)}
                disabled={approving === survey.id}
                className="flex-1 touch-target flex items-center justify-center gap-2 rounded-lg border-2 border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest text-destructive hover:bg-destructive/15 transition-all disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" /> Decline
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedSurvey(survey);
              setShowParentSurvey(true);
            }}
            className="w-full touch-target btn-copper py-2.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Review & Add Your Feedback
          </button>
        </motion.div>
      ))}
    </div>
  );
}
