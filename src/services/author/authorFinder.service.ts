import { AuthorModel, IAuthorStatus } from '@/dataModels/AuthorModel';
class AuthorFinderService {
  getAuthorsByUserId = async (userId: string, status: IAuthorStatus) => {
    return await AuthorModel.find({ uid: userId, status })
      .sort({ toc: -1 })
      .lean();
  };
}

export const authorFinderService = new AuthorFinderService();
