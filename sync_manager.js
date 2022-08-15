class SyncManager {
  constructor(esClient) {
    this.esClient = esClient;
  }

  /**
   * 文章添加或更新时同步至es
   * 只是一个demo，同步的数据比较少，在实际的业务中可以将关联表例如发布者用户名，评论/回复内容也同步到同一个索引中
   * 更新和插入都在此方法中，实际的业务中更新前需要对比db中的updated_at与es中的updated_at的大小，避免重复消费
   * @param {} data
   */
  UpdateArticle(data) {
    this.esClient
      .index({
        index: "article",
        type: "_doc",
        id: data.id,
        body: data,
      })
      .catch((err) => console.error(err));
  }

  DeleteArticle(data) {
    this.esClient
      .delete({
        index: "article",
        type: "_doc",
        id: data.id,
      })
      .catch((err) => console.error(err));
    console.log("in DeleteArticle,data===>>", data);
  }

  SyncArticle(type, data) {
    // data中必须有id字段，否则无法操作数据
    if (typeof data.id === "undefined") {
      throw new TypeError("data中缺少id字段");
    }
    switch (type) {
      case "insert":
      case "update":
        this.UpdateArticle(data);
        break;
      case "delete":
        this.DeleteArticle(data);
        break;

      default:
        break;
    }
  }
}

module.exports = { SyncManager };
