import {
  IReferenceStatus,
  IReferenceType,
  ReferenceModel,
} from '@/dataModels/ReferencesModel';
import apiFunction from '@/nkcModules/apiFunction';
import mongoose from 'mongoose';

class ReferenceService {
  createReference = async (props: {
    type: IReferenceType;
    title: string;
    authors: (string | mongoose.Schema.Types.ObjectId)[];
    journal: string;
    publisher: string;
    year: number | null;
    volume: string;
    issue: string;
    startPage: number | null;
    endPage: number | null;
    doi: string;
    url: string;
    uid: string;
  }) => {
    const reference = new ReferenceModel({
      ...props,
      status: 'normal',
    });
    await reference.save();
    return reference;
  };

  getReferences = async (props: {
    status: IReferenceStatus;
    uid: string;
    page: number;
    perPage: number;
  }) => {
    const match = { uid: props.uid, status: props.status };
    const count = await ReferenceModel.countDocuments(match);
    const paging = apiFunction.paging(props.page, count, props.perPage);
    const references = await ReferenceModel.find(match)
      .sort({ createAt: -1 })
      .skip(paging.start)
      .limit(props.perPage);
    return {
      references,
      paging,
    };
  };

  deleteReference = async (
    uid: string,
    referenceId: string | mongoose.Schema.Types.ObjectId,
  ) => {
    await ReferenceModel.updateOne(
      {
        uid: uid,
        _id: referenceId,
      },
      {
        $set: {
          status: 'deleted',
        },
      },
    );
  };

  restoreReference = async (
    uid: string,
    referenceId: string | mongoose.Schema.Types.ObjectId,
  ) => {
    await ReferenceModel.updateOne(
      {
        uid: uid,
        _id: referenceId,
      },
      {
        $set: {
          status: 'normal',
        },
      },
    );
  };
}

export const referenceService = new ReferenceService();
