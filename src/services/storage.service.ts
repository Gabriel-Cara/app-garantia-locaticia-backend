import fs from "node:fs";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

type UploadInput = {
  buffer: Buffer;
  key: string;
  fileName: string;
  mimeType: string;
};

type UploadedFile = {
  storageDriver: "local" | "r2" | "s3";
  storageBucket?: string;
  storageKey: string;
  filePath?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export class StorageService {
  private s3Client?: S3Client;

  constructor() {
    if (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") {
      this.s3Client = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID!,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
        },
      });
    }
  }

  async upload(input: UploadInput): Promise<UploadedFile> {
    if (env.STORAGE_DRIVER === "local") {
      fs.mkdirSync(env.CONTRACT_OUTPUT_DIR, { recursive: true });

      const outputDir = path.resolve(env.CONTRACT_OUTPUT_DIR);
      const filePath = path.join(outputDir, input.fileName);

      fs.writeFileSync(filePath, input.buffer);

      return {
        storageDriver: "local",
        storageKey: filePath,
        filePath,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
      };
    }

    if (!this.s3Client) {
      throw new Error("S3 client não configurado");
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    return {
      storageDriver: env.STORAGE_DRIVER,
      storageBucket: env.S3_BUCKET,
      storageKey: input.key,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    };
  }

  async getSignedDownloadUrl(params: {
    key: string;
    fileName?: string | null;
    expiresInSeconds?: number;
  }) {
    if (!this.s3Client) {
      throw new Error("S3 client não configurado");
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: params.key,
      ResponseContentDisposition: params.fileName
        ? `attachment; filename="${params.fileName}"`
        : undefined,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresInSeconds ?? 300,
    });
  }
}
