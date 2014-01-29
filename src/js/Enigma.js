var Enigma = function (element) {
    // basic environment
    this.element = element;
    this.playing = false;
    this.writing = true;
    this.time = +new Date();
    this.letters = 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z'.split(',');

    // button properties
    this.buttonPressLength = 300;

    // creates canvases and buttons
    this.prepareElements();

    // attaches event listeners
    this.prepareEventListeners();

    // activate awesome mode
    this.element.className = 'awesome';

    // text content
    this.lines = ['DATA:IMAGE/PNG;BASE64,'];
    this.queue = [];
    this.nextLetterAppend = 3000;

    // blinking text cursor
    this.cursorVisible = true;
    this.nextCursorChange = 200;
    this.cursorInterval = 300;

    // base rendering settings and font properties
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.fillStyle = '#b37b4e';
    this.baseY = 33;
    this.baseX = 25;
    this.scrollY = 0;
    this.lineHeight = 14;
    this.scrollSpeed = 30;
    this.maxWidth = 170;
    this.maxLines = 2;

    // words
    this.nextWord = 15000;
    this.wordInterval = 15000;
    this.words = ['p,i,f,f,l,e', 'c,s,s,/,h,a,t', 'e,n,i,g,m,a', 'b,y,/,m,a,r,e,k', 't,h,i,s,/,i,s,/,n,o,t,/,r,a,n,d,o,m', 'l,o,l', 'o,m,g', 'b,a,s,e,6,4', ',,,,,,,,,,,,,,l,o,l,,,,,,/,l,a,g,,,,', 'w,t,f', 'd,a,f,u,q,?', 'j,a,n,/,p,a,l,o,u,n,e,k', 'j,a,n,/,p,a,l,o,u,n,e,k', 'j,a,n,/,p,a,l,o,u,n,e,k', 'j,a,n,/,p,a,l,o,u,n,e,k', 'p,e,t,r,/,b,r,z,e,k', 'h,e,l,l,o,/,I,a,m,/,v,u'];
    this.wordSeparator = '/';

    // text container
    this.textContainer = [];
    this.database = new Firebase('https://getenigma64.firebaseIO.com/');
};

/**
* Creates elements for Enigma. Canvases for display and reflection and buttons.
*
* @method prepareElements
*/
Enigma.prototype.prepareElements = function () {
    // buttons
    this.buttonsContainer = document.createElement('div');
    this.buttons = {};
    for (var i = 0, ii = this.letters.length; i < ii; ++i) {
        this.buttons[this.letters[i]] = document.createElement('span');
        this.buttons[this.letters[i]].className = this.letters[i].toLowerCase();
        this.buttons[this.letters[i]].innerHTML = '<b></b>';
        this.buttonsContainer.appendChild(this.buttons[this.letters[i]]);
    }
    this.element.appendChild(this.buttonsContainer);

    // main display canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 218;
    this.canvas.height = 58;
    this.canvas.className = 'display';
    this.ctx = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    // reflection canvas
    this.reflection = document.createElement('canvas');
    this.reflection.width = 218;
    this.reflection.height = 58;
    this.reflection.className = 'reflection';
    this.reflectionCtx = this.reflection.getContext('2d');
    this.element.appendChild(this.reflection);

    // blinking LED
    var led = document.createElement('span');
    led.className = 'led';
    this.element.appendChild(led);
};

/**
* Attaches event listeners.
*
* @method prepareEventListeners
*/
Enigma.prototype.prepareEventListeners = function () {
    var that = this,
        addLetter = null;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 250 && that.playing) {
            that.stop();
        }
        if (window.scrollY < 250 && !that.playing) {
            that.start();
        }
    }, false);
    window.addEventListener('resize', function () {
        if (window.innerWidth < 800 && that.playing) {
            that.stop();
        }
        if (window.innerWidth > 799 && !that.playing) {
            that.start();
        }
    }, false);
    document.addEventListener('keydown', function (e) {
        var letter = String.fromCharCode(e.which),
            inputTest = /[a-zA-Z0-9 ]/ig;

        // Check if input is not bulshit
        if (inputTest.test(letter)) {
            that.textContainer.push(letter);
        }
        clearTimeout(addLetter);
        addLetter = setTimeout(function () {
            var text = that.textContainer.join('');
            try {
                if (text.length > 1) that.database.push({text: text[0].toUpperCase() + text.slice(1).toLowerCase() + '. '});
            } 
            catch (e) {}     
            that.textContainer.length = 0;
        }, 3000);
        
        if (that.buttons[letter]) {
            that.buttonDown(letter);
            that.appendLetter(letter);
        } else if (e.which === 32) {
            that.appendLetter('/');
            if (that.preventScroll) e.preventDefault();
        } else if (e.which === 13) {
            if (that.lines[that.lines.length - 1].replace('_', '') !== '') {
                that.lines.push('');
            }
        }
    }, false);
    document.addEventListener('keyup', function (e) {
        var letter = String.fromCharCode(e.which);
        if (that.buttons[letter]) {
            that.buttonUp(letter);
        }
    }, false);
    this.element.addEventListener('mouseover', function () {
        that.writing = false;
        that.preventScroll = true;
    }, false);
    this.element.addEventListener('mouseout', function () {
        that.writing = true;
        that.preventScroll = false;
    }, false);
    this.element.addEventListener('mousedown', function (e) {
        var btn = e.target;
        if (btn.tagName === 'B') {
            btn = btn.parentElement;
        }
        if (btn.tagName === 'SPAN') {
            that.appendLetter(btn.className.substr(0, 1).toUpperCase());
        }
    }, false);
    window.addEventListener('blur', function () {
        that.stop();
    }, false);
    window.addEventListener('focus', function () {
        that.start();
    }, false);
};

/**
* Starts function and rendering loop.
*
* @method start
*/
Enigma.prototype.start = function () {
    this.playing = true;
    this.loop();
};

/**
* Stops function and rendering loop.
*
* @method stop
*/
Enigma.prototype.stop = function () {
    this.playing = false;
};

/**
* Function and rendering loop.
*
* @method loop
* @param {Integer} time Current time
*/
Enigma.prototype.loop = function (time) {
    if (this.playing) {
        var that = this;
        requestAnimationFrame(function (time) {
            that.loop(time);
        });

        var delta = time ? time - this.time : 0;
        this.time = time;
        this.update(delta);
        this.render();
    }
};

/**
* Computes if given line will fit on our display line.
*
* @method willFit
* @param {String} line Line of text
* @return {Bool} Returns true when line fits
*/
Enigma.prototype.willFit = function (line) {
    var dimensions = this.ctx.measureText(line);
    return dimensions.width < this.maxWidth;
};

/**
* Appends a letter on display.
*
* @method appendLetter
* @param {String} letter A letter
*/
Enigma.prototype.appendLetter = function (letter) {
    var lastLine = this.lines[this.lines.length - 1];
    if (this.willFit(lastLine + letter)) {
        this.lines[this.lines.length - 1] += letter;
    } else {
        this.lines.push(letter);
    }
};

/**
* Pushes a letter and automaticaly lifts it up
*
* @method pushButton
* @param {String} letter A letter of button
*/
Enigma.prototype.pushButton = function (letter) {
    this.buttonDown(letter);
    var that = this;
    setTimeout(function () {
        that.buttonUp(letter);
    }, this.buttonPressLength);
};

/**
* Pushes the button down
*
* @method buttonDown
* @param {String} letter A letter of button
*/
Enigma.prototype.buttonDown = function (letter) {
    var btn = this.buttons[letter];
    if (btn) {
        btn.className += ' down';
        if (!this.writing) {
            this.element.className += ' pressed';
        }
    }
};

/**
* Lifts the button up
*
* @method buttonDown
* @param {String} letter A letter of button
*/
Enigma.prototype.buttonUp = function (letter) {
    var btn = this.buttons[letter];
    if (btn) {
        btn.className = btn.className.replace(/ down/g, '');
        this.element.className = this.element.className.replace(/ pressed/g, '');
    }
};

/**
* Logical part of animation loop. Computes lines of text, may append letter.
*
* @method update
* @param {Integer} delta Delta between this time and last time loop was called in miliseconds
*/
Enigma.prototype.update = function (delta) {
    // first run
    delta = delta || 0;

    // text cursor cleanup
    for (var i = 0, ii = this.lines.length; i < ii; ++i) {
        this.lines[i] = this.lines[i].replace('_', '');
    }

    // letter appending
    if (this.writing) {
        this.nextLetterAppend -= delta;
        if (this.nextLetterAppend < 0) {
            this.nextLetterAppend = 100 + Math.random() * 300;
            var nextLetter = this.queue.length ? this.queue.shift() : this.letters[Math.floor(this.letters.length * Math.random())];
            this.appendLetter(nextLetter);
            this.pushButton(nextLetter);
        }
    }

    // blinking text cursor
    this.nextCursorChange -= delta;
    if (this.nextCursorChange < 0) {
        this.nextCursorChange = this.cursorInterval;
        this.cursorVisible = !this.cursorVisible;
    }
    if (this.cursorVisible) {
        this.appendLetter('_');
    }

    // scrolling
    if (this.lines.length > this.maxLines) {
        this.scrollY += Math.ceil((delta / 1000) * this.scrollSpeed);

        if (this.scrollY >= this.lineHeight) {
            this.lines.shift();
            this.scrollY = 0;
        }
    }

    // random words
    if (this.writing) {
        this.nextWord -= delta;
    }
    if (this.nextWord < 0 && this.writing) {
        this.nextWord = this.wordInterval + 5 * Math.random();
        if (!this.queue.length) {
            this.queue = this.words[Math.floor(this.words.length * Math.random())].toUpperCase().split(',');
            this.queue.unshift(this.wordSeparator);
            this.queue.push(this.wordSeparator);
        }
    }

    // reflection
    this.reflectionCtx.putImageData(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height), 0, 0);
};

/**
* Rendering part of animation loop.
*
* @method render
*/
Enigma.prototype.render = function () {
    var c = this.ctx;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0, ii = this.lines.length; i < ii; ++i) {
        // animate first line opacity when scrolling
        if (i === 0 && this.scrollY !== 0) {
            c.globalAlpha = 1 - this.scrollY / this.lineHeight;
        } else {
            c.globalAlpha = 1;
        }
        // render line
        c.fillText(this.lines[i], this.baseX, this.baseY - this.scrollY + i * this.lineHeight);
    }
};