/* 
  作者信息
  author 数据结构：
  {
    familyName: '',
    givenName: '',
    kcid: '',
    orcid: '',
    agencyName: '',
    agencyAddress: '',
    agencyDOI: '',
    contact: false,
    email: '',
    tel: '',
    address: '',
    postalCode: '',
  }

*/

const getDefaultMetadata = () => ({
  uniqueId: `metadata-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  lang: 'zh_CN',
  authors: [],
  abstract: '',
  keywords: [],
  title: '',
  description: '',
  content: '',
  contact: false,
});

export class EditorStore {
  state = window.Vue.observable({
    // 元信息
    metadata: [{ ...getDefaultMetadata() }],
    // 参考文献
    references: [],
  });

  setReferences = (references) => {
    this.state.references = [...references];
  };

  addReferences = (references) => {
    this.state.references = [...this.state.references, ...references];
  };

  removeReferenceAt = (index) => {
    this.state.references.splice(index, 1);
    this.state.references = [...this.state.references];
  };

  // 设置作者信息列表
  setAuthors = (metadataIndex, authors) => {
    this.state.metadata[metadataIndex].authors = [...authors];
  };

  // 添加多个作者信息
  addAuthors = (metadataIndex, authors) => {
    this.state.metadata[metadataIndex].authors = [
      ...this.state.metadata[metadataIndex].authors,
      ...authors,
    ];
  };

  // 删除指定位置的作者信息
  removeAuthorAt = (metadataIndex, authorIndex) => {
    this.state.metadata[metadataIndex].authors.splice(authorIndex, 1);
  };

  // 切换指定作者的通讯作者标记
  toggleAuthorContact = (metadataIndex, authorIndex) => {
    const authors = this.state.metadata[metadataIndex].authors;
    if (!authors || !authors[authorIndex]) {
      return;
    }
    authors[authorIndex].contact = !authors[authorIndex].contact;
    this.setAuthors(metadataIndex, authors);
  };

  // type: 'up' | 'down'
  // 上移或下移作者信息
  moveAuthor = (metadataIndex, authorIndex, type) => {
    let authors = this.state.metadata[metadataIndex].authors;
    let otherIndex;
    if (type === 'up') {
      if (authorIndex === 0) {
        return;
      }
      otherIndex = authorIndex - 1;
    } else {
      if (authorIndex + 1 === authors.length) {
        return;
      }
      otherIndex = authorIndex + 1;
    }
    let info = authors[authorIndex];
    authors[authorIndex] = authors[otherIndex];
    authors[otherIndex] = info;
    this.setAuthors(metadataIndex, authors);
  };

  setAbstract = (metadataIndex, abstract) => {
    this.state.metadata[metadataIndex].abstract = abstract;
  };

  setKeywords = (metadataIndex, keywords) => {
    this.state.metadata[metadataIndex].keywords = keywords;
  };

  setTitle = (metadataIndex, title) => {
    this.state.metadata[metadataIndex].title = title;
  };

  setDescription = (metadataIndex, description) => {
    this.state.metadata[metadataIndex].description = description;
  };

  // 添加一组元信息
  addMetadata = () => {
    this.state.metadata.push({
      ...getDefaultMetadata(),
    });
  };
  // 删除指定位置的元信息
  removeMetadataAt = (index) => {
    this.state.metadata.splice(index, 1);
  };
  // 移动元信息位置
  moveMetadata = (index, type) => {
    let otherIndex;
    if (type === 'up') {
      if (index === 0) {
        return;
      }
      otherIndex = index - 1;
    } else {
      if (index + 1 === this.state.metadata.length) {
        return;
      }
      otherIndex = index + 1;
    }
    const info = this.state.metadata[index];
    this.state.metadata[index] = this.state.metadata[otherIndex];
    this.state.metadata[otherIndex] = info;
    this.state.metadata = [...this.state.metadata];
  };
}

export const editorStore = new EditorStore();
