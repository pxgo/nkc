const mongoose = require('../../settings/database');
const { AuthorModel } = require('../../dataModels/AuthorModel');
class AuthorUpdaterService {
  async updateAuthorInfo(
    id: string,
    authorInfo: {
      familyName: string;
      givenName: string;
      introduction: string;
      kcid: string;
      orcid: string;
      agencyName: string;
      agencyAddress: string;
      agencyDOI: string;
      email: string;
      tel: string;
      address: string;
      postalCode: string;
      photo: string;
    },
  ) {
    const {
      familyName,
      givenName,
      introduction,
      kcid,
      orcid,
      agencyName,
      agencyAddress,
      agencyDOI,
      email,
      tel,
      address,
      postalCode,
      photo,
    } = authorInfo;
    await AuthorModel.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          familyName,
          givenName,
          introduction,
          kcid,
          orcid,
          agencyName,
          agencyAddress,
          agencyDOI,
          email,
          tel,
          address,
          postalCode,
          photo,
        },
      },
    );
  }

  async deleteAuthorById(uid: string, id: string) {
    await AuthorModel.updateOne(
      { uid, _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'deleted',
        },
      },
    );
  }

  async restoreAuthorById(uid: string, id: string) {
    await AuthorModel.updateOne(
      { uid, _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'normal',
        },
      },
    );
  }
}

export const authorUpdaterService = new AuthorUpdaterService();
