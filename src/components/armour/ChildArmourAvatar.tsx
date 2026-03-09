import { useArmour } from "@/hooks/useArmour";
import { KikiWarriorAvatar } from "./KikiWarriorAvatar";

interface ChildArmourAvatarProps {
  userId: string;
  childId: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ChildArmourAvatar({
  userId,
  childId,
  size = "sm",
  showLabel = false,
  className = "",
}: ChildArmourAvatarProps) {
  const { earnedPieces, loading } = useArmour(userId, childId);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-24 h-32">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <KikiWarriorAvatar
      earnedPieces={earnedPieces}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}
