'use strict';

var $         = require('jQuery');
var markdown  = require('markdown').markdown;
// EpicEditor package.json has no field main: we need to specify the path manually
// also it will expose himself globally as EpicEditor
require('epiceditor/src/editor');

// This is to be an example of locql import
// console.log(require('./clapou').pouic);

// We don't want useless div in our templates
// JS will create what we need in order to initialize the Epic Editor
$('textarea').each(function () {
  var $textarea  = $(this);
  $textarea.hide();
  var $container  = $('<div class="epiceditorContainer"></div>');
  $container.insertAfter($textarea);
  var editor = new EpicEditor({
    container:  $container[0],
    textarea:   $textarea[0],
    basePath:   '',
    parser:     markdown.toHTML,
    clientSideStorage: false,
  }).load();
});

