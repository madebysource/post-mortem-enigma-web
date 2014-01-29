var _gaq = [['_setAccount', '<%= pkg.analytics %>'], ['_trackPageview']];

var enigma = new Enigma(document.getElementById('enigma'));

enigma.queue = 'enigma je mrtva'.toUpperCase().split('');
enigma.nextLetterAppend = 1000;

enigma.start();
