
import { GoogleDriveFile } from '../types';

/**
 * Link hiển thị ảnh thumbnail chất lượng cao.
 */
export const getDriveImageUrl = (fileId: string): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
};

/**
 * Trích xuất Folder ID từ link hoặc chuỗi.
 */
export const extractFolderId = (input: string): string => {
  if (!input) return '';
  const match = input.match(/folders\/([a-zA-Z0-9_-]{25,})/);
  return match ? match[1] : input.trim();
};

/**
 * Lấy danh sách file trực tiếp từ Google Drive API v3.
 * Cách này cực kỳ nhanh, ổn định và không bị giới hạn bởi AI Search.
 * Yêu cầu: Folder phải được đặt ở chế độ "Bất kỳ ai có liên kết đều có thể xem".
 */
export const fetchDriveFiles = async (folderId: string): Promise<GoogleDriveFile[]> => {
  const apiKey = process.env.API_KEY;
  const cleanId = extractFolderId(folderId);

  if (!apiKey || apiKey === "undefined") {
    throw new Error("Hệ thống chưa cấu hình API Key. Vui lòng kiểm tra môi trường.");
  }

  // Sử dụng endpoint chuẩn của Google Drive API v3 để liệt kê file trong thư mục
  const url = `https://www.googleapis.com/drive/v3/files?q='${cleanId}'+in+parents+and+mimeType+contains+'image/'&key=${apiKey}&fields=files(id,name,mimeType)&pageSize=1000`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      if (data.error.status === "PERMISSION_DENIED") {
        throw new Error("Thư mục này chưa được công khai. Hãy đặt chế độ 'Bất kỳ ai có liên kết đều có thể xem' trên Google Drive.");
      }
      throw new Error(data.error.message || "Không thể truy cập thư mục này.");
    }

    if (!data.files || data.files.length === 0) {
      return [];
    }

    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType
    }));
  } catch (error: any) {
    console.error("Drive API Error:", error);
    throw error;
  }
};
