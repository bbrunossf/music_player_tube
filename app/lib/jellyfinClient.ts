// lib/jellyfinClient.ts
import { Jellyfin, utils, Api } from '@jellyfin/sdk';
//import { Jellyfin, utils } from '@jellyfin/sdk';

import { getSystemApi, getUserApi, getLibraryApi } from '@jellyfin/sdk/lib/utils/api/index.js';

const url = process.env.JELLYFIN_URL ?? 'http://192.168.1.14:8096';
const username = process.env.JELLYFIN_USERNAME ?? 'usuario';
const password = process.env.JELLYFIN_PASSWORD ?? 'senha';

const client = new Jellyfin({
    clientInfo: {
        name: 'My Client Application',
        version: '1.0.0'
    },
    deviceInfo: {
        name: 'RaspberryPi Downloader',
        id: 'unique-device-id'
    }
});

const api = client.createApi(
    url
  );

  

// Fetch the public system info
const info = await getSystemApi(api).getPublicSystemInfo();
//console.log('Info =>', info.data);  

// Fetch the list of public users. Retornou nada
// const users = await getUserApi(api).getPublicUsers();
// console.log('Users =>', users.data);

const auth = await api.authenticateUserByName(username, password);
//console.log('Auth =>', auth.data);

// Authentication state is stored internally in the Api class, so now
// requests that require authentication can be made normally
const libraries = await getLibraryApi(api).getMediaFolders();
console.log('Libraries =>', libraries.data);

//até aqui funcionou

let authenticatedApi: Api | null = null;
let currentUserId: string | null = null;

export async function getAuthenticatedApi() {
  if (!authenticatedApi) {
    const client = new Jellyfin({
      clientInfo: {
        name: 'My Client Application',
        version: '1.0.0'
      },
      deviceInfo: {
        name: 'RaspberryPi Downloader',
        id: 'unique-device-id'
      }
    });

    authenticatedApi = client.createApi(url);
    const auth = await authenticatedApi.authenticateUserByName(username, password);
    currentUserId = auth.data.User?.Id || null;
  }
  
  return authenticatedApi;
};

export async function getCurrentUserId() {
  await getAuthenticatedApi(); // Garante que está autenticado
  return currentUserId;
}