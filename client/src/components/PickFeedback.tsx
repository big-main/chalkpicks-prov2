import { useState } from "react";
import { Star, MessageCircle, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PickFeedbackProps {
  pickId: number;
  isAuthenticated: boolean;
}

export default function PickFeedback({ pickId, isAuthenticated }: PickFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: feedbackData, refetch: refetchFeedback } = trpc.feedback.getPickFeedback.useQuery({ pickId });
  const { data: userFeedback } = trpc.feedback.getUserFeedback.useQuery(
    { pickId },
    { enabled: isAuthenticated }
  );

  const submitFeedback = trpc.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted! Thanks for helping us improve.");
      setRating(0);
      setComment("");
      setShowForm(false);
      refetchFeedback();
    },
    onError: (err) => toast.error(err.message || "Failed to submit feedback"),
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit feedback");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    submitFeedback.mutate({
      pickId,
      rating,
      comment: comment || undefined,
      wasHelpful: rating >= 4,
    });
  };

  const stats = feedbackData?.stats;
  const avgRating = stats?.avgRating || 0;

  return (
    <div className="space-y-4">
      {/* Feedback Stats */}
      {stats && stats.totalFeedback > 0 && (
        <Card className="bg-secondary/50 border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-gold text-gold" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {avgRating.toFixed(1)} <span className="text-muted-foreground text-xs">/ 5.0</span>
                </div>
                <div className="text-xs text-muted-foreground">{stats.totalFeedback} ratings</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-green-400">{stats.positiveCount} positive</div>
              <div className="text-red-400">{stats.negativeCount} negative</div>
            </div>
          </div>
        </Card>
      )}

      {/* User's Existing Feedback */}
      {userFeedback && (
        <Card className="bg-accent/10 border-accent/30 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < userFeedback.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Your rating</span>
              </div>
              {userFeedback.comment && (
                <p className="text-sm text-foreground">{userFeedback.comment}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Feedback Form */}
      {!userFeedback && (
        <>
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowForm(true)}
              disabled={!isAuthenticated}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isAuthenticated ? "Rate this pick" : "Sign in to rate"}
            </Button>
          ) : (
            <Card className="bg-secondary/50 border-border/50 p-4 space-y-3">
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? "fill-gold text-gold"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                <Textarea
                  placeholder="What did you think about this pick? Any insights?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitFeedback.isPending || rating === 0}
                  className="flex-1"
                >
                  {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setRating(0);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Recent Feedback */}
      {feedbackData?.feedback && feedbackData.feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Recent Feedback</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {feedbackData.feedback.slice(0, 3).map((fb) => (
              <Card key={fb.id} className="bg-secondary/30 border-border/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < fb.rating ? "fill-gold text-gold" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          fb.sentiment === "positive"
                            ? "bg-green-400/20 text-green-400"
                            : fb.sentiment === "negative"
                              ? "bg-red-400/20 text-red-400"
                              : "bg-gray-400/20 text-gray-400"
                        }`}
                      >
                        {fb.sentiment}
                      </span>
                    </div>
                    {fb.comment && <p className="text-xs text-foreground/80 line-clamp-2">{fb.comment}</p>}
                  </div>
                  {fb.wasHelpful && <ThumbsUp className="w-3 h-3 text-green-400 flex-shrink-0 mt-1" />}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
