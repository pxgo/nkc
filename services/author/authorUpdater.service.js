const mongoose = require('../../settings/database');
const AuthorModel = require('../../dataModels/AuthorModel');
class AuthorUpdaterService {
  async updateAuthorInfo(id, authorInfo) {
    const {
      familyName,
      givenName,
      kcid,
      ocrid,
      agencyName,
      agencyAddress,
      agencyDOI,
      contact,
      email,
      tel,
      address,
      postalCode,
    } = authorInfo;
    await AuthorModel.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          familyName,
          givenName,
          kcid,
          ocrid,
          agencyName,
          agencyAddress,
          agencyDOI,
          contact,
          email,
          tel,
          address,
          postalCode,
        },
      },
    );
  }

  async deleteAuthorById(uid, id) {
    await AuthorModel.deleteOne({ uid, _id: new mongoose.Types.ObjectId(id) });
  }
}

module.exports = {
  authorUpdaterService: new AuthorUpdaterService(),
};
