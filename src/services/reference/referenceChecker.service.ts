import { formCheckerService } from '@/services/checker/formChecker.service';
import { ThrowCommonError } from '@/nkcModules/error';
import { IReferenceType } from '@/dataModels/ReferencesModel';

type ICheckingReference = {
  type: IReferenceType;
  title: string;
  authors: string[];
  journal: string;
  publisher: string;
  year: number | null;
  volume: string;
  issue: string;
  startPage: number | null;
  endPage: number | null;
  doi: string;
  url: string;
};

class ReferenceCheckerService {
  checkReference = (r: ICheckingReference) => {
    switch (r.type) {
      case 'journal': {
        this.checkJournal(r);
        break;
      }
      case 'book': {
        this.checkBook(r);
        break;
      }
      case 'thesis': {
        this.checkThesis(r);
        break;
      }
      case 'website': {
        this.checkWebsite(r);
        break;
      }
      default: {
        ThrowCommonError(400, '类型错误');
      }
    }
  };

  private checkTitle = (title: string) => {
    formCheckerService.checkString(title, {
      name: '标题',
      minLength: 1,
      maxLength: 1000,
    });
  };

  private checkAuthors = (authors: string[]) => {
    if (authors.length === 0) {
      ThrowCommonError(400, '作者不能为空');
    }
    for (const author of authors) {
      formCheckerService.checkString(author, {
        minLength: 1,
        maxLength: 200,
        name: '作者名称',
      });
    }
  };

  private checkYear = (year: number | null) => {
    if (year === null) {
      ThrowCommonError(400, '年份不能为空');
    }
    formCheckerService.checkNumber(year, {
      min: 1000,
      max: 9999,
      name: '年份',
    });
  };

  // 检测期刊文章参考文献
  private checkJournal = (r: ICheckingReference) => {
    this.checkTitle(r.title);
    this.checkAuthors(r.authors);
    formCheckerService.checkString(r.journal, {
      name: '期刊名',
      minLength: 1,
      maxLength: 500,
    });
    formCheckerService.checkString(r.volume, {
      name: '期刊卷号',
      minLength: 1,
      maxLength: 100,
    });
    formCheckerService.checkString(r.issue, {
      name: '期刊期号',
      minLength: 0,
      maxLength: 100,
    });
    this.checkYear(r.year);
    formCheckerService.checkNumber(r.startPage || 0, {
      min: 1,
      name: '起始页码',
    });
    formCheckerService.checkNumber(r.endPage || 0, {
      min: r.startPage || 1,
      name: '结束页码',
    });
    if (r.doi) {
      formCheckerService.checkDOIFormat(r.doi);
    }
    if (r.url) {
      formCheckerService.checkString(r.url, {
        name: '链接',
        minLength: 1,
        maxLength: 2000,
      });
    }
  };

  private checkBook = (r: ICheckingReference) => {
    this.checkTitle(r.title);
    this.checkAuthors(r.authors);
    formCheckerService.checkString(r.publisher, {
      name: '出版社',
      minLength: 1,
      maxLength: 500,
    });
    this.checkYear(r.year);
    if (r.doi) {
      formCheckerService.checkDOIFormat(r.doi);
    }
    if (r.url) {
      formCheckerService.checkString(r.url, {
        name: '链接',
        minLength: 1,
        maxLength: 2000,
      });
    }
  };

  private checkThesis = (r: ICheckingReference) => {
    this.checkTitle(r.title);
    this.checkAuthors(r.authors);
    formCheckerService.checkString(r.publisher, {
      name: '学校',
      minLength: 1,
      maxLength: 500,
    });
    this.checkYear(r.year);
    if (r.doi) {
      formCheckerService.checkDOIFormat(r.doi);
    }
    if (r.url) {
      formCheckerService.checkString(r.url, {
        name: '链接',
        minLength: 1,
        maxLength: 2000,
      });
    }
  };

  private checkWebsite = (r: ICheckingReference) => {
    this.checkTitle(r.title);
    this.checkAuthors(r.authors);
    if (r.year !== null) {
      this.checkYear(r.year);
    }
    if (r.doi) {
      formCheckerService.checkDOIFormat(r.doi);
    }
    formCheckerService.checkString(r.url, {
      name: '链接',
      minLength: 1,
      maxLength: 2000,
    });
  };
}

export const referenceCheckerService = new ReferenceCheckerService();
