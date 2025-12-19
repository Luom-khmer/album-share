
import { GoogleGenAI, Type } from "@google/genai";
import { GoogleDriveFile } from '../types';

/**
 * Link hiển thị ảnh thumbnail từ ID file Drive.
 */
export const getDriveImageUrl = (fileId: string): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
};

/**
 * Trích xuất Folder ID từ link.
 */
export const extractFolderId = (input: string): string => {
  if (!input) return '';
  const match = input.match(/folders\/([a-zA-Z0-9_-]{25,})/);
  return match ? match[1] : input.trim();
};

/**
 * Sử dụng Gemini 3 Flash làm "Crawler" để lấy danh sách file.
 * Cách này sử dụng năng lực của AI để đọc trang web công khai, 
 * giúp bỏ qua bước "Enable Drive API" phiền phức.
 */
export const fetchDriveFilesViaAI = async (folderId: string): Promise<GoogleDriveFile[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Hệ thống chưa cấu hình API Key.");

  const ai = new GoogleGenAI({ apiKey });
  const cleanId = extractFolderId(folderId);
  const folderUrl = `https://drive.google.com/drive/folders/${cleanId}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Access this public Google Drive folder and list all image files: ${folderUrl}. 
      Return only a JSON array of objects with "id" and "name". 
      Example: [{"id": "...", "name": "..."}]`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
            },
            required: ["id", "name"]
          }
        }
      },
    });

    const result = JSON.parse(response.text || "[]");
    
    // Lọc bỏ các file không có ID hợp lệ
    return result.filter((f: any) => f.id && f.id.length > 10).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: "image/jpeg"
    }));
  } catch (error: any) {
    console.error("AI Fetch Error:", error);
    throw new Error("AI không thể đọc được thư mục này. Hãy đảm bảo thư mục đã được đặt ở chế độ 'Bất kỳ ai có liên kết đều có thể xem'.");
  }
};
