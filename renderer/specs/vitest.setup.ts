import { vi } from "vitest";
import fs from "fs";
import path from "path";
import { Headers } from "node-fetch"; // Assuming you are using node-fetch

// Mock client-string-loader
export const setupClientStringLoaderMock = () => {
  vi.mock("@/assets/client-string-loader", () => ({
    loadClientStrings: vi.fn(async (lang) => {
      const basePath = path.resolve(__dirname, "../public/data/");
      const filePath = path.join(basePath, `${lang}/client_strings.js`);

      try {
        return (await import(/* @vite-ignore */ `${filePath}`)).default;
      } catch (error: any) {
        throw new Error(
          `Error loading client_strings.js for ${lang}: ${error.message}`,
        );
      }
    }),
  }));
};

// Mock fetch
export const setupFetchMock = () => {
  // @ts-expect-error - fetch is not defined in vitest
  global.fetch = vi.fn(async (url) => {
    const basePath = path.resolve(__dirname, "../public/");
    const filePath = path.join(
      basePath,
      url.replace(import.meta.env.BASE_URL, ""),
    );

    const createResponse = (body: any, status = 200) => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Not Found",
      headers: new Headers(),
      redirected: false,
      type: "default" as ResponseType,
      url: filePath,
      clone: () => createResponse(body, status),
      body: null,
      bodyUsed: false,
      json: async () => JSON.parse(body),
      text: async () => body,
      arrayBuffer: async () => Buffer.from(body).buffer,
      blob: async () => new Blob([body]),
      formData: async () => {
        throw new Error("formData not implemented");
      },
    });

    try {
      if (filePath.endsWith(".ndjson")) {
        const data = fs.readFileSync(filePath, "utf8");
        return createResponse(data, 200);
      }
      if (filePath.endsWith(".bin")) {
        const data = fs.readFileSync(filePath);
        return createResponse(data, 200);
      }
      if (filePath.endsWith(".json")) {
        const data = fs.readFileSync(filePath, "utf8");
        return createResponse(data, 200);
      }
    } catch (error) {
      return createResponse(`File not found: ${filePath}`, 404);
    }

    throw new Error(`Unhandled fetch request: ${url}`);
  });
};

// Consolidate setup
export const setupTests = () => {
  setupClientStringLoaderMock();
  setupFetchMock();
};

setupTests();
