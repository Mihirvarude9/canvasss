import { Canvas as FabricCanvas } from 'fabric';
import jsPDF from 'jspdf';
import type { ExportOptions } from '@/components/ExportDialog';

/**
 * Export canvas to PNG format
 */
export const exportToPNG = async (
  canvas: FabricCanvas,
  options: ExportOptions
): Promise<void> => {
  // If exactly one object is selected, export only that object's bounding box
  const active = canvas.getActiveObject() as any;
  if (active && active.type !== 'activeSelection') {
    const rect = active.getBoundingRect(true, true);
    // Temporarily hide all other objects and remove canvas background
    const objects = canvas.getObjects();
    const originalVisibility = objects.map(o => o.visible);
    const originalBg = canvas.backgroundColor;
    objects.forEach(o => { if (o !== active) o.visible = false; });
    canvas.setBackgroundColor('rgba(0,0,0,0)', () => {});
    canvas.renderAll();
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: options.scale,
      enableRetinaScaling: false,
      left: Math.max(0, Math.floor(rect.left)),
      top: Math.max(0, Math.floor(rect.top)),
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    } as any);
    // Restore canvas state
    objects.forEach((o, i) => { o.visible = originalVisibility[i]; });
    canvas.setBackgroundColor(originalBg as string, () => {});
    canvas.renderAll();
    downloadFile(dataURL, `${options.filename}.png`);
    return;
  }

  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: options.scale,
    enableRetinaScaling: false,
  });

  downloadFile(dataURL, `${options.filename}.png`);
};

/**
 * Export canvas to JPG format
 */
export const exportToJPG = async (
  canvas: FabricCanvas,
  options: ExportOptions
): Promise<void> => {
  // Set background color for JPG (no transparency)
  const originalBg = canvas.backgroundColor;
  canvas.setBackgroundColor(options.backgroundColor, () => {
    const active = canvas.getActiveObject() as any;
    if (active && active.type !== 'activeSelection') {
      const rect = active.getBoundingRect(true, true);
      const objects = canvas.getObjects();
      const originalVisibility = objects.map(o => o.visible);
      objects.forEach(o => { if (o !== active) o.visible = false; });
      canvas.renderAll();
      const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: getJPEGQuality(options.quality),
        multiplier: options.scale,
        enableRetinaScaling: false,
        left: Math.max(0, Math.floor(rect.left)),
        top: Math.max(0, Math.floor(rect.top)),
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      } as any);

      // Restore original background
      canvas.setBackgroundColor(originalBg as string, () => {
        canvas.renderAll();
      });
      // Restore visibility
      objects.forEach((o, i) => { o.visible = originalVisibility[i]; });
      canvas.renderAll();

      downloadFile(dataURL, `${options.filename}.jpg`);
      return;
    }

    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: getJPEGQuality(options.quality),
      multiplier: options.scale,
      enableRetinaScaling: false,
    });

    // Restore original background
    canvas.setBackgroundColor(originalBg as string, () => {
      canvas.renderAll();
    });

    downloadFile(dataURL, `${options.filename}.jpg`);
  });
};

/**
 * Export canvas to SVG format
 */
export const exportToSVG = async (
  canvas: FabricCanvas,
  options: ExportOptions
): Promise<void> => {
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  
  // Get SVG string from Fabric.js
  let svgString = canvas.toSVG({
    suppressPreamble: false,
    viewBox: {
      x: 0,
      y: 0,
      width: width,
      height: height,
    },
    width: `${width}px`,
    height: `${height}px`,
  });

  // Ensure proper XML declaration
  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
  }

  // Add proper xmlns attributes if missing
  if (!svgString.includes('xmlns=')) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
    );
  }

  // Add background rectangle if background color is specified
  let finalSVG = svgString;
  if (options.backgroundColor && options.backgroundColor !== '#ffffff') {
    // Insert background rectangle after opening <svg> tag
    const svgTagEnd = svgString.indexOf('>') + 1;
    const backgroundRect = `\n  <rect x="0" y="0" width="${width}" height="${height}" fill="${options.backgroundColor}"/>\n`;
    finalSVG = svgString.slice(0, svgTagEnd) + backgroundRect + svgString.slice(svgTagEnd);
  }

  // Create blob with proper MIME type
  const blob = new Blob([finalSVG], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  downloadFile(url, `${options.filename}.svg`);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Export canvas to PDF format
 */
export const exportToPDF = async (
  canvas: FabricCanvas,
  options: ExportOptions
): Promise<void> => {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // Create PDF with canvas dimensions (in mm)
  const mmWidth = canvasWidth * 0.264583; // px to mm
  const mmHeight = canvasHeight * 0.264583;

  const pdf = new jsPDF({
    orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [mmWidth, mmHeight],
  });

  // Add background color
  if (options.backgroundColor && options.backgroundColor !== '#ffffff') {
    pdf.setFillColor(options.backgroundColor);
    pdf.rect(0, 0, mmWidth, mmHeight, 'F');
  }

  // Convert canvas to image and add to PDF
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2, // Higher quality for PDF
    enableRetinaScaling: false,
  });

  pdf.addImage(dataURL, 'PNG', 0, 0, mmWidth, mmHeight);
  pdf.save(`${options.filename}.pdf`);
};

/**
 * Main export function that routes to the appropriate format handler
 */
export const exportCanvas = async (
  canvas: FabricCanvas | null,
  options: ExportOptions
): Promise<void> => {
  if (!canvas) {
    throw new Error('Canvas not initialized');
  }

  // Keep selection to support single-object export; specific exporters will hide selection as needed

  switch (options.format) {
    case 'png':
      await exportToPNG(canvas, options);
      break;
    case 'jpg':
      await exportToJPG(canvas, options);
      break;
    case 'svg':
      await exportToSVG(canvas, options);
      break;
    case 'pdf':
      await exportToPDF(canvas, options);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
};

/**
 * Helper function to download a file
 */
const downloadFile = (dataURL: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get JPEG quality based on quality setting
 */
const getJPEGQuality = (quality: string): number => {
  switch (quality) {
    case 'low':
      return 0.6;
    case 'medium':
      return 0.8;
    case 'high':
      return 0.9;
    case 'ultra':
      return 1.0;
    default:
      return 0.9;
  }
};

/**
 * Save all generated images as individual files
 */
export const saveAllGeneratedImages = async (
  assets: any[],
  generatedAssetIds: string[]
): Promise<void> => {
  const generatedAssets = assets.filter(asset => 
    generatedAssetIds.includes(asset.id) && asset.type === 'image'
  );

  if (generatedAssets.length === 0) {
    throw new Error('No generated images found to save');
  }

  // Create a zip file containing all generated images
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add each generated image to the zip
  for (let i = 0; i < generatedAssets.length; i++) {
    const asset = generatedAssets[i];
    try {
      // Fetch the image
      const response = await fetch(asset.url.startsWith('http') 
        ? asset.url 
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${asset.url}`
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch image ${asset.name}:`, response.statusText);
        continue;
      }

      const blob = await response.blob();
      
      // Create a safe filename
      const safeName = asset.name
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      
      const filename = `${i + 1}_${safeName}.jpg`;
      zip.file(filename, blob);
    } catch (error) {
      console.warn(`Failed to add image ${asset.name} to zip:`, error);
    }
  }

  // Generate and download the zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.download = `generated_images_${new Date().toISOString().split('T')[0]}.zip`;
  link.href = zipUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
};
