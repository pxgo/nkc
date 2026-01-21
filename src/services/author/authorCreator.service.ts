import { AuthorModel, IAuthorStatus } from '@/dataModels/AuthorModel';
class AuthorCreatorService {
  createAuthor = async (
    uid: string,
    authorInfo: {
      familyName: string;
      givenName: string;
      introduction: string;
      kcid: string;
      orcid: string;
      agencyName: string;
      agencyAddress: string;
      agencyDOI: string;
      contact: string;
      email: string;
      tel: string;
      address: string;
      postalCode: string;
      photo: string;
      status?: IAuthorStatus;
    },
  ) => {
    const count = await AuthorModel.countDocuments({ uid });
    if (count >= 500) {
      throw new Error('每个用户最多只能创建500个作者信息');
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
      photo,
      status = 'normal',
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
      photo,
      status,
    });
    await author.save();
    return author;
  };
}

export const authorCreatorService = new AuthorCreatorService();
