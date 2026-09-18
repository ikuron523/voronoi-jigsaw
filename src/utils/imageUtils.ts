export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const resizeImage = (img: HTMLImageElement, maxWidth: number, maxHeight: number): HTMLImageElement => {
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height *= maxWidth / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width *= maxHeight / height;
    height = maxHeight;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, width, height);

  const resizedImg = new Image();
  resizedImg.src = canvas.toDataURL('image/png');
  resizedImg.width = width;
  resizedImg.height = height;
  return resizedImg;
};
