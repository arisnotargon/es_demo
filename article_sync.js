function UpdateArticle(data) {
  console.log("in UpdateArticle::insert,data====>>>>", data);
}

function DeleteArticle(data) {
  console.log("in DeleteArticle,data===>>", data);
}

function SyncArticle(type, data) {
  switch (type) {
    case "insert":
    case "update":
      UpdateArticle(data);
      break;
    case "delete":
      DeleteArticle(data);
      break;

    default:
      break;
  }
}

module.exports = { SyncArticle };
