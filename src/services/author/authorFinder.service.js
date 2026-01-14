const AuthorModel = require('../../dataModels/AuthorModel');
class AuthorFinderService {
  getAuthorsByUserId = async (userId) => {
    return await AuthorModel.find({ uid: userId }).sort({ toc: -1 }).lean();
  };
}

module.exports = {
  authorFinderService: new AuthorFinderService(),
};
