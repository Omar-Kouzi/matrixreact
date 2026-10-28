// Resize recipe photos before sending them to the AI endpoint. This reduces
// request size and keeps image analysis transient (no Firebase Storage upload).
export const imageFileToJpegBase64 = (file, maxDimension = 1600, quality = 0.84) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please choose a valid image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read image."));
        return;
      }
      const image = new Image();
      image.onerror = () => reject(new Error("This image format could not be opened by your browser."));
      image.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Your browser could not prepare the image."));
            return;
          }
          // A white background keeps transparent PNG text readable in JPEG output.
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Could not compress the image."));
              return;
            }
            const outputReader = new FileReader();
            outputReader.onerror = () => reject(new Error("Could not prepare the compressed image."));
            outputReader.onload = () => {
              if (typeof outputReader.result !== "string") {
                reject(new Error("Could not prepare the compressed image."));
                return;
              }
              resolve(outputReader.result.split(",")[1]);
            };
            outputReader.readAsDataURL(blob);
          }, "image/jpeg", quality);
        } catch (error) {
          reject(error);
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
