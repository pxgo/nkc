import mongoose from '@/settings/database';
import { CustomModel } from '@/types/mongo';
import { Document } from 'mongoose';

export type IAuthorStatus = 'normal' | 'deleted';

export interface IAuthorData extends Document {
  _id: typeof mongoose.Types.ObjectId;
  toc: Date;
  uid: string;
  familyName: string;
  givenName: string;
  instrodution: string;
  photo: string;
  orcid: string;
  kcid: string;
  email: string;
  tel: string;
  postalCode: string;
  address: string;
  agencyName: string;
  agencyDOI: string;
  agencyAddress: string;
  status: IAuthorStatus;
}

const schema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['normal', 'deleted'],
      default: 'normal',
      required: true,
      index: 1,
    },
    toc: {
      type: Date,
      required: true,
      index: 1,
    },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    familyName: {
      type: String,
      required: true,
    },
    givenName: {
      type: String,
      required: true,
    },
    introduction: {
      type: String,
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    orcid: {
      type: String,
      default: '',
    },
    kcid: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    tel: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    // 所属机构名称
    agencyName: {
      type: String,
      default: '',
    },
    // 所属机构 DOI 号
    agencyDOI: {
      type: String,
      default: '',
    },
    // 所属机构地址
    agencyAddress: {
      type: String,
      default: '',
    },
  },
  {
    collection: 'authors',
  },
);

export const AuthorModel = mongoose.model<
  IAuthorData,
  CustomModel<IAuthorData>
>('authors', schema);
