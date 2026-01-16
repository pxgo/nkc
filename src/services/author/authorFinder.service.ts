import { AuthorModel } from '@/dataModels/AuthorModel';
class AuthorFinderService {
  getAuthorsByUserId = async (userId: string) => {
    return await AuthorModel.find({ uid: userId }).sort({ toc: -1 }).lean();
  };
}

export const authorFinderService = new AuthorFinderService();
