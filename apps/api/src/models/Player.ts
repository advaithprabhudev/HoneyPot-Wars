import { Schema, model } from 'mongoose';

const playerSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true },
    bestScore: { type: Number, default: 0 },
    novelSlipsAchieved: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PlayerModel = model('Player', playerSchema);
