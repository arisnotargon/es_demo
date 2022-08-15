/**
 * 更新es的消费者
 */
Redis = require("ioredis");
const { SyncArticle } = require("./article_sync");
const client = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

client.subscribe("maxwell", (e) => {
  console.log("subscribe channel: maxwell");
});

client.on("message", (channel, message) => {
  console.log(`channel: ${channel},message: ${message}`);
  try {
    msgObj = JSON.parse(message);

    // 必须要有这几个字段
    if (
      typeof msgObj.database !== "undefined" &&
      typeof msgObj.table !== "undefined" &&
      typeof msgObj.type !== "undefined" &&
      typeof msgObj.data !== "undefined"
    ) {
      switch (msgObj.table) {
        case "article":
          SyncArticle(msgObj.type, msgObj.data);
          break;
      }
    }
  } catch (err) {
    console.log("json decode failed,maybe heart beat message" + message);
  }
});

client.on("error", (err) => {
  console.log("response err:" + err);
});
