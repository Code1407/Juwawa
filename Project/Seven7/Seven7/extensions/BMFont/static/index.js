const { join, basename } = require('path');
const { createApp, ref } = Vue;
const { ipcRenderer } = require('electron');
const { writeFileSync } = require("fs");
const { name } = require('../package.json');

class BMFontChar {

    _char = "";
    _x = 0;
    _y = 0;
    _width = 0;
    _height = 0;
	_path = "";
	_image;

    get char() {
        return this._char;
    }

    set char(value) {
        this._char = value;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }

    get path() {
        return this._path;
    }

    set path(value) {
        this._path = value;
    }

    get image() {
        return this._image;
    }

    set image(value) {
        this._image = value;
    }

}

class BMFont {

    _charList = [];
    _font = "Arial";
    _fontSize = 1;
    _canvasWidth = 256;
    _canvasHeight = 256;
    _xSpace = 1;
    _ySpace = 1;

    _maxCharHeight = 0;
    _xStart = 0;
    _yStart = 0;

    constructor(list) {
        this._charList = [];
        list.forEach(el => {
            const chr = new BMFontChar();
			chr.char = el.basename;
            chr.path = el.path || "";
            chr.width = el.width || 0;
            chr.height = el.height || 0;
            chr.x = 0;
			chr.y = 0;
			chr.image = el.image;
			
			this._charList.push(chr);
		});

		for (let i = 0; i < this._charList.length - 1; i++) {
			for (let j = i; j < this._charList.length; j++) {
				const c1 = this._charList[i].char.charCodeAt(0);
				const c2 = this._charList[j].char.charCodeAt(0);
				if (c1 > c2) {
					const temp = this._charList[i];
					this._charList[i] = this._charList[j];
					this._charList[j] = temp;
				}
			}
		}
	}
	
	initImageData() {
        this._maxCharHeight = this.getMaxCharHeight();
        this._fontSize = this._maxCharHeight;
		
		const canvasSize = this.getCanvasSize();
		this._canvasWidth = canvasSize.width;
		this._canvasHeight = canvasSize.height;
	}

	getMaxCharHeight() {
		let height = 0;
		this._charList.forEach(el => {
			if (el.height > height) {
				height = el.height;
			}
		});
		return height;
	}

	getCanvasSize() {
        let sizeList = new Array();
        for (let i = 6; i < 12; i++) {
            sizeList.push(Math.pow(2, i));
        }

		let canvasSize = { width: 512, height: 512};
        for (let i = 0; i < sizeList.length; i++) {
            let size = this._testCanvasSize(sizeList[i]);
			if (size.width >= size.height) {
				canvasSize = { width: size.width, height: size.height };
                break;
            }
		}
		return canvasSize;
	}

    _testCanvasSize (newWidth) {
        let w = this._xStart;
        let h = this._yStart;

        let x = this._xStart;
        let y = this._yStart;

        let map = new Array();
        let arr = null;
        for (let i = 0; i < this._charList.length; i++) {
            if (arr == null) {
                arr = new Array();
            }

            let char = this._charList[i];

            // console.log(w+this._xSpace+char.getWidth())
            if (w + this._xSpace + char.width >= newWidth) {
                map.push(arr);
                arr = new Array();
                arr.push(char);
                w = this._xStart + this._xSpace + char.width;
            } else {
                arr.push(char);
                w = w + this._xSpace + char.width;
            }

            if (i == this._charList.length - 1) {
                map.push(arr);
            }
        }

        for (let row = 0; row < map.length; row++) {
            let x = 0;
            let y = this._yStart + this._maxCharHeight * row + this._ySpace * row;
            for (let col = 0; col < map[row].length; col++) {
                let char = map[row][col];
                if (col == 0) {
                    x = this._xStart;
                } else {
                    x = x + map[row][col - 1].width + this._xSpace
                }
                // console.log("x = ", x, "y = ", y);
				char.x = x;
				char.y = y;
            }
        }

        let height = this._yStart + map.length * this._maxCharHeight + (map.length - 1) * this._ySpace;
        let newHeight = height;
        for (let i = 1; i <= 12; i++) {
            if (height <= Math.pow(2, i)) {
                newHeight = Math.pow(2, i);
                break;
            }
        }

        return {width: newWidth, height: newHeight};
    }


    save(filePath, callback) {
        if (!filePath) {
            console.warn("路径为空，保存失败");
            return
        }
		
		this.initImageData();

		const pngPath = filePath.replace("fnt", "png");
		const fileName = basename(pngPath);
        const headerStr = `info face="${this._font}" size=${this._fontSize} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=${this._xSpace},${this._ySpace} outline=0`;
        const commonStr = `common lineHeight=${this._fontSize} base=${this._fontSize} scaleW=${this._canvasWidth} scaleH=${this._canvasHeight} pages=1 packed=0`;
		const pageStr = `page id=0 file="${fileName}"`
		const charStr = `chars count=${this._charList.length}`;
		const charStrList = [];

        this._charList.forEach(chr => {
			const charCode = chr.char.charCodeAt(0);
			const str = `char id=${charCode} x=${chr.x} y=${chr.y} width=${chr.width} height=${chr.height} xoffset=0 yoffset=0 xadvance=${chr.width} page=0 chnl=15`;
			charStrList.push(str);
		});

		const charListStr = charStrList.join("\n");

		const content = `${headerStr}\n${commonStr}\n${pageStr}\n${charStr}\n${charListStr}`;
		// 写fnt文件
		writeFileSync(filePath, content);
        // 生成canvas
		const canvas = document.createElement("canvas");
		canvas.width = this._canvasWidth;
		canvas.height = this._canvasHeight;

		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}
		context.fillStyle = "rgba(255, 255, 255, 0)";
		// 画图片
		this._charList.forEach(chr => {
			if (chr.image) {
				context.drawImage(chr.image, chr.x, chr.y);
			}
		});
		
		// 写图片文件
        let dataUrl = canvas.toDataURL();
		let result = dataUrl.match(/^data:(image\/.+);base64,(.*)/);
		if (!result) {
			return;
		}
		let [_src, _type, base64] = result;
        if (pngPath) {
            var dataBuffer = Buffer.from(base64, 'base64');
			writeFileSync(pngPath, dataBuffer);
            typeof callback == 'function' && callback();
        }
	}

}

const app = createApp({
	setup() {

        const urlSearchParams = new URLSearchParams(window.location.search);
        const projectPath = decodeURIComponent(urlSearchParams.get('projectPath'));

		const list = ref([]);
		const isBtnSaveDisabled = ref(true);

		const refreshView = () => {
			isBtnSaveDisabled.value = list.value.length <= 0;
		}

		const onDropCallback = (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			const files = evt.dataTransfer?.files || [];

			list.value = list.value || [];

			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				if (file.type == "image/png") {
					let basename = file.name.split(".")[0];
					if (basename == "逗号" || basename == "，") {
						basename = ",";
					} else if (basename == "点" || basename == "。") {
						basename = ".";
					} else if (basename == "冒号" || basename == "：") {
						basename = ":";
					} else if (basename == "分号" || basename == "；") {
						basename = ";";
					}
					if (basename === '') {
						basename = '.';
					}
					const obj = {
						path: file.path,
						name: file.name,
						basename: basename,
					};
					list.value.push(obj);
				}
			}

			refreshView();
		}

		const onImageLoaded = (event, row) => {
			const image = event.target;

			for (let idx = 0; idx < list.value.length; idx++) {
				if (list.value[idx].name != row.name) {
					continue;
				}
				list.value[idx].width = image.width;
				list.value[idx].height = image.height;
				list.value[idx].image = image;
	
				var baseW = 35;
				var baseH = 35;
				var originWidth = image.width;
				var originHeight = image.height;
				var scacle = Math.min(baseW / originWidth, baseH / originHeight);
				image.width = originWidth * scacle;
				image.height = originHeight * scacle;
			}
		}

		const onBtnSaveClicked = async () => {
			// 保存
			const path = await ipcRenderer.invoke(`${name}:open-dialog`, {
				title: '保存BMFont',
				defaultPath: join(projectPath, "assets"),
				filters: [
					{ name: 'BMFont', extensions: ['fnt'] },
				],
			});

			if (!path) {
				return;
			}

			if (path.trim() == '') {
				return;
			}

			const font = new BMFont(list.value);
			font.save(path, () => {
				ElementPlus.ElMessageBox.alert("保存成功").catch(null);
			});
		}

		const onBtnClearClicked = () => {
			list.value = [];
			refreshView();
		}

		const onBtnRemoveClicked = (row) => {
			// 移除项
			for (let i = 0; i < list.value.length; i++) {
				if (list.value[i].name == row.name) {
					list.value.splice(i, 1);
					break;
				}
			}
			if (list.value.length == 0) {
				refreshView();
			}
		}

		return {
			// 变量
			list,
			isBtnSaveDisabled,
			// 方法
			onBtnSaveClicked,
			onBtnClearClicked,
			onBtnRemoveClicked,
			onDropCallback,
			onImageLoaded,
		}
	},
	mounted() {

	}
});
app.use(ElementPlus).mount('#app');