/**
 * @fileoverview
 * - Using the 'QRCode for Javascript library'
 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
 * - this library has no dependencies.
 *
 * @author davidshimjs
 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
 */
//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
class QR8bitByte {
	constructor(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		const parsedData = [];
		// Added to support UTF-8 Characters
		for (let i = 0, l = data.length; i < l; i++) {
			const byteArray = [];
			const code = data.charCodeAt(i);
			if (code > 0x10000) {
				byteArray[0] = 0xf0 | ((code & 0x1c0000) >>> 18);
				byteArray[1] = 0x80 | ((code & 0x3f000) >>> 12);
				byteArray[2] = 0x80 | ((code & 0xfc0) >>> 6);
				byteArray[3] = 0x80 | (code & 0x3f);
			} else if (code > 0x800) {
				byteArray[0] = 0xe0 | ((code & 0xf000) >>> 12);
				byteArray[1] = 0x80 | ((code & 0xfc0) >>> 6);
				byteArray[2] = 0x80 | (code & 0x3f);
			} else if (code > 0x80) {
				byteArray[0] = 0xc0 | ((code & 0x7c0) >>> 6);
				byteArray[1] = 0x80 | (code & 0x3f);
			} else {
				byteArray[0] = code;
			}
			parsedData.push(byteArray);
		}
		this.parsedData = [].concat(parsedData);
		if (this.parsedData.length !== data.length) {
			// ADD BOM
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}
	getLength() {
		return this.parsedData.length;
	}
	write(buffer) {
		for (let i = 0, l = this.parsedData.length; i < l; i++) {
			buffer.put(this.parsedData[i], 8);
		}
	}
}
class QRCodeModel {
	constructor(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}
	addData(data) {
		const newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	}
	isDark(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + ',' + col);
		}
		return this.modules[row][col];
	}
	getModuleCount() {
		return this.moduleCount;
	}
	make() {
		this.makeImpl(false, this.getBestMaskPattern());
	}
	makeImpl(test, maskPattern) {
		const moduleCount = this.typeNumber * 4 + 17;
		const moduleCountOffsetMinus7 = moduleCount - 7;
		this.moduleCount = moduleCount;
		const modules = new Array(moduleCount);
		this.modules = modules;
		for (let rowIndex = 0; rowIndex < moduleCount; rowIndex++) {
			const row = new Array(moduleCount);
			modules[rowIndex] = row;
			for (let colIndex = 0; colIndex < moduleCount; colIndex++) {
				row[colIndex] = null;
			}
		}
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(moduleCountOffsetMinus7, 0);
		this.setupPositionProbePattern(0, moduleCountOffsetMinus7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
		if (this.dataCache == null) {
			this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
		this.mapData(this.dataCache, maskPattern);
	}
	setupPositionProbePattern(row, col) {
		const moduleCount = this.moduleCount;
		const models = this.modules;
		for (let r = -1; r <= 7; r++) {
			const rowR = row + r;
			if (rowR <= -1 || moduleCount <= rowR) {
				continue;
			}
			for (let c = -1; c <= 7; c++) {
				const colC = col + c;
				if (colC <= -1 || moduleCount <= colC) {
					continue;
				}
				models[rowR][colC] = !!(0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4);
			}
		}
	}
	getBestMaskPattern() {
		let minLostPoint = 0;
		let pattern = 0;
		for (let i = 0; i < 8; i++) {
			this.makeImpl(true, i);
			const lostPoint = QRUtil.getLostPoint(this);
			if (i === 0 || minLostPoint > lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
		return pattern;
	}
	createMovieClip(target_mc, instance_name, depth) {
		const qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		const cs = 1;
		this.make();
		const modules = this.modules;
		for (let rowIndex = 0, rl = modules.length; rowIndex < rl; rowIndex++) {
			const y = rowIndex * cs;
			const row = modules[rowIndex];
			for (let colIndex = 0, cl = row.length; colIndex < cl; colIndex++) {
				const x = colIndex * cs;
				const isDark = row[colIndex];
				if (isDark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		return qr_mc;
	}
	setupTimingPattern() {
		const moduleCountOffset = this.moduleCount - 8;
		const modules = this.modules;
		for (let i = 8; i < moduleCountOffset; i++) {
			const mod = i % 2 === 0;
			const r = modules[i][6];
			const c = modules[6][i];
			modules[i][6] = r != null ? r : mod;
			modules[6][i] = c != null ? c : mod;
		}
	}
	setupPositionAdjustPattern() {
		const pos = QRUtil.getPatternPosition(this.typeNumber);
		const pl = pos.length;
		const modules = this.modules;
		for (let i = 0; i < pl; i++) {
			for (let j = 0; j < pl; j++) {
				const rowIndex = pos[i];
				const colIndex = pos[j];
				if (modules[rowIndex][colIndex] != null) {
					continue;
				}
				for (let r = -2; r <= 2; r++) {
					const row = modules[rowIndex + r];
					for (let c = -2; c <= 2; c++) {
						row[colIndex + c] = !!(r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0));
					}
				}
			}
		}
	}
	setupTypeNumber(test) {
		const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
		const moduleCount = this.moduleCount;
		const modules = this.modules;
		for (let i = 0; i < 18; i++) {
			const mod = !test && ((bits >> i) & 1) === 1;
			const a = Math.floor(i / 3);
			const b = (i % 3) + moduleCount - 8 - 3;
			modules[a][b] = mod;
			modules[b][a] = mod;
		}
	}
	setupTypeInfo(test, maskPattern) {
		const data = (this.errorCorrectLevel << 3) | maskPattern;
		const bits = QRUtil.getBCHTypeInfo(data);
		const moduleCount = this.moduleCount;
		const modules = this.modules;
		for (let i = 0; i < 15; i++) {
			const mod = !test && ((bits >> i) & 1) === 1;
			if (i < 6) {
				modules[i][8] = mod;
			} else if (i < 8) {
				modules[i + 1][8] = mod;
			} else {
				modules[moduleCount - 15 + i][8] = mod;
			}
			if (i < 8) {
				modules[8][moduleCount - i - 1] = mod;
			} else if (i < 9) {
				modules[8][15 - i - 1 + 1] = mod;
			} else {
				modules[8][15 - i - 1] = mod;
			}
		}
		modules[moduleCount - 8][8] = !test;
	}
	mapData(data, maskPattern) {
		const moduleCount = this.moduleCount;
		const modules = this.modules;
		let inc = -1;
		let rowIndex = moduleCount - 1;
		let bitIndex = 7;
		let byteIndex = 0;
		const dataLen = data.length;
		for (let colIndex = moduleCount - 1; colIndex > 0; colIndex -= 2) {
			if (colIndex === 6) {
				colIndex--;
			}
			while (true) {
				const row = modules[rowIndex];
				for (let c = 0; c < 2; c++) {
					const colOffset = colIndex - c;
					const col = row[colOffset];
					if (col !== null) {
						continue;
					}
					let isDark = byteIndex < dataLen ? ((data[byteIndex] >>> bitIndex) & 1) === 1 : false;
					const isMask = QRUtil.getMask(maskPattern, rowIndex, colOffset);
					if (isMask) {
						isDark = !isDark;
					}
					row[colOffset] = isDark;
					bitIndex--;
					if (bitIndex === -1) {
						byteIndex++;
						bitIndex = 7;
					}
				}
				rowIndex += inc;
				if (rowIndex < 0 || moduleCount <= rowIndex) {
					rowIndex -= inc;
					inc = -inc;
					break;
				}
			}
		}
	}
	static createData(typeNumber, errorCorrectLevel, dataList) {
		const PAD0 = 0xec;
		const PAD1 = 0x11;
		const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
		const buffer = new QRBitBuffer();
		for (let data of dataList) {
			buffer.put(data.mode, 4);
			buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
			data.write(buffer);
		}
		let totalDataCount = 0;
		for (let rsBlock of rsBlocks) {
			totalDataCount += rsBlock.dataCount;
		}
		const totalDataBitCount = totalDataCount * 8;
		const bitLength = buffer.getLengthInBits();
		if (bitLength > totalDataBitCount) {
			throw new Error('code length overflow. (' + bitLength + '>' + totalDataBitCount + ')');
		}
		if (bitLength + 4 <= totalDataBitCount) {
			buffer.put(0, 4);
		}
		while (buffer.getLengthInBits() % 8 !== 0) {
			buffer.putBit(false);
		}
		while (true) {
			if (buffer.getLengthInBits() >= totalDataBitCount) {
				break;
			}
			buffer.put(PAD0, 8);
			if (buffer.getLengthInBits() >= totalDataBitCount) {
				break;
			}
			buffer.put(PAD1, 8);
		}
		return QRCodeModel.createBytes(buffer, rsBlocks);
	}
	static createBytes(buffer, rsBlocks) {
		let offset = 0;
		let maxDcCount = 0;
		let maxEcCount = 0;
		const bitBuffer = buffer.buffer;
		const len = rsBlocks.length;
		const dcdata = new Array(len);
		const ecdata = new Array(len);
		let totalCodeCount = 0;
		for (let r = 0; r < len; r++) {
			const rsBlock = rsBlocks[r];
			const dcCount = rsBlock.dataCount;
			const ecCount = rsBlock.totalCount - dcCount;
			maxDcCount = Math.max(maxDcCount, dcCount);
			maxEcCount = Math.max(maxEcCount, ecCount);
			const dcdataRow = new Array(dcCount);
			for (let i = 0; i < dcCount; i++) {
				dcdataRow[i] = 0xff & bitBuffer[i + offset];
			}
			dcdata[r] = dcdataRow;
			offset += dcCount;
			const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
			const ecLen = rsPoly.getLength() - 1;
			const rawPoly = new QRPolynomial(dcdataRow, ecLen);
			const modPoly = rawPoly.mod(rsPoly);
			const modLen = modPoly.getLength();
			const offsetLen = modLen - ecLen;
			const ecdataRow = new Array(ecLen);
			for (let i = 0; i < ecLen; i++) {
				const modIndex = i + offsetLen;
				ecdataRow[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
			}
			ecdata[r] = ecdataRow;
			totalCodeCount += rsBlock.totalCount;
		}
		const data = new Array(totalCodeCount);
		let index = 0;
		for (let i = 0; i < maxDcCount; i++) {
			for (let r = 0; r < len; r++) {
				const dcdataRow = dcdata[r];
				if (i < dcdataRow.length) {
					data[index++] = dcdataRow[i];
				}
			}
		}
		for (let i = 0; i < maxEcCount; i++) {
			for (let r = 0; r < len; r++) {
				const ecdataRow = ecdata[r];
				if (i < ecdataRow.length) {
					data[index++] = ecdataRow[i];
				}
			}
		}
		return data;
	}
}
const QRMode = { MODE_NUMBER: 1 << 0, MODE_ALPHA_NUM: 1 << 1, MODE_8BIT_BYTE: 1 << 2, MODE_KANJI: 1 << 3 };
const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
const QRErrorCorrectLevelOffsetMap = {};
const QRMaskPattern = { PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3, PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7 };
const QRUtil = {
	PATTERN_POSITION_TABLE: [
		[],
		[6, 18],
		[6, 22],
		[6, 26],
		[6, 30],
		[6, 34],
		[6, 22, 38],
		[6, 24, 42],
		[6, 26, 46],
		[6, 28, 50],
		[6, 30, 54],
		[6, 32, 58],
		[6, 34, 62],
		[6, 26, 46, 66],
		[6, 26, 48, 70],
		[6, 26, 50, 74],
		[6, 30, 54, 78],
		[6, 30, 56, 82],
		[6, 30, 58, 86],
		[6, 34, 62, 90],
		[6, 28, 50, 72, 94],
		[6, 26, 50, 74, 98],
		[6, 30, 54, 78, 102],
		[6, 28, 54, 80, 106],
		[6, 32, 58, 84, 110],
		[6, 30, 58, 86, 114],
		[6, 34, 62, 90, 118],
		[6, 26, 50, 74, 98, 122],
		[6, 30, 54, 78, 102, 126],
		[6, 26, 52, 78, 104, 130],
		[6, 30, 56, 82, 108, 134],
		[6, 34, 60, 86, 112, 138],
		[6, 30, 58, 86, 114, 142],
		[6, 34, 62, 90, 118, 146],
		[6, 30, 54, 78, 102, 126, 150],
		[6, 24, 50, 76, 102, 128, 154],
		[6, 28, 54, 80, 106, 132, 158],
		[6, 32, 58, 84, 110, 136, 162],
		[6, 26, 54, 82, 110, 138, 166],
		[6, 30, 58, 86, 114, 142, 170],
	],
	G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
	G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
	G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
	getBCHTypeInfo(data) {
		let d = data << 10;
		while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
			d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
		}
		return ((data << 10) | d) ^ QRUtil.G15_MASK;
	},
	getBCHTypeNumber(data) {
		let d = data << 12;
		while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
			d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18));
		}
		return (data << 12) | d;
	},
	getBCHDigit(data) {
		let digit = 0;
		while (data !== 0) {
			digit++;
			data >>>= 1;
		}
		return digit;
	},
	getPatternPosition(typeNumber) {
		return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
	},
	getMask(maskPattern, i, j) {
		switch (maskPattern) {
			case QRMaskPattern.PATTERN000:
				return (i + j) % 2 === 0;
			case QRMaskPattern.PATTERN001:
				return i % 2 === 0;
			case QRMaskPattern.PATTERN010:
				return j % 3 === 0;
			case QRMaskPattern.PATTERN011:
				return (i + j) % 3 === 0;
			case QRMaskPattern.PATTERN100:
				return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
			case QRMaskPattern.PATTERN101:
				return ((i * j) % 2) + ((i * j) % 3) === 0;
			case QRMaskPattern.PATTERN110:
				return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
			case QRMaskPattern.PATTERN111:
				return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
			default:
				throw new Error('bad maskPattern:' + maskPattern);
		}
	},
	getErrorCorrectPolynomial(errorCorrectLength) {
		let a = new QRPolynomial([1], 0);
		for (let i = 0; i < errorCorrectLength; i++) {
			a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
		}
		return a;
	},
	getLengthInBits(mode, type) {
		if (1 <= type && type < 10) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 10;
				case QRMode.MODE_ALPHA_NUM:
					return 9;
				case QRMode.MODE_8BIT_BYTE:
					return 8;
				case QRMode.MODE_KANJI:
					return 8;
				default:
					throw new Error('mode:' + mode);
			}
		} else if (type < 27) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 12;
				case QRMode.MODE_ALPHA_NUM:
					return 11;
				case QRMode.MODE_8BIT_BYTE:
					return 16;
				case QRMode.MODE_KANJI:
					return 10;
				default:
					throw new Error('mode:' + mode);
			}
		} else if (type < 41) {
			switch (mode) {
				case QRMode.MODE_NUMBER:
					return 14;
				case QRMode.MODE_ALPHA_NUM:
					return 13;
				case QRMode.MODE_8BIT_BYTE:
					return 16;
				case QRMode.MODE_KANJI:
					return 12;
				default:
					throw new Error('mode:' + mode);
			}
		} else {
			throw new Error('type:' + type);
		}
	},
	getLostPoint(qrCode) {
		const moduleCount = qrCode.getModuleCount();
		let lostPoint = 0;
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount; col++) {
				let sameCount = 0;
				const isDark = qrCode.isDark(row, col);
				for (let r = -1; r <= 1; r++) {
					const rowR = row + r;
					if (rowR < 0 || moduleCount <= rowR) {
						continue;
					}
					for (let c = -1; c <= 1; c++) {
						const colC = col + c;
						if (colC < 0 || moduleCount <= colC) {
							continue;
						}
						if (r === 0 && c === 0) {
							continue;
						}
						if (isDark === qrCode.isDark(rowR, colC)) {
							sameCount++;
						}
					}
				}
				if (sameCount > 5) {
					lostPoint += 3 + sameCount - 5;
				}
			}
		}
		for (let row = 0; row < moduleCount - 1; row++) {
			const row1 = row + 1;
			for (let col = 0; col < moduleCount - 1; col++) {
				let count = 0;
				const col1 = col + 1;
				if (qrCode.isDark(row, col)) count++;
				if (qrCode.isDark(row1, col)) count++;
				if (qrCode.isDark(row, col1)) count++;
				if (qrCode.isDark(row1, col1)) count++;
				if (count === 0 || count === 4) {
					lostPoint += 3;
				}
			}
		}
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount - 6; col++) {
				if (
					qrCode.isDark(row, col) &&
					!qrCode.isDark(row, col + 1) &&
					qrCode.isDark(row, col + 2) &&
					qrCode.isDark(row, col + 3) &&
					qrCode.isDark(row, col + 4) &&
					!qrCode.isDark(row, col + 5) &&
					qrCode.isDark(row, col + 6)
				) {
					lostPoint += 40;
				}
			}
		}
		for (let col = 0; col < moduleCount; col++) {
			for (let row = 0; row < moduleCount - 6; row++) {
				if (
					qrCode.isDark(row, col) &&
					!qrCode.isDark(row + 1, col) &&
					qrCode.isDark(row + 2, col) &&
					qrCode.isDark(row + 3, col) &&
					qrCode.isDark(row + 4, col) &&
					!qrCode.isDark(row + 5, col) &&
					qrCode.isDark(row + 6, col)
				) {
					lostPoint += 40;
				}
			}
		}
		let darkCount = 0;
		for (let col = 0; col < moduleCount; col++) {
			for (let row = 0; row < moduleCount; row++) {
				if (qrCode.isDark(row, col)) {
					darkCount++;
				}
			}
		}
		const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
		lostPoint += ratio * 10;
		return lostPoint;
	},
};
class QRMath {
	static glog(n) {
		if (n < 1) {
			throw new Error('glog(' + n + ')');
		}
		return QRMath.LOG_TABLE[n];
	}
	static gexp(n) {
		while (n < 0) {
			n += 255;
		}
		while (n >= 256) {
			n -= 255;
		}
		return QRMath.EXP_TABLE[n];
	}
	static init() {
		const expTable = new Array(256);
		const logTable = new Array(256);
		for (let i = 0; i < 8; i++) {
			expTable[i] = 1 << i;
		}
		for (let i = 8; i < 256; i++) {
			expTable[i] = expTable[i - 4] ^ expTable[i - 5] ^ expTable[i - 6] ^ expTable[i - 8];
		}
		for (let i = 0; i < 255; i++) {
			logTable[expTable[i]] = i;
		}
		QRMath.EXP_TABLE = expTable;
		QRMath.LOG_TABLE = logTable;
	}
}
QRMath.init();
class QRPolynomial {
	constructor(num, shift) {
		const numLen = num.length;
		if (numLen === undefined) {
			throw new Error(numLen + '/' + shift);
		}
		let offset = 0;
		while (offset < numLen && num[offset] === 0) {
			offset++;
		}
		const numLenOffset = numLen - offset;
		const nums = new Array(numLenOffset + shift);
		for (let i = 0; i < numLenOffset; i++) {
			nums[i] = num[i + offset];
		}
		this.num = nums;
	}
	get(index) {
		return this.num[index];
	}
	getLength() {
		return this.num.length;
	}
	multiply(e) {
		const num = this.num;
		const numLen = num.length;
		const eNum = e.num;
		const eLen = eNum.length;
		const numResult = new Array(numLen + eLen - 1);
		for (let i = 0; i < numLen; i++) {
			const numGlog = QRMath.glog(num[i]);
			for (let j = 0; j < eLen; j++) {
				const eNumGlog = QRMath.glog(eNum[j]);
				numResult[i + j] ^= QRMath.gexp(numGlog + eNumGlog);
			}
		}
		return new QRPolynomial(numResult, 0);
	}
	mod(e) {
		const num = this.num;
		const numLen = num.length;
		const eNum = e.num;
		const eLen = eNum.length;
		if (numLen - eLen < 0) {
			return this;
		}
		const ratio = QRMath.glog(num[0]) - QRMath.glog(eNum[0]);
		const numResult = new Array(numLen);
		for (let i = 0; i < numLen; i++) {
			numResult[i] = num[i];
		}
		for (let i = 0; i < eLen; i++) {
			numResult[i] ^= QRMath.gexp(QRMath.glog(eNum[i]) + ratio);
		}
		return new QRPolynomial(numResult, 0).mod(e);
	}
}
class QRRSBlock {
	constructor(totalCount, dataCount) {
		this.totalCount = totalCount;
		this.dataCount = dataCount;
	}
	static getRSBlocks(typeNumber, errorCorrectLevel) {
		const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
		if (rsBlock === undefined) {
			throw new Error('bad rs block @ typeNumber:' + typeNumber + '/errorCorrectLevel:' + errorCorrectLevel);
		}
		const length = rsBlock.length / 3;
		const rsBlocks = [];
		for (let i = 0; i < length; i++) {
			const index = i * 3;
			const count = rsBlock[index + 0];
			const totalCount = rsBlock[index + 1];
			const dataCount = rsBlock[index + 2];
			for (let j = 0; j < count; j++) {
				rsBlocks.push(new QRRSBlock(totalCount, dataCount));
			}
		}
		return rsBlocks;
	}
	static getRsBlockTable(typeNumber, errorCorrectLevel) {
		const baseErrorCollectLevel = (typeNumber - 1) * 4;
		switch (errorCorrectLevel) {
			case QRErrorCorrectLevel.L:
				return QRRSBlock.RS_BLOCK_TABLE[baseErrorCollectLevel + 0];
			case QRErrorCorrectLevel.M:
				return QRRSBlock.RS_BLOCK_TABLE[baseErrorCollectLevel + 1];
			case QRErrorCorrectLevel.Q:
				return QRRSBlock.RS_BLOCK_TABLE[baseErrorCollectLevel + 2];
			case QRErrorCorrectLevel.H:
				return QRRSBlock.RS_BLOCK_TABLE[baseErrorCollectLevel + 3];
			default:
				return undefined;
		}
	}
}
QRRSBlock.RS_BLOCK_TABLE = [
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16],
];
const QRCodeLimitLength = [
	[17, 14, 11, 7],
	[32, 26, 20, 14],
	[53, 42, 32, 24],
	[78, 62, 46, 34],
	[106, 84, 60, 44],
	[134, 106, 74, 58],
	[154, 122, 86, 64],
	[192, 152, 108, 84],
	[230, 180, 130, 98],
	[271, 213, 151, 119],
	[321, 251, 177, 137],
	[367, 287, 203, 155],
	[425, 331, 241, 177],
	[458, 362, 258, 194],
	[520, 412, 292, 220],
	[586, 450, 322, 250],
	[644, 504, 364, 280],
	[718, 560, 394, 310],
	[792, 624, 442, 338],
	[858, 666, 482, 382],
	[929, 711, 509, 403],
	[1003, 779, 565, 439],
	[1091, 857, 611, 461],
	[1171, 911, 661, 511],
	[1273, 997, 715, 535],
	[1367, 1059, 751, 593],
	[1465, 1125, 805, 625],
	[1528, 1190, 868, 658],
	[1628, 1264, 908, 698],
	[1732, 1370, 982, 742],
	[1840, 1452, 1030, 790],
	[1952, 1538, 1112, 842],
	[2068, 1628, 1168, 898],
	[2188, 1722, 1228, 958],
	[2303, 1809, 1283, 983],
	[2431, 1911, 1351, 1051],
	[2563, 1989, 1423, 1093],
	[2699, 2099, 1499, 1139],
	[2809, 2213, 1579, 1219],
	[2953, 2331, 1663, 1273],
];
class QRBitBuffer {
	constructor() {
		this.buffer = [];
		this.length = 0;
	}
	get(index) {
		const bufIndex = Math.floor(index / 8);
		return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
	}
	put(num, length) {
		for (let i = 0; i < length; i++) {
			this.putBit(((num >>> (length - i - 1)) & 1) === 1);
		}
	}
	getLengthInBits() {
		return this.length;
	}
	putBit(bit) {
		const bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
		if (bit) {
			this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
		}
		this.length++;
	}
}
class SvgDrawer {
	constructor(elm, htmlOption) {
		this.elm = elm;
		this.htmlOption = htmlOption;
	}
	draw(qrCodeData) {
		const htmlOption = this.htmlOption;
		const elm = this.elm;
		const nCount = qrCodeData.getModuleCount();
		elm.style.width = htmlOption.width + 'px';
		elm.style.height = htmlOption.height + 'px';
		const nWidth = Math.floor(htmlOption.width / nCount);
		const nHeight = Math.floor(htmlOption.height / nCount);
		this.clear();
		const attrs = { viewBox: '0 0 ' + nCount + ' ' + nCount, width: '100%', height: '100%', fill: htmlOption.colorLight };
		const svg = this.makeSVG('svg', attrs);
		svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
		elm.appendChild(svg);
		svg.appendChild(this.makeSVG('rect', { fill: htmlOption.colorLight, width: '100%', height: '100%' }));
		svg.appendChild(this.makeSVG('rect', { fill: htmlOption.colorDark, width: '1', height: '1', id: 'template' }));
		for (let rowIndex = 0; rowIndex < nCount; rowIndex++) {
			for (let colIndex = 0; colIndex < nCount; colIndex++) {
				if (qrCodeData.isDark(rowIndex, colIndex)) {
					const child = this.makeSVG('use', { x: colIndex + '', y: rowIndex + '' });
					child.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#template');
					svg.appendChild(child);
				}
			}
		}
	}
	makeSVG(tag, attrs) {
		const elm = document.createElementNS('http://www.w3.org/2000/svg', tag);
		for (const [key, value] of Object.entries(attrs)) {
			if (value) {
				elm.setAttribute(key, value);
			}
		}
		return elm;
	}
	clear() {
		while (this.elm.hasChildNodes()) {
			this.elm.removeChild(this.elm.lastChild);
		}
	}
}
class HtmlDrawer {
	constructor(elm, htmlOption) {
		this.elm = elm;
		this.htmlOption = htmlOption;
	}
	/**
	 * Draw the QRCode
	 *
	 * @param {QRCode} qrCodeData
	 */
	draw(qrCodeData) {
		const htmlOption = this.htmlOption;
		const elm = this.elm;
		const nCount = qrCodeData.getModuleCount();
		const nWidth = Math.floor(htmlOption.width / nCount);
		const nHeight = Math.floor(htmlOption.height / nCount);
		const tElm = document.createElement('table');
		tElm.style.borderWidth = 0;
		tElm.style.borderCollapse = 'collapse';
		for (let row = 0; row < nCount; row++) {
			const trElm = document.createElement('tr');
			for (let col = 0; col < nCount; col++) {
				const color = qrCodeData.isDark(row, col) ? htmlOption.colorDark : htmlOption.colorLight;
				const tdElm = document.createElement('td');
				tdElm.style.borderWidth = 0;
				tdElm.style.borderCollapse = 'collapse';
				tdElm.style.padding = 0;
				tdElm.style.margin = 0;
				tdElm.style.width = nWidth;
				tdElm.style.height = nHeight;
				tdElm.style.backgroundColor = color;
				trElm.append(tdElm);
			}
			tElm.append(trElm);
		}
		elm.append(tElm);
		// Fix the margin values as real size.
		const elTable = elm.childNodes[0];
		const nLeftMarginTable = (htmlOption.width - elTable.offsetWidth) / 2;
		const nTopMarginTable = (htmlOption.height - elTable.offsetHeight) / 2;
		if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
			elTable.style.margin = nTopMarginTable + 'px ' + nLeftMarginTable + 'px';
		}
	}
	/**
	 * Clear the QRCode
	 */
	clear() {
		while (this.elm.hasChildNodes()) {
			this.elm.removeChild(this.elm.lastChild);
		}
	}
}
class CanvasDrawer {
	/**
	 * Drawing QRCode by using canvas
	 *
	 * @constructor
	 * @param {HTMLElement} elm
	 * @param {Object} htmlOption QRCode Options
	 */
	constructor(elm, htmlOption) {
		this.htmlOption = htmlOption;
		this.canvasElm = document.createElement('canvas');
		this.canvasElm.width = htmlOption.width;
		this.canvasElm.height = htmlOption.height;
		this.canvasElm.style.position = 'absolute';
		this.canvasElm.style.top = htmlOption.height * -1;
		elm.appendChild(this.canvasElm);
		this.elm = elm;
		this.ctx = this.canvasElm.getContext('2d');
		this.imgElm = document.createElement('img');
		this.imgElm.alt = 'Scan me!';
		this.imgElm.style.display = 'none';
		this.elm.appendChild(this.imgElm);
	}
	/**
	 * Draw the QRCode
	 *
	 * @param {QRCode} qrCodeData
	 */
	draw(qrCodeData) {
		const htmlOption = this.htmlOption;
		this.canvasElm.width = htmlOption.width;
		this.canvasElm.height = htmlOption.height;
		const imgElm = this.imgElm;
		const ctx = this.ctx;
		const nCount = qrCodeData.getModuleCount();
		const nWidth = htmlOption.width / nCount;
		const nHeight = htmlOption.height / nCount;
		const nRoundedWidth = Math.round(nWidth);
		const nRoundedHeight = Math.round(nHeight);
		imgElm.style.display = 'none';
		this.clear();
		for (let rowIndex = 0; rowIndex < nCount; rowIndex++) {
			for (let colIndex = 0; colIndex < nCount; colIndex++) {
				const isDark = qrCodeData.isDark(rowIndex, colIndex);
				const nLeft = colIndex * nWidth;
				const nTop = rowIndex * nHeight;
				ctx.strokeStyle = isDark ? htmlOption.colorDark : htmlOption.colorLight;
				ctx.lineWidth = 1;
				ctx.fillStyle = isDark ? htmlOption.colorDark : htmlOption.colorLight;
				ctx.fillRect(nLeft, nTop, nWidth, nHeight);
				ctx.strokeRect(Math.floor(nLeft) + 0.5, Math.floor(nTop) + 0.5, nRoundedWidth, nRoundedHeight);
				ctx.strokeRect(Math.ceil(nLeft) - 0.5, Math.ceil(nTop) - 0.5, nRoundedWidth, nRoundedHeight);
			}
		}
		this.imgElm.src = this.canvasElm.toDataURL('image/png');
		this.imgElm.style.display = 'block';
		this.canvasElm.style.display = 'none';
	}
	/**
	 * Clear the QRCode
	 */
	clear() {
		this.ctx.clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
		this.imgElm.style.display = 'none';
	}
}
/**
 * @class QRCode
 * @constructor
 * @example
 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
 *
 * @example
 * var qrCodeData = new QRCode("test", {
 *    text : "http://naver.com",
 *    width : 128,
 *    height : 128
 * });
 *
 * qrCodeData.clear(); // Clear the QRCode.
 * qrCodeData.makeCode("http://map.naver.com"); // Re-create the QRCode.
 *
 * @param {HTMLElement|String} el target element or 'id' attribute of element.
 * @param {Object|String} vOption
 * @param {String} vOption.text QRCode link data
 * @param {Number} [vOption.width=256]
 * @param {Number} [vOption.height=256]
 * @param {String} [vOption.colorDark="#000000"]
 * @param {String} [vOption.colorLight="#ffffff"]
 * @param {QRErrorCorrectLevel} [vOption.correctLevel=QRErrorCorrectLevel.H] [L|M|Q|H]
 */
export class QRCode {
	constructor(elm, vOption = {}) {
		this.htmlOption = {
			width: 256,
			height: 256,
			colorDark: '#000000',
			colorLight: '#ffffff',
			correctLevel: QRErrorCorrectLevel.H,
		};
		if (typeof vOption === 'string') {
			vOption = {
				text: vOption,
			};
		}
		// Overwrites options
		if (vOption) {
			for (let i in vOption) {
				this.htmlOption[i] = vOption[i];
			}
		}
		const elment = typeof elm === 'string' ? document.getElementById(elm) : elm;
		const DrawingClass = this.htmlOption.useSVG ? SvgDrawer : this.htmlOption.useHtml ? HtmlDrawer : CanvasDrawer;
		this.elm = elment;
		this.drawer = new DrawingClass(elment, this.htmlOption);
		if (this.htmlOption.text) {
			this.makeCode(this.htmlOption.text);
		}
	}
	/**
	 * Make the QRCode
	 *
	 * @param {String} sText link data
	 */
	makeCode(sText) {
		const correctLevel = this.htmlOption.correctLevel;
		const qrCodeData = new QRCodeModel(this._getTypeNumber(sText, correctLevel), correctLevel);
		qrCodeData.addData(sText);
		qrCodeData.make();
		this.elm.title = sText;
		this.drawer.draw(qrCodeData);
		this.makeImage();
	}
	/**
	 * Get the type by string length
	 *
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	_getTypeNumber(sText, nCorrectLevel) {
		let nType = 1;
		const limit = QRCodeLimitLength.length;
		const length = this._getUTF8Length(sText);
		for (let i = 0; i <= limit; i++) {
			let nLimit = 0;
			const limitLen = QRCodeLimitLength[i];
			switch (nCorrectLevel) {
				case QRErrorCorrectLevel.L:
					nLimit = limitLen[0];
					break;
				case QRErrorCorrectLevel.M:
					nLimit = limitLen[1];
					break;
				case QRErrorCorrectLevel.Q:
					nLimit = limitLen[2];
					break;
				case QRErrorCorrectLevel.H:
					nLimit = limitLen[3];
					break;
			}
			if (length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}
		if (nType > limit) {
			throw new Error('Too long data');
		}
		return nType;
	}
	_getUTF8Length(sText) {
		const replacedText = encodeURI(sText)
			.toString()
			.replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length !== sText ? 3 : 0);
	}
	/**
	 * Make the Image from Canvas element
	 * - It occurs automatically
	 * - Android below 3 doesn't support Data-URI spec.
	 *
	 * @private
	 */
	makeImage() {
		if (typeof this.drawer.makeImage === 'function') {
			this.drawer.makeImage();
		}
	}
	/**
	 * reset size of the QRCode
	 * @param {Number} [vOption.width=256]
	 * @param {Number} [vOption.height=256]
	 */
	setSize(width = 256, height = 256) {
		this.htmlOption.width = width;
		this.htmlOption.height = height;
	}
	/**
	 * reset color of the QRCode
	 * @param {String} [vOption.colorDark="#000000"]
	 * @param {String} [vOption.colorLight="#ffffff"]
	 */
	setColor(colorDark = '#000000', colorLight = '#ffffff') {
		this.htmlOption.colorDark = colorDark;
		this.htmlOption.colorLight = colorLight;
	}
	/**
	 * reset recorrectLeve of the QRCode
	 * @param {QRErrorCorrectLevel} [vOption.correctLevel=QRErrorCorrectLevel.H] [L|M|Q|H]
	 */
	setCorrectLevel(correctLevel = QRErrorCorrectLevel.H) {
		if (typeof correctLevel === 'string') {
			if (correctLevel === 'H') {
				this.htmlOption.correctLevel = QRErrorCorrectLevel.H;
			} else if (correctLevel === 'Q') {
				this.htmlOption.correctLevel = QRErrorCorrectLevel.Q;
			} else if (correctLevel === 'M') {
				this.htmlOption.correctLevel = QRErrorCorrectLevel.M;
			} else if (correctLevel === 'L') {
				this.htmlOption.correctLevel = QRErrorCorrectLevel.L;
			}
		} else {
			this.htmlOption.correctLevel = correctLevel;
		}
	}
	/**
	 * Clear the QRCode
	 */
	clear() {
		this.drawer.clear();
	}
}
export class HtmlQRCode extends QRCode {
	constructor(elm, text = 'HtmlQRCode', width = 256, height = 256, colorDark = '#000000', colorLight = '#ffffff', correctLevel = QRErrorCorrectLevel.H) {
		super(elm, { text, width, height, colorDark, colorLight, correctLevel, useHtml: true });
	}
}
export class SvgQRCode extends QRCode {
	constructor(elm, text = 'SvgQRCode', width = 256, height = 256, colorDark = '#000000', colorLight = '#ffffff', correctLevel = QRErrorCorrectLevel.H) {
		super(elm, { text, width, height, colorDark, colorLight, correctLevel, useSVG: true });
	}
}
export class CanvasQRCode extends QRCode {
	constructor(elm, text = 'CanvasQRCode', width = 256, height = 256, colorDark = '#000000', colorLight = '#ffffff', correctLevel = QRErrorCorrectLevel.H) {
		super(elm, { text, width, height, colorDark, colorLight, correctLevel });
	}
}
