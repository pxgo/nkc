import mongoose from '@/settings/database';
import { CustomModel } from '@/types/mongo';
import { Document, Types } from 'mongoose';

export type IReferenceType = 'journal' | 'book' | 'thesis' | 'website';
export type IReferenceStatus = 'normal' | 'deleted';
export interface IReferenceData extends Document {
  type: IReferenceType;
  title: string;
  authors: string[];
  journal: string;
  publisher: string;
  year: string | null;
  volume: string;
  issue: string;
  startPage: number | null;
  endPage: number | null;
  doi: string;
  url: string;
  uid: string;
  createdAt: Date;
  updatedAt: Date;
  status: IReferenceStatus;
}

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['journal', 'book', 'thesis', 'website'],
      required: true,
      index: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: [String],
      default: [],
      index: 1,
    },
    journal: { type: String, trim: true },
    publisher: { type: String, trim: true },
    year: { type: Number, default: null },
    volume: { type: String, trim: true },
    issue: { type: String, trim: true },
    startPage: { type: Number, default: null },
    endPage: { type: Number, default: null },
    doi: {
      type: String,
      trim: true,
      default: '',
      index: 1,
    },
    url: { type: String, trim: true, default: '' },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    status: {
      type: String,
      required: true,
      index: 1,
      enum: ['normal', 'deleted'],
    },
  },
  { timestamps: true },
);

export const ReferenceModel = mongoose.model<
  IReferenceData,
  CustomModel<IReferenceData>
>('references', schema);
