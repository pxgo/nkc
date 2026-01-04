const { XMLBuilder } = require('fast-xml-parser');
class DOIXMLCreatorService {
  jsonToCrossrefXml(data) {
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      suppressEmptyNode: true,
      declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
    });

    const xmlObj = {
      doi_batch: {
        // 1. 声明所有必要的命名空间
        '@_version': '5.3.1',
        '@_xmlns': 'http://www.crossref.org/schema/5.3.1',
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xmlns:fr': 'http://www.crossref.org/fundref.xsd',
        '@_xmlns:ai': 'http://www.crossref.org/AccessIndicators.xsd',
        '@_xmlns:jats': 'http://www.ncbi.nlm.nih.gov/JATS1',
        '@_xsi:schemaLocation':
          'http://www.crossref.org/schema/5.3.1 http://data.crossref.org/schemas/crossref5.3.1.xsd',

        head: {
          doi_batch_id: data.doiBatchId,
          timestamp: Date.now(),
          depositor: {
            depositor_name: data.publisher,
            email_address: data.email,
          },
          registrant: data.publisher,
        },

        body: {
          posted_content: {
            '@_type': 'other',
            // 必须遵守顺序：contributors -> titles -> posted_date -> abstract -> program -> doi_data -> citation_list

            // A. 作者信息 (增加 ORCID 支持)
            contributors: {
              person_name: data.authors.map((auth, index) => ({
                '@_sequence': index === 0 ? 'first' : 'additional',
                '@_contributor_role': 'author',
                given_name: auth.given,
                surname: auth.family,
                ...(auth.orcid && { ORCID: auth.orcid }),
              })),
            },

            // B. 标题
            titles: { title: data.title[0] },

            // C. 发布日期
            posted_date: {
              month: data.published_date[1],
              day: data.published_date[2],
              year: data.published_date[0],
            },

            // D. 摘要 (必须使用 jats:p 标签)
            ...(data.abstract && {
              'jats:abstract': {
                'jats:p': data.abstract,
              },
            }),

            // E. 资助信息与许可协议 (program 节点)
            // 资助信息 (FundRef)
            ...(data.funding && {
              'fr:program': {
                '@_name': 'fundref',
                'fr:assertion': data.funding.map((f) => ({
                  '@_name': 'fundgroup',
                  'fr:assertion': [
                    { '@_name': 'funder_name', '#text': f.funder_name },
                    { '@_name': 'funder_identifier', '#text': f.funder_id },
                    { '@_name': 'award_number', '#text': f.award_number },
                  ],
                })),
              },
            }),

            // 访问许可 (Access Indicators)
            ...(data.license_url && {
              'ai:program': {
                '@_name': 'AccessIndicators',
                'ai:license_ref': {
                  '@_applies_to': 'vor',
                  '#text': data.license_url,
                },
              },
            }),

            // F. DOI 与 资源链接
            doi_data: {
              doi: data.doi,
              resource: data.url,
            },

            // G. 参考文献列表
            ...(data.references && {
              citation_list: {
                citation: data.references.map((ref, index) => ({
                  '@_key': `ref${index + 1}`,
                  ...(ref.doi
                    ? { doi: ref.doi }
                    : { unstructured_citation: ref.unstructured }),
                })),
              },
            }),
          },
        },
      },
    };

    return builder.build(xmlObj);
  }
}

module.exports = {
  doiXMLCreatorService: new DOIXMLCreatorService(),
};
