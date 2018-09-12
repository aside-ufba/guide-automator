var __fs = require("fs");
const {
	VM
} = require('vm2');
var __gm = require('gm').subClass({
	imageMagick: true
});
var __webdriver = require('selenium-webdriver'),
	__by = require('selenium-webdriver').By,
	__until = require('selenium-webdriver').until;

var __Driver = null;

var __DEFAULT_IMG_WIDTH = '60%';
var __imgCount = 0;
var __returnGuideAutomator = "";
var __DefaultContext = true;
var GDGLOBAL = {}

var options = {
	output: "",
	outlineStyle: "solid blue 3px",
	debug: false,
	autosleep: 1000,
	browser: null,
	headless: false,
	window: null,
	outlineOff: "solid blue 0px"

};

var listOfHighlights = [];


var GD = {
	get driver() {
		if (__Driver == null) {
			let __chrome = require('selenium-webdriver/chrome');
			let __co = new __chrome.Options();

			if (options.headless) {
				__co.addArguments(['--headless', '--disable-gpu']);
				console.log('You may need to set up --browser=<path/to/chrome-canary> for headless to work.');
			}
			if (options.browser) {
				__co.setChromeBinaryPath(options.browser);
			}

			__Driver = new __webdriver.Builder()
				.forBrowser('chrome')
				.setChromeOptions(__co)
				.build();

			if (options.window) {
				let dimensions = options.window.split(/[xX+]/);
				if (dimensions.length >= 2) {
					__Driver.manage().window().setSize(+dimensions[0], +dimensions[1]);
					if (dimensions.length >= 4) {
						__Driver.manage().window().setPosition(+dimensions[2], +dimensions[3]);
					}
				} else {
					console.error('Invalid dimensions:', options.window);
				}
			}
		}
		return __Driver;
	},
	get until() {
		return __until;
	},
	get by() {
		return __by;
	}
};

module.exports = {
	defineOptions: defineOptions,
	getReturn: getReturn,
	quit: quit,
	executeExternFunction: executeExternFunction
};

var sandbox = {
	GD: GD,
	get: get,
	takeScreenshot: takeScreenshot,
	takeScreenshotOf: takeScreenshotOf,
	highlight: highlight,
	removeHighlight: removeHighlight,
	removeAllHighlights: removeAllHighlights,
	fillIn: fillIn,
	submit: submit,
	click: click,
	clickByLinkText: clickByLinkText,
	sleep: sleep,
	wait: wait,
	quit: quit,
	getReturn: getReturn,
	console: console,
	pageContext: pageContext,
	GDGLOBAL: GDGLOBAL
};

function setReturn(msg) {
	__returnGuideAutomator += "\n" + msg + "\n";
}
/**
 * Print text on manual
 * @param {string}
 */
console.print = setReturn;

//Internal function to eval external code
function executeExternFunction(ExternFunction) {
	const vm = new VM({
		sandbox: sandbox
	});
	var res = vm.run(ExternFunction);
}

function getReturn() {
	var aux = __returnGuideAutomator;
	__returnGuideAutomator = "";
	return aux;
}

function defineOptions(arg) {
	Object.keys(options).forEach(function(key) {
		options[key] = arg[key] || options[key];
	});
}

/**
 * Acessa o site
 * @param  {string} url Site a ser acessado
 * @return {none}
 */
function get(url) {
	GD.driver.get(url);
}

/**
 * Tira foto da parte visivel do site acessado
 * @return {string}   Nome da imagem gerada
 */
function takeScreenshot(width) {
	__imgCount++;
	width = width || __DEFAULT_IMG_WIDTH;
	var localImageName = __imgCount; //Tratamento devido procedimentos async

	sleep(options.autosleep);
	if (options.debug)
		console.time("Screenshot " + localImageName);
	
	GD.driver.takeScreenshot().then(
		function(image, err) {
			if (err) {
				throw err;
			} else {
				__fs.writeFile(options.output + '/' + localImageName + '.png', image, 'base64', function(err) {
					if (err)
						throw err;

					if (options.debug)
						console.timeEnd("Screenshot " + localImageName);
				});
			}
		}
	);
	removeAllHighlights();
	setReturn('![](' + __imgCount + '.png =' + width + 'x*)');

}

/**
 * Highlights an HTML element by adding a blue outline.
 * @param  {string} cssSelector Element's CSS selector. It can also be an array of CSS selectors for multiple highlights.
 */
function highlight(cssSelector) {
	var cssSelectors;
	if (cssSelector.constructor === Array) {
		cssSelectors = cssSelector;
		cssSelector = cssSelectors[0];
	}

	listOfHighlights.push(cssSelector);

	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {

		GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineStyle + "'", el);
		if (cssSelectors) {
			cssSelectors.forEach(element => {

				if (element.constructor === Array) {
					pageContext(element[1].toString());
					element = element[0];
				} else if (!__DefaultContext) {
					pageContext();
				}

				GD.driver.findElement(GD.by.css(element)).then(function(el1) {
					GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineStyle + "'", el1);
				}, ownFunctionException);
			});
		}
	}, ownFunctionException);
}
/**
* Remove the highlight of an HTML element.
* @param  {string} cssSelector Element's CSS selector. It can also be an array of CSS selectors for multiple highlights.
* options.outlineOff : solid red 0 px
 */
function removeHighlight(cssSelector){
	var cssSelectors;
	if (cssSelector.constructor === Array) {
		cssSelectors = cssSelector;
		cssSelector = cssSelectors[0];
	}
	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineOff + "'", el);
		if (cssSelectors) {
			cssSelectors.forEach(element => {

				if (element.constructor === Array) {
					pageContext(element[1].toString());
					element = element[0];
				} else if (!__DefaultContext) {
					pageContext();
				}

				GD.driver.findElement(GD.by.css(element)).then(function(el1) {
					GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineOff + "'", el1);
				}, ownFunctionException);
			});
		}
	}, ownFunctionException);
}

/**
* Remove all the highlights of the screen.
*
*/

function removeAllHighlights (){
	for (selector of listOfHighlights){
		removeHighlight(selector);
	}
	/** After all, clean the array */
	listOfHighlights = [];
}

/**
 * Tira foto do cssSelector passado, podendo dar crop ou highlight
 * @param  {string} cssSelector Css selector do DOM
 * @param  {int} crop        [Opicional] 1 - crop ativo, 0 - crop inativo
 * @param  {int} outline     [Opicional] 1 - outline ativo, 0 - outline inativo
 * @return {string}             Nome da imagem gerada
 */
function takeScreenshotOf(cssSelector, crop, outline, width) {
	var cssSelectors;
	//Multiplos elementos
	if (cssSelector.constructor === Array) {
		cssSelectors = cssSelector;
		cssSelector = cssSelectors[0];
	}
	__imgCount++;
	width = width || __DEFAULT_IMG_WIDTH;
	var localImageName = __imgCount; //Tratamento devido procedimentos async

	sleep(options.autosleep);
	if (options.debug)
		console.time("ScreenshotOF " + localImageName);


	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		if (outline) {
			GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineStyle + "'", el);
			if (cssSelectors) {
				cssSelectors.forEach(element => {

					//Contexto Diferentes
					if (element.constructor === Array) {
						pageContext(element[1].toString());
						element = element[0];
					} else if (!__DefaultContext)
						pageContext();
					//Se não foi definido um contexto e ele está em outro contexto, volte para o default

					GD.driver.findElement(GD.by.css(element)).then(function(el1) {
						GD.driver.executeScript("arguments[0].style.outline = '" + options.outlineStyle + "'", el1);
					}, ownFunctionException);
				});
			}
		}
		GD.driver.executeScript("arguments[0].scrollIntoView()", el);
		GD.driver.executeScript("return arguments[0].getBoundingClientRect()", el).then(function(rect) {

			/** Wait one second!  */
			sleep(options.autosleep);
			GD.driver.takeScreenshot().then(
				function(image, err) {
					if (outline) {
						GD.driver.executeScript("arguments[0].style.outline = ''", el);
						if (cssSelectors) {
							cssSelectors.forEach(element => {
								GD.driver.findElement(GD.by.css(element)).then(function(el1) {
									GD.driver.executeScript("arguments[0].style.outline = ''", el1);
								}, ownFunctionException);
							});
						}
					}
					if (crop) {
						var img = new Buffer(image, 'base64');
						__gm(img)
							.crop(rect.width, rect.height, rect.left, rect.top)
							.write(options.output + '/' + localImageName + '.png', function(err) {
								if (err)
									throw err;

								if (options.debug)
									console.timeEnd("ScreenshotOF " + localImageName);
							});
					} else {
						__fs.writeFile(options.output + '/' + localImageName + '.png', image, 'base64', function(err) {
							if (err)
								throw err;

							if (options.debug)
								console.timeEnd("ScreenshotOF " + localImageName);
						});
					}
				}
			);
		});
	}, ownFunctionException);
	removeAllHighlights();
	setReturn('![](' + __imgCount + '.png =' + width + 'x*)');

}

/**
 * Preenche infomações de um determinado campo
 * @param  {string} cssSelector css selector do DOM desejado
 * @param  {string} text        Texto que será escrito no campo
 * @return {none}
 */
function fillIn(cssSelector, text) {
	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		el.clear();
	}, ownFunctionException);
	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		el.sendKeys(text);
	}, ownFunctionException);
}

function getText(cssSelector) {
	var textResult = "";
	/*
	// Need to fix Async's call
	driver.findElement(By.css(cssSelector)).getText()
		.then(function(text) {
			textResult = text;
		});
	*/

	return textResult;
}

/**
 * Faz o submit no cssSelector
 * @param  {string} cssSelector css Selector do DOM desejado
 * @return {none}
 */
function submit(cssSelector) {
	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		el.submit();
	}, ownFunctionException);
}

/**
 * Clica em um determinado DOM
 * @param  {string} cssSelector css Selector do DOM desejado
 * @return {none}
 */
function click(cssSelector) {
	GD.driver.findElement(GD.by.css(cssSelector)).then(function(el) {
		el.click();
	}, ownFunctionException);
}

/**
 * Clica em um determinado elemento utilizando o nome do linkText
 * @param  {string} text Texto a ser buscado nos links da interface
 * @return {none}
 */
function clickByLinkText(text) {
	GD.driver.findElement(GD.by.linkText(text)).then(function(el) {
		el.click();
	}, ownFunctionException);
}

/**
 * Faz o driver parar por um tempo solicitado
 * @param  {int} sleepTime tempo em milisegundos para sleep
 * @return {none}
 */
function sleep(sleepTime) {
	GD.driver.sleep(parseInt(sleepTime));
}

/**
 * Aguarda até um elemento da tela carregar ou até o limite de tempo
 * @param  {string} cssSelector css Selector do DOM desejado
 * @param  {int} timeOut     [Opicional]Tempo em milisegundo, default = 5000
 * @return {none}
 */
function wait(cssSelector, timeOut) {
	var timeLimit = timeOut || 5000;
	GD.driver.wait(GD.until.elementLocated(GD.by.css(cssSelector)), timeLimit)
		.catch(ownFunctionException);
}

function pageContext(cssSelector) {
	if (!cssSelector || cssSelector.toString().toLowerCase() === 'default') {
		GD.driver.switchTo().defaultContent();
		__DefaultContext = true;
	} else {
		GD.driver.switchTo().frame(GD.driver.findElement(GD.by.css(cssSelector)))
			.catch(ownFunctionException);
		__DefaultContext = false;
	}
}

function quit() {
	return GD.driver.quit();
}

//---AUX Functions
function ownFunctionException(err) {
	quit();

	setTimeout(function() {
		throw err;
	}, 50);
}
