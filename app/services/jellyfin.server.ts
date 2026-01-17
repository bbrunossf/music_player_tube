// app/services/jellyfin.server.ts

import { Jellyfin, Api } from "@jellyfin/sdk";
import { getSystemApi, getLibraryApi } from "@jellyfin/sdk/lib/utils/api/index.js";

const url = process.env.JELLYFIN_URL ?? "http://192.168.1.14:8096";
const username = process.env.JELLYFIN_USERNAME ?? "usuario";
const password = process.env.JELLYFIN_PASSWORD ?? "senha";

let authenticatedApi: Api | null = null;
let currentUserId: string | null = null;

async function authenticate(): Promise<Api> {
  const client = new Jellyfin({
    clientInfo: {
      name: "My Client Application",
      version: "1.0.0",
    },
    deviceInfo: {
      name: "RaspberryPi Downloader",
      id: "unique-device-id",
    },
  });

  const api = client.createApi(url);
  await getSystemApi(api).getPublicSystemInfo();

  const auth = await api.authenticateUserByName(username, password);
  currentUserId = auth.data.User?.Id ?? null;

  authenticatedApi = api;
  return api;
}

export async function getAuthenticatedApi(): Promise<Api> {
  if (!authenticatedApi) {
    return authenticate();
  }

  return authenticatedApi;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!authenticatedApi) {
    await authenticate();
  }

  return currentUserId;
}

export async function getLibraries() {
  const api = await getAuthenticatedApi();
  const response = await getLibraryApi(api).getMediaFolders();
  return response.data;
}  