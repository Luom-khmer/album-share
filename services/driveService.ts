
import { GoogleGenAI, Type } from "@google/genai";
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
 * Sử dụng Gemini 3 Flash để lấy danh sách file.
 */
export const fetchDriveFilesViaGemini = async (folderId: string): Promise<{files: GoogleDriveFile[], sources: any[]}> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("THIẾU API KEY: Vui lòng cấu hình biến môi trường 'API_KEY' trong cài đặt dự án (Vercel) hoặc chọn Key trong Google AI Studio.");
  }

  const cleanId = extractFolderId(folderId);
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Hãy truy cập thư mục Google Drive công khai này: https://drive.google.com/drive/folders/${cleanId} 
    và liệt kê tên file cùng ID của tất cả ảnh bên trong. 
    Định dạng trả về chính xác: ID: [file_id], Name: [file_name].`,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    },
  });

  const text = response.text || "";
  const files: GoogleDriveFile[] = [];
  
  const regex = /ID:\s*([a-zA-Z0-9_-]{25,})[\s,]+Name:\s*([^\n\r]+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    files.push({
      id: match[1].trim(),
      name: match[2].trim(),
      mimeType: 'image/jpeg'
    });
  }

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { files, sources };
};
