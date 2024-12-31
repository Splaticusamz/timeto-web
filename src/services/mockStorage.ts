export const mockStorage = {
  uploadImage: async (file: File): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Convert the file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result contains the base64 string
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}; 