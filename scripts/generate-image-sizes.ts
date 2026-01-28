/**
 * Script to generate pre-sized images from S3 source bucket to destination bucket
 * Uses Sharp for image processing and AWS SDK for S3 operations
 *
 * Usage:
 *   npx ts-node scripts/generate-image-sizes.ts
 *
 * Environment variables required:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION (default: us-west-1)
 *   SOURCE_BUCKET (bucket with original images)
 *   DEST_BUCKET (default: stock-images-processed)
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Readable } from "stream";

// Configuration
const CONFIG = {
  sourceBucket: process.env.SOURCE_BUCKET || "",
  destBucket: process.env.DEST_BUCKET || "stock-images-processed",
  region: process.env.AWS_REGION || "us-west-1",
  sizes: {
    hero: { width: 1920, height: 1280 },
    standard: { width: 1000, height: null }, // null height = maintain aspect ratio
  },
  quality: 85,
  concurrency: 5, // Number of images to process in parallel
};

// Initialize S3 client
const s3Client = new S3Client({
  region: CONFIG.region,
});

interface ImageVariant {
  key: string;
  format: "jpg" | "webp";
  size: "hero" | "standard";
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function checkIfExists(bucket: string, key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

async function processImage(
  sourceKey: string,
  skipExisting: boolean = true
): Promise<{ processed: number; skipped: number }> {
  let processed = 0;
  let skipped = 0;

  // Extract filename without extension
  const filename = sourceKey.split("/").pop()?.replace(/\.[^/.]+$/, "") || "";
  if (!filename) {
    console.warn(`  Skipping invalid key: ${sourceKey}`);
    return { processed: 0, skipped: 1 };
  }

  // Define all variants to generate
  const variants: ImageVariant[] = [
    { key: `hero/${filename}.jpg`, format: "jpg", size: "hero" },
    { key: `hero/${filename}.webp`, format: "webp", size: "hero" },
    { key: `standard/${filename}.jpg`, format: "jpg", size: "standard" },
    { key: `standard/${filename}.webp`, format: "webp", size: "standard" },
  ];

  // Check which variants need to be generated
  const variantsToProcess: ImageVariant[] = [];
  for (const variant of variants) {
    if (skipExisting) {
      const exists = await checkIfExists(CONFIG.destBucket, variant.key);
      if (exists) {
        skipped++;
        continue;
      }
    }
    variantsToProcess.push(variant);
  }

  if (variantsToProcess.length === 0) {
    return { processed, skipped };
  }

  // Fetch source image
  const getCommand = new GetObjectCommand({
    Bucket: CONFIG.sourceBucket,
    Key: sourceKey,
  });

  const response = await s3Client.send(getCommand);
  if (!response.Body) {
    console.warn(`  No body in response for: ${sourceKey}`);
    return { processed, skipped: skipped + variantsToProcess.length };
  }

  const imageBuffer = await streamToBuffer(response.Body as Readable);

  // Process each variant
  for (const variant of variantsToProcess) {
    const size = CONFIG.sizes[variant.size];
    let sharpInstance = sharp(imageBuffer);

    // Resize with smart cropping (similar to ImageKit's fo-auto)
    if (size.height) {
      // Use 'attention' strategy for smart focus detection
      // This analyzes the image for areas with high luminance, saturation, and skin tones
      sharpInstance = sharpInstance.resize(size.width, size.height, {
        fit: "cover",
        position: "attention", // Smart crop - focuses on faces and important areas
      });
    } else {
      sharpInstance = sharpInstance.resize(size.width, undefined, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to format
    let outputBuffer: Buffer;
    let contentType: string;

    if (variant.format === "webp") {
      outputBuffer = await sharpInstance.webp({ quality: CONFIG.quality }).toBuffer();
      contentType = "image/webp";
    } else {
      outputBuffer = await sharpInstance.jpeg({ quality: CONFIG.quality }).toBuffer();
      contentType = "image/jpeg";
    }

    // Upload to destination bucket
    await s3Client.send(
      new PutObjectCommand({
        Bucket: CONFIG.destBucket,
        Key: variant.key,
        Body: outputBuffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    processed++;
    console.log(`  Generated: ${variant.key}`);
  }

  return { processed, skipped };
}

async function listSourceImages(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: CONFIG.sourceBucket,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && /\.(jpg|jpeg|png|webp)$/i.test(object.Key)) {
          keys.push(object.Key);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Stock Image Size Generator");
  console.log("=".repeat(60));
  console.log(`Source bucket: ${CONFIG.sourceBucket}`);
  console.log(`Destination bucket: ${CONFIG.destBucket}`);
  console.log(`Region: ${CONFIG.region}`);
  console.log(`Hero size: ${CONFIG.sizes.hero.width}x${CONFIG.sizes.hero.height}`);
  console.log(`Standard size: ${CONFIG.sizes.standard.width}w (auto height)`);
  console.log("=".repeat(60));

  if (!CONFIG.sourceBucket) {
    console.error("ERROR: SOURCE_BUCKET environment variable is required");
    process.exit(1);
  }

  // List all source images
  console.log("\nListing source images...");
  const sourceImages = await listSourceImages();
  console.log(`Found ${sourceImages.length} images to process`);

  if (sourceImages.length === 0) {
    console.log("No images found in source bucket");
    return;
  }

  // Process images
  console.log("\nProcessing images...");
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const results = await processInBatches(
    sourceImages,
    CONFIG.concurrency,
    async (sourceKey) => {
      console.log(`Processing: ${sourceKey}`);
      try {
        return await processImage(sourceKey);
      } catch (error) {
        console.error(`  ERROR: ${error}`);
        return { processed: 0, skipped: 0, error: true };
      }
    }
  );

  for (const result of results) {
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    if ("error" in result) {
      totalErrors++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`Total images: ${sourceImages.length}`);
  console.log(`Variants generated: ${totalProcessed}`);
  console.log(`Variants skipped (already exist): ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
