import { Dropbox, DropboxResponse, files } from 'dropbox';
import { orderBy } from 'lodash-es';
import { LoadingBar } from 'quasar';
import { isImage } from '~/helpers';
import { useApiFetch } from './useApi';
import { useNotification } from './useNotification';
import { useRouter } from 'vue-router';
import { reactive } from 'vue';

const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
const dbx = new Dropbox({ clientId: DROPBOX_CLIENT_ID });

const state = reactive({
  refresh: false,
  isLoading: false,
  path: '',
  accessToken: null as string,
  folder: null as (
    | files.FileMetadataReference
    | files.FolderMetadataReference
    | files.DeletedMetadataReference
  )[],
});

export const useServiceDropbox = () => {
  const notification = useNotification();
  const api = useApiFetch();
  const router = useRouter();

  const setAccessToken = (token: string) => {
    state.accessToken = token;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dbx.auth.setAccessToken(token);
  };

  async function getAccount(isRetry = false): Promise<any> {
    LoadingBar.start();
    state.isLoading = true;

    if (!state.accessToken) {
      await getAccessToken();
    }

    try {
      const res = await dbx.usersGetCurrentAccount();
      state.isLoading = false;
      LoadingBar.stop();
      return res;
    } catch (e: any) {
      if (isRetry) {
        return false;
      }
      if (e.status === 401) {
        state.accessToken = null;
        const res = await getAccount(true);
        return res;
      }
      return false;
    }
  }

  async function getAccessToken() {
    return await api.get('/v1/dropbox/token').then(
      (response: any) => {
        if (response.token) {
          setAccessToken(response.token);
          return true;
        } else {
          setAccessToken('');
          return false;
        }
      },
      (error) => {
        setAccessToken('');
        console.error(error);
        return false;
      },
    );
  }

  async function addAccount() {
    await api.get('/v1/dropbox').then(
      (response: any) => {
        window.location.href = response.url;
      },
      (error) => {
        console.error(error);
      },
    );
  }

  async function deleteAccount() {
    return await api.remove('/v1/dropbox/0').then(
      (_response: any) => {
        setAccessToken('');
        return true;
      },
      (error) => {
        console.error(error);
      },
    );
  }

  async function deleteFile(id: string) {
    return await dbx.filesDeleteV2({ path: id }).then(() => {
      return listFiles();
    });
  }

  async function auth(code: string) {
    await api.get(`/v1/dropbox/auth/${code}`).then(
      (response: any) => {
        router.replace({ query: null });
        setAccessToken(response.token);
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  }

  async function listFiles(isRetry = false): Promise<any> {
    LoadingBar.start();
    state.isLoading = true;
    if (!state.accessToken) {
      await getAccessToken();
    }
    try {
      const res = await dbx.filesListFolder({ path: state.path });
      const ordered_list = orderBy(
        res.result.entries,
        ['.tag', 'name'],
        ['desc', 'asc'],
      );
      LoadingBar.stop();
      state.folder = ordered_list;
      state.isLoading = false;
      LoadingBar.stop();
      return ordered_list;
    } catch (e: any) {
      if (isRetry) {
        return false;
      }
      if (e.status === 401) {
        state.accessToken = null;
        const res = await listFiles(true);
        return res;
      }
      return false;
    }
  }

  async function createFolder(name: string) {
    LoadingBar.start();
    state.isLoading = true;
    return await dbx
      .filesCreateFolderV2({
        path: state.path + '/' + name,
        autorename: true,
      })
      .then(() => listFiles())
      .then((response) => {
        LoadingBar.stop();
        state.isLoading = false;
        return response;
      });
  }

  async function renameFile(oldName: string, newName: string) {
    let newNameExt = newName;
    if (isImage(oldName)) {
      const oldFileExt = oldName.split('.').pop();
      const newFileExt = newName.split('.').pop();
      newNameExt =
        oldFileExt !== newFileExt ? newName + '.' + oldFileExt : newName;
    }

    return await dbx
      .filesMoveV2({
        from_path: state.path + '/' + oldName,
        to_path: state.path + '/' + newNameExt,
        autorename: true,
      })
      .then(() => {
        return listFiles();
      });
  }

  async function uploadFile(file: File) {
    return await getAccessToken()
      .then(() =>
        dbx.filesUpload({ path: state.path, autorename: true, contents: file }),
      )
      .catch((e) => console.error(e));
  }

  async function getMeta(
    id: string,
    isRetry = false,
  ): Promise<
    DropboxResponse<
      | files.FileMetadataReference
      | files.FolderMetadataReference
      | files.DeletedMetadataReference
    >
  > {
    LoadingBar.start();
    state.isLoading = true;
    if (!state.accessToken) {
      await getAccessToken();
    }

    try {
      const res = await dbx.filesGetMetadata({
        path: id,
      });
      state.isLoading = false;
      LoadingBar.stop();
      return res;
    } catch (e: any) {
      state.isLoading = false;
      LoadingBar.stop();
      if (isRetry) {
        throw false;
      }
      if (e.status === 401) {
        state.accessToken = null;
        const res = await getMeta(id, true);
        return res;
      }
      throw false;
    }
  }

  async function getThumbnail(id: string) {
    LoadingBar.start();
    state.isLoading = true;

    if (!state.accessToken) {
      await getAccessToken();
    }

    await getMeta(id);

    return await dbx
      .filesGetThumbnail({
        path: id,
        mode: 'bestfit' as any,
        size: 'w1024h768' as any,
      })
      .then((response) => {
        LoadingBar.stop();
        state.isLoading = false;
        return response;
      })
      .catch((e) => {
        LoadingBar.stop();
        state.isLoading = false;
        if (e.status === 409) throw e;
        else notification.open('negative', e);
      });
  }

  async function download(id: string) {
    LoadingBar.start();
    state.isLoading = true;
    return dbx
      .filesDownload({ path: id })
      .then((response) => {
        LoadingBar.stop();
        state.isLoading = false;
        const data = response.result as any;
        const blob = new Blob([data.fileBlob], {
          type: 'application/octet-stream',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.name;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch((e) => console.error(e));
  }

  return {
    getThumbnail,
    addAccount,
    getAccount,
    getAccessToken,
    getMeta,
    deleteAccount,
    deleteFile,
    auth,
    listFiles,
    renameFile,
    createFolder,
    uploadFile,
    state,
    download,
  };
};
