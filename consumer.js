/**
 * 更新es的消费者
 */
const Redis = require("ioredis");
const { SyncManager } = require("./sync_manager");
const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

// 把es客户端定义到最顶层，传参到函数
const es = require("elasticsearch");
const esClient = es.Client({ host: "http://localhost:9201" });

const syncManager = new SyncManager(esClient);

redisClient.subscribe("maxwell", (e) => {
  console.log("subscribe channel: maxwell");
});

redisClient.on("message", (channel, message) => {
  console.log(`channel: ${channel},message: ${message}`);
  try {
    msgObj = JSON.parse(message);
  } catch (err) {
    console.log("json decode failed,maybe heart beat message" + message, err);
    return;
  }

  // 必须要有这几个字段
  if (
    typeof msgObj.database !== "undefined" &&
    typeof msgObj.table !== "undefined" &&
    typeof msgObj.type !== "undefined" &&
    typeof msgObj.data !== "undefined"
  ) {
    switch (msgObj.table) {
      case "article":
        syncManager.SyncArticle(msgObj.type, msgObj.data);
        break;
    }
  } else {
    return;
  }
});

redisClient.on("error", (err) => {
  console.log("response err:" + err);
});
