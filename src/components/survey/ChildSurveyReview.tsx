import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ParentSurvey } from "./ParentSurvey";

interface ChildSurveyData {
  id: string;
  child_id: string;
  stream_id: string;
  age_band: string;
  was_fun: boolean | null;
  was_easy: boolean | null;
  videos_helpful: boolean | null;
  learned_something: boolean | null;
  would_recommend: boolean | null;
  favorite_part: string | null;
  what_to_improve: string | null;
  created_at: string;
}

interface ChildSurveyReviewProps {
  userId: string;
  childName: string;
  onDone: () => void;
}

function BoolIcon({ value }: { value: boolean | null }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (value === false) return <XCircle className="w-4 h-4 text-destructive" />;
  return <span className="text-xs text-muted-foreground">—</span>;
}

export function ChildSurveyReview({ userId, childName, onDone }: ChildSurveyReviewProps) {
  const [surveys, setSurveys] = useState<ChildSurveyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<ChildSurveyData | null>(null);
  const [showParentSurvey, setShowParentSurvey] = useState(false);

  useEffect(() => {
    supabase
      .from("child_surveys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSurveys(data as unknown as ChildSurveyData[]);
        setLoading(false);
      });
  }, [userId]);

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
        <p className="font-body text-sm text-muted-foreground">No child surveys to review yet.</p>
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

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
        Child Survey Responses
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
            <span className="text-xs text-muted-foreground font-body">
              {new Date(survey.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(labels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm font-body">
                <BoolIcon value={(survey as any)[key]} />
                <span className="text-foreground">{label}</span>
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
