export const toRGBObject = input => {
	if (!input) return input
	if (input.includes('rgba')) {
		const [r, g, b, a] = input
			.substring(5, input.length - 1)
			.replace(/ /g, '')
			.split(',')
			.map(e => +e)
		return { r, g, b, a }
	}
	else if (input.includes('rgb')) {
		const [r, g, b] = input
			.replace(/[^\d,]/g, '')
			.split(',')
			.map(c => +c)
		return { r, g, b }
	}
	else if (input.startsWith('#')) return hexToRGB(input.slice(1))
	else throw 'Color format not supported.'
}

const hexToRGB = hexString => {
	if (hexString.length != 6) throw "Only six-digit hex colors are allowed.";
	const rgbHex = hexString.match(/.{1,2}/g);
	const [r, g, b] = rgbHex.map(c => parseInt(c, 16))
	return { r, g, b }
}