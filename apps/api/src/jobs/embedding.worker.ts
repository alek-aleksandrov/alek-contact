import { parentPort } from "node:worker_threads";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { EMBEDDING_MODEL } from "./embeddings";
import type { WorkerReply } from "./worker-embeddings";

// One model load, on this thread only. All ONNX inference happens here.
const model = new HuggingFaceTransformersEmbeddings({ model: EMBEDDING_MODEL });

type Request = {
  id: number;
  method: "embedDocuments" | "embedQuery";
  payload: string | string[];
};

parentPort?.on("message", async (msg: Request) => {
  let reply: WorkerReply;
  try {
    const vectors =
      msg.method === "embedDocuments"
        ? await model.embedDocuments(msg.payload as string[])
        : [await model.embedQuery(msg.payload as string)];
    reply = { id: msg.id, ok: true, vectors };
  } catch (err) {
    reply = { id: msg.id, ok: false, error: (err as Error).message };
  }
  parentPort!.postMessage(reply);
});
