/**
 * Photos are re-encoded in the browser before upload (spec.md F4): drawing to a canvas and
 * exporting a JPEG drops every EXIF tag, including GPS location. A 32px veil is made alongside,
 * so strangers only ever receive the veil, never the clear image.
 */
const CLEAR_MAX_EDGE = 1600;
const VEIL_MAX_EDGE = 32;

export interface EncodedPhoto {
	clear: Blob;
	veil: Blob;
	width: number;
	height: number;
}

async function decode(file: File): Promise<ImageBitmap> {
	// "from-image" applies the camera's orientation before the tags are thrown away.
	return createImageBitmap(file, { imageOrientation: "from-image" });
}

function draw(bitmap: ImageBitmap, maxEdge: number) {
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Canvas is not available");
	}
	context.imageSmoothingQuality = "high";
	context.drawImage(bitmap, 0, 0, width, height);
	return { canvas, width, height };
}

function toJpeg(canvas: HTMLCanvasElement, quality: number) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the photo"))),
			"image/jpeg",
			quality,
		);
	});
}

export async function encodePhoto(file: File): Promise<EncodedPhoto> {
	const bitmap = await decode(file);
	try {
		const clear = draw(bitmap, CLEAR_MAX_EDGE);
		const veil = draw(bitmap, VEIL_MAX_EDGE);
		const [clearBlob, veilBlob] = await Promise.all([
			toJpeg(clear.canvas, 0.86),
			toJpeg(veil.canvas, 0.7),
		]);
		return { clear: clearBlob, veil: veilBlob, width: clear.width, height: clear.height };
	} finally {
		bitmap.close();
	}
}
