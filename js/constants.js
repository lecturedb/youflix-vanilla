export const CATEGORIES = ["음악", "영화", "코딩", "뉴스", "엔터"];

export const LS_KEYS = {
  CHANNELS: "youflix-channels",
  YT_API_KEY: "youtube-api-key",
  DRIVE_FILE_ID: "drive-file-id",
  OAUTH_CLIENT_ID: "oauth-client-id",
};

export const SELECTORS = {
  container: "#container",
  headerTabs: "header ul",
  headerRoot: "header",
  hamburger: ".hamburger",
  headerMenu: "#header-menu",
  modalContainer: ".modal_container", // [0]: 채널추가/수정, [1]: 상세
  addForm: "#handle_form",
  addInput: "#handle_input",
  addResult: "#handle_result",
  detailModalIndex: 1,
  keyForm: "#key_form",
  keyInput: "#key_input",
  exportBtn: "#export_btn",
  importBtn: "#import_btn",
  chAddBtn: ".cta",
  fileIdBtn: " #file_id_btn",
};

// YouTube Data API
export const API_URL = "https://www.googleapis.com/youtube/v3";

// Google Drive API
export const GOOGLE_API = "https://www.googleapis.com";
export const DATA_URL = `https://www.googleapis.com/drive/v3/files`;

// Google Drive용 스코프
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
