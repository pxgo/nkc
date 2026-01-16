import { formCheckerService } from '@/services/checker/formChecker.service';
import { ThrowCommonError } from '@/nkcModules/error';
import UserModel from '@/dataModels/UserModel';

class AuthorCheckerService {
  checkAuthorInfo = async (authorInfo: {
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
  }) => {
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
    } = authorInfo;
    formCheckerService.checkString(familyName, {
      name: '姓氏',
      minLength: 1,
      maxLength: 100,
    });
    formCheckerService.checkString(givenName, {
      name: '名字',
      minLength: 1,
      maxLength: 100,
    });
    formCheckerService.checkString(introduction, {
      name: '介绍',
      minLength: 0,
      maxLength: 1000,
    });
    if (kcid) {
      const count = await UserModel.countDocuments({ uid: kcid });
      if (count === 0) {
        ThrowCommonError(400, 'KCID不存在');
      }
    }
    if (orcid) {
      formCheckerService.checkORCIDNumberFormat(orcid);
    }
    if (agencyDOI) {
      formCheckerService.checkDOINumberFormat(agencyDOI);
    }
    formCheckerService.checkString(agencyName, {
      name: '机构名称',
      minLength: 0,
      maxLength: 200,
    });
    formCheckerService.checkString(agencyAddress, {
      name: '机构地址',
      minLength: 0,
      maxLength: 300,
    });
    formCheckerService.checkString(email, {
      name: '电子邮箱',
      minLength: 1,
      maxLength: 100,
    });
    formCheckerService.checkEmailFormat(email);
    if (tel) {
      formCheckerService.checkTelephoneNumberFormat(tel);
    }
    if (address) {
      formCheckerService.checkString(address, {
        name: '地址',
        minLength: 0,
        maxLength: 300,
      });
    }
    if (postalCode) {
      formCheckerService.checkPostalCodeFormat(postalCode);
    }
  };
}

export const authorCheckerService = new AuthorCheckerService();
