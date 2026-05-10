import { toPng } from 'html-to-image';

export async function exportDomNodeAsImage(
  node: HTMLElement,
  fileName: string = 'card.png',
  scale: number = 2,
): Promise<void> {
  try {
    const dataUrl = await toPng(node, { pixelRatio: scale, backgroundColor: 'white' });
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export image:', error);
    alert('Could not export image. Please try again.');
  }
}
