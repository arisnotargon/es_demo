class SyncManager {
  constructor(esClient, mysqlClient) {
    this.esClient = esClient;
    this.mysqlClient = mysqlClient;
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

  // 同步文章-类目关联表
  SyncArticleCategory(type, data) {
    // data中必须有id字段，否则无法操作数据
    if (typeof data.id === "undefined") {
      throw new TypeError("data中缺少id字段");
    }

    // 关联表数据其实是写入主索引，所以即使是删除也只是更新而已，共用一个更新方法
    switch (type) {
      case "insert":
      case "update":
      case "delete":
        this.UpdateArticleCategory(data);
        break;
      default:
        break;
    }
  }

  async UpdateArticleCategory(data) {
    // 数据结构为：{"id":138,"article_id":147,"category_id":159}
    // article_id为文章id，查出该文章id的所有分类名，进行拼接
    console.log("in UpdateArticleCategory", data, typeof data.article_id);
    if (typeof data.article_id !== "number") {
      return;
    }
    let articleId = data.article_id;
    let sql = "select * from article_category where article_id = ?";
    let sqlParams = [articleId];
    let articleIds = [];
    let res = await this.myQuery(sql, sqlParams);
    if (!(res instanceof Array)) {
      return;
    }

    sql = "select * from category where id in(";
    res.forEach((v, k) => {
      articleIds.push(v.category_id);
      sql += "?,";
    });

    let categoryNamesStr = "";
    if (articleIds.length > 0) {
      sql = sql.slice(0, -1) + ")";
      console.log("sql2==>", sql);

      res = await this.myQuery(sql, articleIds);

      if (res instanceof Array) {
        res.forEach((v, k) => {
          if (typeof v.category_name === "string") {
            categoryNamesStr += v.category_name + " ";
          }
        });
      }
    }

    // 把拼接出的结果写入es
    this.esClient
      .update({
        index: "article",
        type: "_doc",
        id: articleId,
        body: {
          doc: {
            category_names_string: categoryNamesStr,
          },
        },
      })
      .then((res) => console.log(JSON.stringify(res)))
      .catch((err) => console.error(err));
  }

  // 封装一个数据库查询，可以同步等待
  myQuery(sql, params) {
    let mysqlClient = this.mysqlClient;
    return new Promise((resolve, reject) => {
      mysqlClient.query(sql, params, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}

module.exports = { SyncManager };
