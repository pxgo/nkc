const AuthorModel = require('../../dataModels/AuthorModel');
class AuthorCreatorService {
  createAuthor = async (uid, authorInfo) => {
    const count = await AuthorModel.countDocuments({ uid });
    if (count >= 20) {
      throw new Error('每个用户最多只能创建20个作者信息');
    }
    const {
      familyName,
      givenName,
      introduction,
      kcid,
      orcid,
      agencyName,
      agencyAddress,
      agencyDOI,
      contact,
      email,
      tel,
      address,
      postalCode,
    } = authorInfo;
    const author = new AuthorModel({
      uid,
      toc: new Date(),
      familyName,
      givenName,
      introduction,
      kcid,
      orcid,
      agencyName,
      agencyAddress,
      agencyDOI,
      contact,
      email,
      tel,
      address,
      postalCode,
    });
    await author.save();
    return author;
  };
}

module.exports = {
  authorCreatorService: new AuthorCreatorService(),
};
