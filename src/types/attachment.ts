export type IAttachmentType =
  | 'userAvatar'
  | 'userBanner'
  | 'userAvatarAudit'
  | 'userBannerAudit'
  | 'userHomeBannerAudit'
  | 'forumBanner'
  | 'forumLogo'
  | 'columnAvatar'
  | 'columnBanner'
  | 'homeBigLogo'
  | 'postCover'
  | 'problemImage'
  | 'recommendThreadCover'
  | 'fundAvatar'
  | 'fundBanner'
  | 'scoreIcon'
  | 'bookCover'
  | 'articleCover'
  | 'OAuthAppIcon'
  | 'documentCover'
  | 'authorPhoto';

export type IAttachmentFile = {
  ext: string;
  hash: string;
  size: number;
  height: number;
  width: number;
  name: string;
  duration: number;
  mtime: Date;
};

export type IAttachmentSizeType = 'def' | 'sm' | 'md' | 'lg';

export type IAttachmentImage = {
  type: IAttachmentSizeType;
  name: string;
  height: number;
  width: number;
  quality: number;
  // 裁切时，超出图片区域填充的颜色
  background?: string;
};

export interface IAttachmentData {
  _id: string;
  type: IAttachmentType;
  uid: string;
  path: string;
  toc: Date;
  size: number;
  ext: string;
  name: string;
  hash: string;
  c: string;
  files: {
    [key in IAttachmentSizeType]?: IAttachmentFile;
  };
  disabled: boolean;
}
