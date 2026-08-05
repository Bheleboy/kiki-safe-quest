/**
 * Data layer for the future "Module Complete — Armour Unlocked" reward video.
 *
 * No Remotion reward composition exists yet. When that template is built, it
 * should consume `ArmourRewardVideoProps` produced by `getArmourRewardProps()`
 * so the unlocked piece name / verse / description are always resolved
 * dynamically from src/data/armourData.ts via getArmourPiecesForModule() —
 * never hardcoded per video.
 *
 * Example:
 *   const props = getArmourRewardProps("6-9", "young-m1");
 *   // props.pieces = [Belt of Truth, Shield of Faith] (names, verses, descriptions)
 */

import {
  getArmourPiecesForModule,
  ONLINE_SAFETY_PIECES,
  type ArmourPiece,
} from "../../src/data/armourData";

export interface ArmourRewardPiece {
  id: string;
  name: string;
  description: string;
  verse: string;
}

export interface ArmourRewardVideoProps {
  streamId: string;
  moduleId: string;
  /** Pieces unlocked by completing this module (1-2 depending on stream/module). */
  pieces: ArmourRewardPiece[];
  /** Total pieces in the Armour of God set (for "3 of 6" style captions). */
  totalPieces: number;
  /** Indices of the unlocked pieces within the full set (for progress-row highlights). */
  pieceIndices: number[];
  /** Reward clip length; the template should time its beats to this. */
  durationSeconds: number;
}

const toRewardPiece = ({ id, name, description, verse }: ArmourPiece): ArmourRewardPiece => ({
  id,
  name,
  description,
  verse,
});

/**
 * Resolve everything the reward video template needs for a completed module.
 * Returns an empty `pieces` array for modules that award nothing, so the
 * template can safely fall back to a generic "Module Complete" card.
 */
export function getArmourRewardProps(
  streamId: string,
  moduleId: string,
  durationSeconds = 8
): ArmourRewardVideoProps {
  const pieces = getArmourPiecesForModule(streamId, moduleId).map(toRewardPiece);
  return {
    streamId,
    moduleId,
    pieces,
    totalPieces: ONLINE_SAFETY_PIECES.length,
    pieceIndices: pieces.map((p) => ONLINE_SAFETY_PIECES.findIndex((ap) => ap.id === p.id)),
    durationSeconds,
  };
}
