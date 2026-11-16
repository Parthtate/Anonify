import mongoose, { Schema } from 'mongoose';

export interface RateLimitDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<RateLimitDoc>(
  {
    _id: { type: String },
    count: { type: Number, required: true, default: 0 },
    // TTL index: Mongo drops the bucket once its window has passed, so nothing accumulates.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { _id: false, versionKey: false }
);

const RateLimitModel =
  (mongoose.models.RateLimit as mongoose.Model<RateLimitDoc>) ||
  mongoose.model<RateLimitDoc>('RateLimit', RateLimitSchema);

export default RateLimitModel;
