
import { GoogleGenAI, Type } from "@google/genai";
import { GoogleDriveFile } from '../types';

/**
 * Link hiển thị ảnh thumbnail chất lượng cao từ ID file Drive.
 * sz=w1000 giúp lấy ảnh chất lượng tốt để khách xem.
 */
export const getDriveImageUrl = (fileId: string): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
};

/**
 * Trích xuất Folder ID từ link Drive hoặc chuỗi ID thuần.
 */
export const extractFolderId = (input: string): string => {
  if (!input) return '';
  const match = input.match(/folders\/([a-zA-Z0-9_-]{25,})/);
  return match ? match[1] : input.trim();
};

/**
 * Sử dụng Gemini 3 Flash với Google Search để quét nội dung thư mục Drive.
 * Phương pháp này không yêu cầu người dùng phải bật Google Drive API trong Console.
 */
export const fetchDriveFilesViaAI = async (folderId: string): Promise<GoogleDriveFile[]> => {
  // Khởi tạo trực tiếp với key từ môi trường hệ thống
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanId = extractFolderId(folderId);
  const folderUrl = `https://drive.google.com/drive/folders/${cleanId}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a file crawler. Search and list all image files inside this public Google Drive folder: ${folderUrl}. 
      I need the File ID and the exact File Name for each image.
      Only return a JSON array of objects.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { 
                type: Type.STRING,
                description: "The unique Google Drive File ID"
              },
              name: { 
                type: Type.STRING,
                description: "The full name of the file including extension"
              },
            },
            required: ["id", "name"]
          }
        }
      },
    });

    const result = JSON.parse(response.text || "[]");
    
    // Đảm bảo dữ liệu trả về sạch và hợp lệ
    return result
      .filter((f: any) => f.id && f.id.length > 10)
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: "image/jpeg"
      }));
  } catch (error: any) {
    console.error("AI Fetch Error:", error);
    throw new Error("AI không thể truy cập thư mục. Hãy chắc chắn thư mục đã được 'Chia sẻ công khai' (Anyone with the link can view).");
  }
};
